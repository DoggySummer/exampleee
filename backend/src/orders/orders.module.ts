import { ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Response } from 'express';
import { DataSource, In } from 'typeorm';
import { AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import {
  INT_MAX,
  ORDER_STATUS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  STORE_STATUS,
} from '../common/constants';
import { IdPipe, validBody } from '../common/pipes';
import { paymentView } from '../common/views';
import { Address, Delivery, Menu, Order, OrderItem, Payment, Restaurant } from '../entities';
import { AccessService, ViewsService } from '../shared/shared.module';

class OrderItemDto {
  @IsInt() @Min(1) @Max(INT_MAX) menuId: number;
  @IsInt() @Min(1) @Max(INT_MAX) quantity: number;
}

class PaymentDto {
  @IsIn(PAYMENT_METHODS) method: string;
  /**
   * (명세 외 · 시연용) true 면 결제실패로 저장한다.
   * 외부 결제 연동이 없어서 "결제실패"를 재현할 방법이 필요해 추가. 안 보내면 결제 성공.
   */
  @IsOptional() @IsBoolean() simulateFailure?: boolean;
}

class CreateOrderDto {
  @IsInt() @Min(1) @Max(INT_MAX) storeId: number;
  @IsInt() @Min(1) @Max(INT_MAX) addressId: number;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
  @ValidateNested() @Type(() => PaymentDto) payment: PaymentDto;
}

class OrderStatusDto {
  @IsIn([ORDER_STATUS.COOKING, ORDER_STATUS.COOKED, ORDER_STATUS.REJECTED]) status: string;
}

// 점주가 바꿀 수 있는 상태: 접수대기 → 조리중|거절, 조리중 → 조리완료
const OWNER_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUS.WAITING]: [ORDER_STATUS.COOKING, ORDER_STATUS.REJECTED],
  [ORDER_STATUS.COOKING]: [ORDER_STATUS.COOKED],
};

const NOT_FOUND_ORDER = '주문을 찾을 수 없어요.';

@Injectable()
export class OrdersService {
  /**
   * Idempotency-Key 기록 (메모리). "역할:계정:키" → 요청 내용 + 만들어진 주문
   * 서버 재시작 시 비워진다 (과제 범위).
   */
  private readonly idempotency = new Map<string, { hash: string; orderId: Promise<number> }>();

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly views: ViewsService,
    private readonly access: AccessService,
  ) {}

  // ───────── API 19 주문과 결제 생성 ─────────
  async create(user: AuthUser, dto: CreateOrderDto, key?: string) {
    if (key === undefined) return { created: true, body: await this.createOrder(user, dto) };

    if (key.length < 1 || key.length > 200) throw new BadRequestException('주문 정보를 확인해 주세요.');
    const mapKey = `${user.role}:${user.id}:${key}`;
    const hash = JSON.stringify(dto);
    const prev = this.idempotency.get(mapKey);

    if (prev) {
      if (prev.hash !== hash) throw new ConflictException('주문할 수 없는 상태예요.');
      // 같은 키 + 같은 요청 → 처음 만든 주문을 200으로
      const order = await this.ds.manager.findOneByOrFail(Order, { id: await prev.orderId });
      return { created: false, body: await this.views.order(order) };
    }

    const pending = this.createOrder(user, dto).then((v) => v.id);
    this.idempotency.set(mapKey, { hash, orderId: pending });
    try {
      const id = await pending;
      const order = await this.ds.manager.findOneByOrFail(Order, { id });
      return { created: true, body: await this.views.order(order) };
    } catch (e) {
      this.idempotency.delete(mapKey); // 저장 실패면 같은 키로 다시 시도 가능
      throw e;
    }
  }

  private async createOrder(user: AuthUser, dto: CreateOrderDto) {
    const m = this.ds.manager;
    const store = await m.findOneBy(Restaurant, { id: dto.storeId });
    const address = await m.findOneBy(Address, { id: dto.addressId, customerId: user.id });
    if (!store || !address) throw new NotFoundException('주문할 데이터를 찾을 수 없어요.');

    // 같은 menuId 는 수량을 합친다
    const qty = new Map<number, number>();
    for (const it of dto.items) qty.set(it.menuId, (qty.get(it.menuId) ?? 0) + it.quantity);

    const menus = await m.findBy(Menu, { id: In([...qty.keys()]) });
    if (menus.length !== qty.size) throw new NotFoundException('주문할 데이터를 찾을 수 없어요.');
    if (menus.some((x) => x.restaurantId !== store.id)) {
      throw new BadRequestException('주문 정보를 확인해 주세요.'); // 다른 가게 메뉴
    }

    if (store.status !== STORE_STATUS.OPEN) throw new ConflictException('주문할 수 없는 상태예요.');

    // 주문금액 = 메뉴 합계 (배달비 제외), 결제금액 = 주문금액 + 배달비
    const lines = menus
      .sort((a, b) => a.id - b.id)
      .map((x) => ({ menuId: x.id, quantity: qty.get(x.id)!, unitPrice: x.price }));
    const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const fee = store.deliveryFee;
    if (lines.some((l) => l.quantity > INT_MAX) || total + fee > INT_MAX) {
      throw new BadRequestException('주문 정보를 확인해 주세요.');
    }

    const failed = dto.payment.simulateFailure === true;
    const snapshot = [address.address, address.detailAddress].filter(Boolean).join(' ');

    // 주문 + 주문상세 + 결제를 한 트랜잭션으로 (하나라도 실패하면 전부 취소)
    const order = await this.ds.transaction(async (tx) => {
      const o = await tx.save(
        tx.create(Order, {
          customerId: user.id,
          restaurantId: store.id,
          orderedTime: new Date(),
          status: failed ? ORDER_STATUS.PAYMENT_FAILED : ORDER_STATUS.WAITING,
          addressId: address.id,
          orderAddress: snapshot,
          totalAmount: total,
          deliveryFee: fee,
        }),
      );
      await tx.save(lines.map((l) => tx.create(OrderItem, { ...l, orderId: o.id })));
      await tx.save(
        tx.create(Payment, {
          orderId: o.id,
          method: dto.payment.method,
          amount: total + fee,
          status: failed ? PAYMENT_STATUS.FAILED : PAYMENT_STATUS.DONE,
          canceledAt: null,
        }),
      );
      return o;
    });

    return this.views.order(order);
  }

  // ───────── API 20 주문 목록 ─────────
  async list(user: AuthUser, status?: string) {
    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      throw new BadRequestException('주문상태를 확인해 주세요.');
    }
    const qb = this.ds.manager.createQueryBuilder(Order, 'o').orderBy('o.order_id', 'DESC');
    if (status) qb.andWhere('o.status = :status', { status });

    if (user.role === 'CUSTOMER') {
      qb.andWhere('o.customer_id = :id', { id: user.id });
    } else if (user.role === 'OWNER') {
      const storeId = await this.access.myStoreId(user.id);
      if (storeId === null) return [];
      // 점주 목록은 결제완료 주문만
      qb.andWhere('o.restaurant_id = :storeId', { storeId }).innerJoin(
        Payment, 'p', 'p.order_id = o.order_id AND p.status = :paid', { paid: PAYMENT_STATUS.DONE },
      );
    } else {
      qb.innerJoin(Delivery, 'd', 'd.order_id = o.order_id AND d.rider_id = :id', { id: user.id });
    }
    return this.views.orders(await qb.getMany());
  }

  private async getRelatedOrder(user: AuthUser, id: number) {
    const order = await this.ds.manager.findOneBy(Order, { id });
    if (!order) throw new NotFoundException(NOT_FOUND_ORDER);
    await this.access.assertRelated(user, order);
    return order;
  }

  // ───────── API 21 주문 상세 ─────────
  async detail(user: AuthUser, id: number) {
    return this.views.order(await this.getRelatedOrder(user, id));
  }

  // ───────── API 22 점주 주문 상태 변경 ─────────
  async changeStatus(user: AuthUser, id: number, next: string) {
    return this.ds.transaction(async (m) => {
      // 두 창에서 동시에 눌러도 한 번만 처리되도록 행 잠금
      const order = await m.findOne(Order, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new NotFoundException(NOT_FOUND_ORDER);
      const store = await m.findOneBy(Restaurant, { id: order.restaurantId });
      if (store?.ownerId !== user.id) throw new ForbiddenException('권한이 없어요.');

      if (order.status === next) return this.views.order(order, m); // 같은 상태 재요청 → 200

      if (!(OWNER_TRANSITIONS[order.status] ?? []).includes(next)) {
        throw new ConflictException('현재 주문상태에서 변경할 수 없어요.');
      }

      order.status = next;
      await m.save(order);

      if (next === ORDER_STATUS.REJECTED) {
        // 거절 → 결제 취소완료 + 취소일자 (같은 트랜잭션)
        await m.update(Payment, { orderId: order.id }, {
          status: PAYMENT_STATUS.CANCELED,
          canceledAt: new Date(),
        });
      }
      return this.views.order(order, m);
    });
  }

  // ───────── API 23 주문 결제 조회 ─────────
  async payments(user: AuthUser, id: number) {
    const order = await this.getRelatedOrder(user, id);
    const rows = await this.ds.manager.findBy(Payment, { orderId: order.id });
    return rows.map(paymentView);
  }
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  /** API 19 주문과 결제 생성 — POST /api/orders (201, 같은 Idempotency-Key 재요청은 200) */
  @ApiTags('5 주문')
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: '주문 시도별 키 (1~200자). 같은 키·같은 요청 재전송은 처음 주문을 200으로 반환' })
  @Roles('CUSTOMER')
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(validBody('주문 정보를 확인해 주세요.')) dto: CreateOrderDto,
    @Headers('idempotency-key') key: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { created, body } = await this.service.create(user, dto, key);
    res.status(created ? 201 : 200);
    return body;
  }

  /** API 20 주문 목록 — GET /api/orders?status= */
  @ApiTags('5 주문')
  @Get()
  list(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.service.list(user, status || undefined);
  }

  /** API 21 주문 상세 — GET /api/orders/{orderId} */
  @ApiTags('5 주문')
  @Get(':orderId')
  detail(@CurrentUser() user: AuthUser, @Param('orderId', IdPipe) id: number) {
    return this.service.detail(user, id);
  }

  /** API 22 점주 주문 상태 변경 — PATCH /api/orders/{orderId}/status */
  @ApiTags('5 주문')
  @Roles('OWNER')
  @Patch(':orderId/status')
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('orderId', IdPipe) id: number,
    @Body(validBody('주문상태를 확인해 주세요.')) dto: OrderStatusDto,
  ) {
    return this.service.changeStatus(user, id, dto.status);
  }

  /** API 23 주문 결제 조회 — GET /api/orders/{orderId}/payments */
  @ApiTags('6 결제 조회')
  @Roles('CUSTOMER', 'OWNER')
  @Get(':orderId/payments')
  payments(@CurrentUser() user: AuthUser, @Param('orderId', IdPipe) id: number) {
    return this.service.payments(user, id);
  }
}

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
