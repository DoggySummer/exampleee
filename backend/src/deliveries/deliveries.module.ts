import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { IsIn } from 'class-validator';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import {
  DELIVERY_FLOW,
  DELIVERY_STATUS,
  ORDER_STATUS,
  RIDER_STATUS,
} from '../common/constants';
import { IdPipe, validBody } from '../common/pipes';
import { toKstIso } from '../common/time';
import { isDuplicateError } from '../common/views';
import { Delivery, DeliveryHistory, Order, Restaurant, Rider } from '../entities';
import { AccessService, ViewsService } from '../shared/shared.module';

class DeliveryStatusDto {
  @IsIn([DELIVERY_STATUS.PICKED_UP, DELIVERY_STATUS.ON_THE_WAY, DELIVERY_STATUS.DONE])
  status: string;
}

const NOT_FOUND_DELIVERY = '배달을 찾을 수 없어요.';
const CANNOT_ACCEPT = '현재 이 주문을 수락할 수 없어요.';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly views: ViewsService,
    private readonly access: AccessService,
  ) {}

  // ───────── API 27 수락 가능한 주문 ─────────
  // 조리완료 + 아직 배정 안 됨. 수락 전에는 고객 배송주소를 주지 않는다.
  async available() {
    const rows = await this.ds.manager
      .createQueryBuilder(Order, 'o')
      .innerJoin(Restaurant, 'r', 'r.restaurant_id = o.restaurant_id')
      .leftJoin(Delivery, 'd', 'd.order_id = o.order_id')
      .where('o.status = :s', { s: ORDER_STATUS.COOKED })
      .andWhere('d.delivery_id IS NULL')
      .orderBy('o.order_id', 'ASC')
      .select([
        'o.order_id AS orderId',
        'r.restaurant_id AS storeId',
        'r.name AS storeName',
        'r.address AS pickupAddress',
        'o.delivery_fee AS deliveryFee',
      ])
      .getRawMany();
    return rows.map((r) => ({
      orderId: Number(r.orderId),
      storeId: Number(r.storeId),
      storeName: r.storeName,
      pickupAddress: r.pickupAddress,
      deliveryFee: Number(r.deliveryFee),
    }));
  }

  // ───────── API 28 라이더 배달 수락 (선착순) ─────────
  async accept(user: AuthUser, orderId: number): Promise<{ created: boolean; body: unknown }> {
    try {
      return await this.ds.transaction(async (m) => {
        // 주문 행을 잠가서 동시에 수락해도 한 명만 성공
        const order = await m.findOne(Order, { where: { id: orderId }, lock: { mode: 'pessimistic_write' } });
        if (!order) throw new NotFoundException('주문을 찾을 수 없어요.');

        const existing = await m.findOneBy(Delivery, { orderId });
        if (existing) {
          // 같은 라이더의 재요청 → 기존 배달 200, 다른 라이더 → 409 (재배정 없음)
          if (existing.riderId === user.id) return { created: false, body: await this.views.delivery(existing, m) };
          throw new ConflictException(CANNOT_ACCEPT);
        }
        if (order.status !== ORDER_STATUS.COOKED) throw new ConflictException(CANNOT_ACCEPT);

        const rider = await m.findOne(Rider, { where: { id: user.id }, lock: { mode: 'pessimistic_write' } });
        if (!rider || rider.status !== RIDER_STATUS.AVAILABLE) throw new ConflictException(CANNOT_ACCEPT);

        // 배달 생성 + 배정완료 이력 + 라이더 배달중 (한 트랜잭션)
        const delivery = await m.save(
          m.create(Delivery, { orderId, riderId: rider.id, status: DELIVERY_STATUS.ASSIGNED }),
        );
        await m.save(
          m.create(DeliveryHistory, {
            deliveryId: delivery.id,
            status: DELIVERY_STATUS.ASSIGNED,
            changedAt: new Date(),
          }),
        );
        rider.status = RIDER_STATUS.DELIVERING;
        await m.save(rider);

        return { created: true, body: await this.views.delivery(delivery, m) };
      });
    } catch (e) {
      if (isDuplicateError(e)) throw new ConflictException(CANNOT_ACCEPT);
      throw e;
    }
  }

  // ───────── API 29 주문 배달 조회 ─────────
  async byOrder(user: AuthUser, orderId: number) {
    const msg = '배달 정보가 아직 없거나 주문을 찾을 수 없어요.';
    const order = await this.ds.manager.findOneBy(Order, { id: orderId });
    if (!order) throw new NotFoundException(msg);
    const delivery = await this.ds.manager.findOneBy(Delivery, { orderId });
    if (user.role !== 'RIDER') await this.access.assertRelated(user, order, delivery);
    if (!delivery) throw new NotFoundException(msg);
    if (user.role === 'RIDER' && delivery.riderId !== user.id) {
      throw new ForbiddenException('권한이 없어요.');
    }
    return this.views.delivery(delivery);
  }

  // ───────── API 30 배달 목록 ─────────
  async list(user: AuthUser) {
    const qb = this.ds.manager
      .createQueryBuilder(Delivery, 'd')
      .innerJoin(Order, 'o', 'o.order_id = d.order_id')
      .orderBy('d.delivery_id', 'DESC');
    if (user.role === 'CUSTOMER') qb.where('o.customer_id = :id', { id: user.id });
    else if (user.role === 'RIDER') qb.where('d.rider_id = :id', { id: user.id });
    else {
      const storeId = await this.access.myStoreId(user.id);
      if (storeId === null) return [];
      qb.where('o.restaurant_id = :storeId', { storeId });
    }
    return this.views.deliveries(await qb.getMany());
  }

  private async getRelatedDelivery(user: AuthUser, id: number) {
    const delivery = await this.ds.manager.findOneBy(Delivery, { id });
    if (!delivery) throw new NotFoundException(NOT_FOUND_DELIVERY);
    const order = await this.ds.manager.findOneByOrFail(Order, { id: delivery.orderId });
    await this.access.assertRelated(user, order, delivery);
    return delivery;
  }

  // ───────── API 31 배달 상세 ─────────
  async detail(user: AuthUser, id: number) {
    return this.views.delivery(await this.getRelatedDelivery(user, id));
  }

  // ───────── API 32 배달 상태이력 ─────────
  async history(user: AuthUser, id: number) {
    const delivery = await this.getRelatedDelivery(user, id);
    const rows = await this.ds.manager.find(DeliveryHistory, {
      where: { deliveryId: delivery.id },
      order: { changedAt: 'ASC', id: 'ASC' },
    });
    return rows.map((h) => ({
      id: h.id,
      deliveryId: h.deliveryId,
      status: h.status,
      changedAt: toKstIso(h.changedAt),
    }));
  }

  // ───────── API 33 배달 상태 변경 ─────────
  async changeStatus(user: AuthUser, id: number, next: string) {
    return this.ds.transaction(async (m) => {
      const delivery = await m.findOne(Delivery, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!delivery) throw new NotFoundException(NOT_FOUND_DELIVERY);
      if (delivery.riderId !== user.id) throw new ForbiddenException('권한이 없어요.');

      // 같은 상태 재요청 → 200, 이력 추가 안 함
      if (delivery.status === next) return this.views.delivery(delivery, m);

      // 배정완료 → 픽업완료 → 배달중 → 배달완료 (한 단계씩만)
      if (DELIVERY_FLOW.indexOf(next) !== DELIVERY_FLOW.indexOf(delivery.status) + 1) {
        throw new ConflictException('현재 배달상태에서 변경할 수 없어요.');
      }

      delivery.status = next;
      await m.save(delivery);
      await m.save(m.create(DeliveryHistory, { deliveryId: delivery.id, status: next, changedAt: new Date() }));

      if (next === DELIVERY_STATUS.DONE) {
        await m.update(Rider, { id: delivery.riderId }, { status: RIDER_STATUS.AVAILABLE });
      }
      // 주문상태는 조리완료 그대로 유지
      return this.views.delivery(delivery, m);
    });
  }
}

@Controller()
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  /** API 27 수락 가능한 주문 — GET /api/deliveries/available */
  @ApiTags('7 라이더 배달')
  @Roles('RIDER')
  @Get('deliveries/available')
  available() {
    return this.service.available();
  }

  /** API 28 라이더 배달 수락 — POST /api/orders/{orderId}/delivery/accept (201, 같은 라이더 재요청 200) */
  @ApiTags('7 라이더 배달')
  @Roles('RIDER')
  @Post('orders/:orderId/delivery/accept')
  async accept(
    @CurrentUser() user: AuthUser,
    @Param('orderId', IdPipe) orderId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { created, body } = await this.service.accept(user, orderId);
    res.status(created ? 201 : 200);
    return body;
  }

  /** API 29 주문 배달 조회 — GET /api/orders/{orderId}/delivery */
  @ApiTags('7 라이더 배달')
  @Get('orders/:orderId/delivery')
  byOrder(@CurrentUser() user: AuthUser, @Param('orderId', IdPipe) orderId: number) {
    return this.service.byOrder(user, orderId);
  }

  /** API 30 배달 목록 — GET /api/deliveries */
  @ApiTags('7 라이더 배달')
  @Get('deliveries')
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user);
  }

  /** API 31 배달 상세 — GET /api/deliveries/{deliveryId} */
  @ApiTags('7 라이더 배달')
  @Get('deliveries/:deliveryId')
  detail(@CurrentUser() user: AuthUser, @Param('deliveryId', IdPipe) id: number) {
    return this.service.detail(user, id);
  }

  /** API 32 배달 상태이력 — GET /api/deliveries/{deliveryId}/history */
  @ApiTags('7 라이더 배달')
  @Get('deliveries/:deliveryId/history')
  history(@CurrentUser() user: AuthUser, @Param('deliveryId', IdPipe) id: number) {
    return this.service.history(user, id);
  }

  /** API 33 배달 상태 변경 — PATCH /api/deliveries/{deliveryId}/status */
  @ApiTags('7 라이더 배달')
  @Roles('RIDER')
  @Patch('deliveries/:deliveryId/status')
  changeStatus(
    @CurrentUser() user: AuthUser,
    @Param('deliveryId', IdPipe) id: number,
    @Body(validBody('배달상태를 확인해 주세요.')) dto: DeliveryStatusDto,
  ) {
    return this.service.changeStatus(user, id, dto.status);
  }
}

@Module({
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
