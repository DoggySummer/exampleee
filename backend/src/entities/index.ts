// 배달플랫폼_테이블정의서 13개 테이블. 컬럼명은 정의서 그대로(snake_case), 속성명은 camelCase.
// 테이블 생성은 database/schema.sql 로 한다 (CHECK 제약 포함).
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn({ name: 'customer_id' }) id: number;
  @Column({ length: 30 }) name: string;
  @Column({ length: 100, unique: true }) email: string;
  @Column({ length: 20 }) phone: string;
  @Column({ name: 'password_hash', length: 255 }) passwordHash: string;
}

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn({ name: 'address_id' }) id: number;
  @Column({ name: 'customer_id' }) customerId: number;
  @Column({ length: 200 }) address: string;
  @Column({ name: 'address_detail', type: 'varchar', length: 100, nullable: true })
  detailAddress: string | null;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ name: 'order_id' }) id: number;
  @Column({ name: 'customer_id' }) customerId: number;
  @Column({ name: 'restaurant_id' }) restaurantId: number;
  @Column({ name: 'ordered_time', type: 'datetime' }) orderedTime: Date;
  @Column({ length: 10 }) status: string;
  @Column({ name: 'address_id' }) addressId: number;
  @Column({ name: 'order_address', length: 300 }) orderAddress: string;
  @Column({ name: 'total_amount' }) totalAmount: number;
  @Column({ name: 'delivery_fee' }) deliveryFee: number;
}

@Entity('order_item')
export class OrderItem {
  @PrimaryGeneratedColumn({ name: 'order_item_id' }) id: number;
  @Column({ name: 'order_id' }) orderId: number;
  @Column({ name: 'menu_id' }) menuId: number;
  @Column() quantity: number;
  @Column({ name: 'unit_price' }) unitPrice: number;
}

@Entity('owner')
export class Owner {
  @PrimaryGeneratedColumn({ name: 'owner_id' }) id: number;
  @Column({ length: 100, unique: true }) email: string;
  @Column({ name: 'password_hash', length: 255 }) passwordHash: string;
  @Column({ length: 30 }) name: string;
}

@Entity('restaurant')
export class Restaurant {
  @PrimaryGeneratedColumn({ name: 'restaurant_id' }) id: number;
  @Column({ length: 50 }) name: string;
  @Column({ length: 200 }) address: string;
  @Column({ length: 10, default: '영업종료' }) status: string;
  @Column({ name: 'owner_id', unique: true }) ownerId: number;
  @Column({ name: 'delivery_fee', default: 0 }) deliveryFee: number;
}

@Entity('menu')
export class Menu {
  @PrimaryGeneratedColumn({ name: 'menu_id' }) id: number;
  @Column({ name: 'restaurant_id' }) restaurantId: number;
  @Column({ length: 50 }) name: string;
  @Column() price: number;
}

@Entity('rider')
export class Rider {
  @PrimaryGeneratedColumn({ name: 'rider_id' }) id: number;
  @Column({ length: 30 }) name: string;
  @Column({ length: 20 }) phone: string;
  @Column({ length: 10, default: '운행종료' }) status: string;
  @Column({ length: 100, unique: true }) email: string;
  @Column({ name: 'password_hash', length: 255 }) passwordHash: string;
}

@Entity('delivery')
export class Delivery {
  @PrimaryGeneratedColumn({ name: 'delivery_id' }) id: number;
  @Column({ name: 'order_id', unique: true }) orderId: number;
  @Column({ name: 'rider_id' }) riderId: number;
  @Column({ length: 10, default: '배정완료' }) status: string;
}

@Entity('delivery_history')
@Unique(['deliveryId', 'status'])
export class DeliveryHistory {
  @PrimaryGeneratedColumn({ name: 'history_id' }) id: number;
  @Column({ name: 'delivery_id' }) deliveryId: number;
  @Column({ length: 10 }) status: string;
  @Column({ name: 'changed_at', type: 'datetime' }) changedAt: Date;
}

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn({ name: 'payment_id' }) id: number;
  @Column({ name: 'order_id', unique: true }) orderId: number;
  @Column({ length: 10 }) method: string;
  @Column() amount: number;
  @Column({ length: 10 }) status: string;
  @Column({ name: 'canceled_at', type: 'datetime', nullable: true }) canceledAt: Date | null;
}

@Entity('settlement')
export class Settlement {
  @PrimaryGeneratedColumn({ name: 'settlement_id' }) id: number;
  @Column({ name: 'restaurant_id', type: 'int', nullable: true }) restaurantId: number | null;
  @Column({ name: 'rider_id', type: 'int', nullable: true }) riderId: number | null;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @Column() amount: number;
  @Column({ length: 10, default: '생성완료' }) status: string;
}

@Entity('settlement_item')
@Unique(['orderId', 'payTarget'])
export class SettlementItem {
  @PrimaryGeneratedColumn({ name: 'settlement_item_id' }) id: number;
  @Column({ name: 'settlement_id' }) settlementId: number;
  @Column({ name: 'order_id' }) orderId: number;
  @Column({ name: 'pay_target', length: 10 }) payTarget: string;
  @Column({ name: 'pay_amount' }) payAmount: number;
}

export const ENTITIES = [
  Customer, Address, Order, OrderItem, Owner, Restaurant, Menu,
  Rider, Delivery, DeliveryHistory, Payment, Settlement, SettlementItem,
];
