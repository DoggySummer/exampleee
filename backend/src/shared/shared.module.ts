import { ForbiddenException, Global, Injectable, Module } from '@nestjs/common';
import { InjectDataSource, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { AuthUser } from '../auth/auth.decorators';
import { DELIVERY_STATUS } from '../common/constants';
import { toKstIso } from '../common/time';
import { paymentView } from '../common/views';
import {
  Delivery, DeliveryHistory, ENTITIES, Menu, Order, OrderItem, Payment, Restaurant,
} from '../entities';

/** 주문·배달 응답 조립 (명세의 Order / Delivery 객체) */
@Injectable()
export class ViewsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /**
   * Delivery 객체
   * pickupAddress = 음식점 주소, addressSnapshot = 주문시주소, deliveryFee = 주문 배달비,
   * completedAt = 배달완료 이력 시각 (완료 전 null)
   */
  async deliveries(list: Delivery[], m: EntityManager = this.ds.manager) {
    if (list.length === 0) return [];
    const orders = await m.findBy(Order, { id: In(list.map((d) => d.orderId)) });
    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const stores = await m.findBy(Restaurant, { id: In([...new Set(orders.map((o) => o.restaurantId))]) });
    const storeMap = new Map(stores.map((s) => [s.id, s]));
    const done = await m.findBy(DeliveryHistory, {
      deliveryId: In(list.map((d) => d.id)),
      status: DELIVERY_STATUS.DONE,
    });
    const doneMap = new Map(done.map((h) => [h.deliveryId, h.changedAt]));

    return list.map((d) => {
      const o = orderMap.get(d.orderId)!;
      return {
        id: d.id,
        orderId: d.orderId,
        riderId: d.riderId,
        status: d.status,
        pickupAddress: storeMap.get(o.restaurantId)?.address ?? null,
        addressSnapshot: o.orderAddress,
        deliveryFee: o.deliveryFee,
        completedAt: toKstIso(doneMap.get(d.id)),
      };
    });
  }

  /** Order 객체 (items · payment · delivery 포함) */
  async orders(list: Order[], m: EntityManager = this.ds.manager) {
    if (list.length === 0) return [];
    const ids = list.map((o) => o.id);
    const items = await m.find(OrderItem, { where: { orderId: In(ids) }, order: { id: 'ASC' } });
    const menus = items.length
      ? await m.findBy(Menu, { id: In([...new Set(items.map((i) => i.menuId))]) })
      : [];
    const menuName = new Map(menus.map((x) => [x.id, x.name]));
    const payments = await m.findBy(Payment, { orderId: In(ids) });
    const paymentMap = new Map(payments.map((p) => [p.orderId, p]));
    const deliveries = await m.findBy(Delivery, { orderId: In(ids) });
    const deliveryViews = await this.deliveries(deliveries, m);
    const deliveryMap = new Map(deliveryViews.map((d) => [d.orderId, d]));

    return list.map((o) => {
      const p = paymentMap.get(o.id);
      return {
        id: o.id,
        customerId: o.customerId,
        storeId: o.restaurantId,
        addressId: o.addressId,
        addressSnapshot: o.orderAddress,
        status: o.status,
        createdAt: toKstIso(o.orderedTime),
        totalAmount: o.totalAmount,
        deliveryFee: o.deliveryFee,
        items: items
          .filter((i) => i.orderId === o.id)
          .map((i) => ({
            id: i.id,
            orderId: i.orderId,
            menuId: i.menuId,
            menuName: menuName.get(i.menuId) ?? null, // 현재 메뉴명
            quantity: i.quantity,
            unitPrice: i.unitPrice, // 주문 당시 단가
            lineTotal: i.quantity * i.unitPrice,
          })),
        payment: p ? paymentView(p) : null,
        delivery: deliveryMap.get(o.id) ?? null,
      };
    });
  }

  async order(o: Order, m?: EntityManager) {
    return (await this.orders([o], m))[0];
  }

  async delivery(d: Delivery, m?: EntityManager) {
    return (await this.deliveries([d], m))[0];
  }
}

/** "관련 고객·점주·배정 라이더" 권한 확인 */
@Injectable()
export class AccessService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /** 점주의 음식점 id (없으면 null) */
  async myStoreId(ownerId: number): Promise<number | null> {
    const s = await this.ds.manager.findOneBy(Restaurant, { ownerId });
    return s?.id ?? null;
  }

  /** 이 주문과 관련된 사용자인지 */
  async isRelated(user: AuthUser, order: Order, delivery?: Delivery | null): Promise<boolean> {
    if (user.role === 'CUSTOMER') return order.customerId === user.id;
    if (user.role === 'OWNER') return (await this.myStoreId(user.id)) === order.restaurantId;
    if (delivery === undefined) delivery = await this.ds.manager.findOneBy(Delivery, { orderId: order.id });
    return !!delivery && delivery.riderId === user.id;
  }

  async assertRelated(user: AuthUser, order: Order, delivery?: Delivery | null) {
    if (!(await this.isRelated(user, order, delivery))) throw new ForbiddenException('권한이 없어요.');
  }
}

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  providers: [ViewsService, AccessService],
  exports: [TypeOrmModule, ViewsService, AccessService],
})
export class SharedModule {}
