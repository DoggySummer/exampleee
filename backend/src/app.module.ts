import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesModule } from './addresses/addresses.module';
import { AuthModule } from './auth/auth.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { ENTITIES } from './entities';
import { HealthController } from './health/health.controller';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SettlementsModule } from './settlements/settlements.module';
import { SharedModule } from './shared/shared.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'mysql',
        host: c.get('DB_HOST', 'localhost'),
        port: Number(c.get('DB_PORT', 3306)),
        username: c.get('DB_USER', 'root'),
        password: c.get('DB_PASSWORD', ''),
        database: c.get('DB_NAME', 'delivery_app'),
        entities: ENTITIES,
        synchronize: false, // 테이블은 database/schema.sql 로 생성
        timezone: '+09:00', // DATETIME 을 한국시간으로 저장·조회
        charset: 'utf8mb4',
        dateStrings: ['DATE'], // DATE 컬럼은 'YYYY-MM-DD' 문자열로
      }),
    }),
    SharedModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    StoresModule,
    OrdersModule,
    PaymentsModule,
    DeliveriesModule,
    SettlementsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
