import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, Owner, Rider } from '../entities';
import { AccountsService } from './accounts.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from './token-blacklist.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Owner, Rider]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev-only-secret',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountsService,
    TokenBlacklistService,
    { provide: APP_GUARD, useClass: AuthGuard }, // 모든 API에 인증 가드 적용
  ],
  exports: [AccountsService],
})
export class AuthModule {}
