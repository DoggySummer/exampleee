import {
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import { IdPipe } from '../common/pipes';
import { paymentView } from '../common/views';
import { Order, Payment } from '../entities';
import { AccessService } from '../shared/shared.module';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly access: AccessService,
  ) {}

  // API 24: 고객은 본인 주문, 점주는 본인 음식점 주문의 결제. 결제 id 내림차순
  async list(user: AuthUser) {
    const qb = this.ds.manager
      .createQueryBuilder(Payment, 'p')
      .innerJoin(Order, 'o', 'o.order_id = p.order_id')
      .orderBy('p.payment_id', 'DESC');
    if (user.role === 'CUSTOMER') {
      qb.where('o.customer_id = :id', { id: user.id });
    } else {
      const storeId = await this.access.myStoreId(user.id);
      if (storeId === null) return [];
      qb.where('o.restaurant_id = :storeId', { storeId });
    }
    return (await qb.getMany()).map(paymentView);
  }

  // API 25
  async detail(user: AuthUser, id: number) {
    const p = await this.ds.manager.findOneBy(Payment, { id });
    if (!p) throw new NotFoundException('결제를 찾을 수 없어요.');
    const order = await this.ds.manager.findOneByOrFail(Order, { id: p.orderId });
    if (!(await this.access.isRelated(user, order))) throw new ForbiddenException('권한이 없어요.');
    return paymentView(p);
  }
}

@Roles('CUSTOMER', 'OWNER')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  /** API 24 결제 목록 — GET /api/payments */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user);
  }

  /** API 25 결제 상세 — GET /api/payments/{paymentId} */
  @Get(':paymentId')
  detail(@CurrentUser() user: AuthUser, @Param('paymentId', IdPipe) id: number) {
    return this.service.detail(user, id);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
