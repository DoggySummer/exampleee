import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { DataSource, Not } from 'typeorm';
import { AccountsService } from '../auth/accounts.service';
import { AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import { DELIVERY_STATUS, RIDER_STATUS } from '../common/constants';
import { validBody } from '../common/pipes';
import { userView } from '../common/views';
import { Delivery, Rider } from '../entities';

class UpdateMeDto {
  @IsOptional() @IsString() @Length(1, 30) name?: string;
  @IsOptional() @IsString() @Length(1, 20) phone?: string;
}

class RiderStatusDto {
  @IsIn([RIDER_STATUS.AVAILABLE, RIDER_STATUS.OFF]) status: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly accounts: AccountsService,
    private readonly dataSource: DataSource,
  ) {}

  private async load(user: AuthUser) {
    const account = await this.accounts.findById(user.role, user.id);
    if (!account) throw new UnauthorizedException('로그인이 필요해요.');
    return account;
  }

  // API 04
  async me(user: AuthUser) {
    return userView(user.role, await this.load(user));
  }

  // API 05: 점주는 name만, 고객·라이더는 name/phone. role·email은 수정 불가
  async updateMe(user: AuthUser, dto: UpdateMeDto) {
    const changes: Record<string, string> = {};
    if (dto.name !== undefined) changes.name = dto.name;
    if (dto.phone !== undefined && user.role !== 'OWNER') changes.phone = dto.phone;
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('수정할 회원정보를 확인해 주세요.');
    }
    const account = await this.load(user);
    Object.assign(account, changes);
    return userView(user.role, await this.accounts.repo(user.role).save(account));
  }

  // API 26: 운행가능 / 운행종료. 진행 중 배달이 있으면 409
  async changeRiderStatus(user: AuthUser, status: string) {
    return this.dataSource.transaction(async (m) => {
      const rider = await m.findOne(Rider, {
        where: { id: user.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!rider) throw new UnauthorizedException('로그인이 필요해요.');

      const active = await m.countBy(Delivery, {
        riderId: user.id,
        status: Not(DELIVERY_STATUS.DONE),
      });
      if (rider.status === RIDER_STATUS.DELIVERING || active > 0) {
        throw new ConflictException('배달 중에는 운행상태를 변경할 수 없어요.');
      }

      rider.status = status;
      return userView('RIDER', await m.save(rider));
    });
  }
}

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** API 04 내 정보 조회 — GET /api/me */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user);
  }

  /** API 05 내 정보 수정 — PATCH /api/me */
  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body(validBody('수정할 회원정보를 확인해 주세요.')) dto: UpdateMeDto,
  ) {
    return this.users.updateMe(user, dto);
  }

  /** API 26 라이더 운행상태 변경 — PATCH /api/riders/me/status */
  @Roles('RIDER')
  @Patch('riders/me/status')
  riderStatus(
    @CurrentUser() user: AuthUser,
    @Body(validBody('운행상태를 확인해 주세요.')) dto: RiderStatusDto,
  ) {
    return this.users.changeRiderStatus(user, dto.status);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
