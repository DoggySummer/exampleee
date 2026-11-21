import { ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Injectable,
  Logger,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { IsOptional, IsString } from 'class-validator';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { AuthUser, CurrentUser, Public, Roles } from '../auth/auth.decorators';
import {
  DELIVERY_STATUS,
  PAY_TARGET,
  PAYMENT_STATUS,
  SETTLEMENT_STATUS,
} from '../common/constants';
import { IdPipe, validBody } from '../common/pipes';
import { addDays, isMonday, isValidDateString, kstToday, mondayOf } from '../common/time';
import { settlementItemView, settlementView } from '../common/views';
import { Settlement, SettlementItem } from '../entities';
import { AccessService } from '../shared/shared.module';

const BAD_START_DATE = '정산시작일은 월요일 날짜로 입력해 주세요.';

function assertMonday(startDate: string) {
  if (!isValidDateString(startDate) || !isMonday(startDate)) throw new BadRequestException(BAD_START_DATE);
}

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger('Settlement');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly access: AccessService,
  ) {}

  // ───────── API 34 주간 정산 목록 ─────────
  async list(user: AuthUser, startDate?: string) {
    if (startDate !== undefined) assertMonday(startDate);
    const where: Record<string, unknown> = {};
    if (user.role === 'OWNER') {
      const storeId = await this.access.myStoreId(user.id);
      if (storeId === null) return [];
      where.restaurantId = storeId;
    } else {
      where.riderId = user.id;
    }
    if (startDate) where.startDate = startDate;
    const rows = await this.ds.manager.find(Settlement, {
      where,
      order: { startDate: 'DESC', id: 'DESC' },
    });
    return rows.map(settlementView);
  }

  // ───────── API 35 정산 상세 + 주문별 지급 내역 ─────────
  async detail(user: AuthUser, id: number) {
    const s = await this.ds.manager.findOneBy(Settlement, { id });
    if (!s) throw new NotFoundException('정산을 찾을 수 없어요.');
    const mine =
      user.role === 'OWNER'
        ? s.restaurantId !== null && s.restaurantId === (await this.access.myStoreId(user.id))
        : s.riderId === user.id;
    if (!mine) throw new ForbiddenException('권한이 없어요.');
    const items = await this.ds.manager.find(SettlementItem, {
      where: { settlementId: s.id },
      order: { id: 'ASC' },
    });
    return { ...settlementView(s), items: items.map(settlementItemView) };
  }

  // ───────── 주간 정산 생성 ─────────
  /**
   * 확인사항.txt ⑦ + 운영 규칙 A·B·C
   * - startDate(월)~일요일 사이에 "배달완료" 된 주문만 (배달완료 시각 기준)
   * - 주문 1건 → 음식점 몫(주문금액) + 라이더 몫(배달비), 수수료 없음
   * - 정산 1건은 음식점 또는 라이더 하나. 같은 대상·같은 주는 다시 만들지 않음
   */
  async generateWeek(startDate: string) {
    assertMonday(startDate);
    const endDate = addDays(startDate, 6);
    const from = `${startDate} 00:00:00`;
    const to = `${addDays(startDate, 7)} 00:00:00`;

    return this.ds.transaction(async (m) => {
      const rows: Array<{
        orderId: number; restaurantId: number; riderId: number; totalAmount: number; deliveryFee: number;
      }> = (
        await m.query(
          `SELECT o.order_id AS orderId, o.restaurant_id AS restaurantId, d.rider_id AS riderId,
                  o.total_amount AS totalAmount, o.delivery_fee AS deliveryFee
             FROM delivery_history h
             JOIN delivery d ON d.delivery_id = h.delivery_id
             JOIN orders o   ON o.order_id = d.order_id
             JOIN payment p  ON p.order_id = o.order_id AND p.status = ?
            WHERE h.status = ? AND h.changed_at >= ? AND h.changed_at < ?
            ORDER BY o.order_id`,
          [PAYMENT_STATUS.DONE, DELIVERY_STATUS.DONE, from, to],
        )
      ).map((r: Record<string, unknown>) => ({
        orderId: Number(r.orderId),
        restaurantId: Number(r.restaurantId),
        riderId: Number(r.riderId),
        totalAmount: Number(r.totalAmount),
        deliveryFee: Number(r.deliveryFee),
      }));

      const byStore = new Map<number, { orderId: number; amount: number }[]>();
      const byRider = new Map<number, { orderId: number; amount: number }[]>();
      for (const r of rows) {
        byStore.set(r.restaurantId, [...(byStore.get(r.restaurantId) ?? []), { orderId: r.orderId, amount: r.totalAmount }]);
        byRider.set(r.riderId, [...(byRider.get(r.riderId) ?? []), { orderId: r.orderId, amount: r.deliveryFee }]);
      }

      let created = 0;
      for (const [restaurantId, items] of byStore) {
        if (await this.createOne(m, { restaurantId, riderId: null }, PAY_TARGET.STORE, startDate, endDate, items)) created++;
      }
      for (const [riderId, items] of byRider) {
        if (await this.createOne(m, { restaurantId: null, riderId }, PAY_TARGET.RIDER, startDate, endDate, items)) created++;
      }
      this.logger.log(`${startDate} 주 정산 ${created}건 생성 (배달완료 주문 ${rows.length}건)`);
      return { startDate, endDate, created, orders: rows.length };
    });
  }

  private async createOne(
    m: EntityManager,
    target: { restaurantId: number | null; riderId: number | null },
    payTarget: string,
    startDate: string,
    endDate: string,
    items: { orderId: number; amount: number }[],
  ) {
    const exists = await m.existsBy(Settlement, {
      restaurantId: target.restaurantId ?? IsNull(),
      riderId: target.riderId ?? IsNull(),
      startDate,
    });
    if (exists) return false; // 규칙 C: 같은 대상·같은 주 중복 정산 X

    // 이미 다른 정산에 들어간 (주문, 몫)은 빼기
    const fresh: typeof items = [];
    for (const it of items) {
      if (!(await m.existsBy(SettlementItem, { orderId: it.orderId, payTarget }))) fresh.push(it);
    }
    if (fresh.length === 0) return false;

    const settlement = await m.save(
      m.create(Settlement, {
        ...target,
        startDate,
        endDate,
        amount: fresh.reduce((s, it) => s + it.amount, 0), // 정산금액 = 지급금액 합계
        status: SETTLEMENT_STATUS.CREATED,
      }),
    );
    await m.save(
      fresh.map((it) =>
        m.create(SettlementItem, {
          settlementId: settlement.id,
          orderId: it.orderId,
          payTarget,
          payAmount: it.amount,
        }),
      ),
    );
    return true;
  }

  /** 그 주의 생성완료 정산을 지급완료로 */
  async payWeek(startDate: string) {
    assertMonday(startDate);
    const result = await this.ds.manager.update(
      Settlement,
      { startDate, status: SETTLEMENT_STATUS.CREATED },
      { status: SETTLEMENT_STATUS.PAID },
    );
    return { startDate, paid: result.affected ?? 0 };
  }

  /** 지난주 월요일 */
  lastWeekMonday() {
    return addDays(mondayOf(kstToday()), -7);
  }

  // 규칙 A: 매주 월요일에 지난주(월~일)분을 한 번에 생성 (00:05 KST)
  @Cron('0 5 0 * * 1', { timeZone: 'Asia/Seoul' })
  async weeklyJob() {
    try {
      await this.generateWeek(this.lastWeekMonday());
    } catch (e) {
      this.logger.error(`주간 정산 생성 실패: ${(e as Error).message}`);
    }
  }
}

class WeekDto {
  @IsOptional() @IsString() startDate?: string;
}

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly service: SettlementsService) {}

  /** API 34 주간 정산 목록 — GET /api/settlements?startDate= */
  @ApiTags('8 정산 조회')
  @Roles('OWNER', 'RIDER')
  @Get()
  list(@CurrentUser() user: AuthUser, @Query('startDate') startDate?: string) {
    return this.service.list(user, startDate || undefined);
  }

  /** API 35 정산 상세와 주문별 지급 내역 — GET /api/settlements/{settlementId} */
  @ApiTags('8 정산 조회')
  @Roles('OWNER', 'RIDER')
  @Get(':settlementId')
  detail(@CurrentUser() user: AuthUser, @Param('settlementId', IdPipe) id: number) {
    return this.service.detail(user, id);
  }
}

/**
 * (명세 외 · 시연용) 정산 수동 실행. 헤더 X-Admin-Key 가 .env ADMIN_KEY 와 같아야 함.
 * ADMIN_KEY 를 비워 두면 이 API는 꺼진다(404).
 */
@ApiTags('정산 수동 실행 (명세 외 · 시연용)')
@ApiHeader({ name: 'X-Admin-Key', required: true, description: '.env 의 ADMIN_KEY' })
@Public()
@Controller('admin/settlements')
export class AdminSettlementsController {
  constructor(
    private readonly service: SettlementsService,
    private readonly config: ConfigService,
  ) {}

  private check(key?: string) {
    const adminKey = this.config.get<string>('ADMIN_KEY');
    if (!adminKey) throw new NotFoundException('요청한 API를 찾을 수 없어요.');
    if (key !== adminKey) throw new ForbiddenException('권한이 없어요.');
  }

  /** 정산 생성 — body { startDate?: 월요일 } (생략하면 지난주) */
  @Post('generate')
  @HttpCode(200)
  generate(@Headers('x-admin-key') key: string, @Body(validBody(BAD_START_DATE)) dto: WeekDto) {
    this.check(key);
    return this.service.generateWeek(dto.startDate ?? this.service.lastWeekMonday());
  }

  /** 지급완료 처리 — body { startDate?: 월요일 } (생략하면 지난주) */
  @Post('pay')
  @HttpCode(200)
  pay(@Headers('x-admin-key') key: string, @Body(validBody(BAD_START_DATE)) dto: WeekDto) {
    this.check(key);
    return this.service.payWeek(dto.startDate ?? this.service.lastWeekMonday());
  }
}

@Module({
  controllers: [SettlementsController, AdminSettlementsController],
  providers: [SettlementsService],
})
export class SettlementsModule {}
