import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import { IdPipe, validBody } from '../common/pipes';
import { addressView } from '../common/views';
import { Address, Order } from '../entities';

class CreateAddressDto {
  @IsString() @Length(1, 200) address: string;
  @IsOptional() @IsString() @MaxLength(100) detailAddress?: string | null;
}

class UpdateAddressDto {
  @IsOptional() @IsString() @Length(1, 200) address?: string;
  @IsOptional() @IsString() @MaxLength(100) detailAddress?: string | null; // null 로 비울 수 있음
}

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address) private readonly addresses: Repository<Address>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  /** 본인 배송지 가져오기. 없으면 404, 남의 것이면 403 */
  private async getOwned(user: AuthUser, id: number) {
    const a = await this.addresses.findOneBy({ id });
    if (!a) throw new NotFoundException('배송지를 찾을 수 없어요.');
    if (a.customerId !== user.id) throw new ForbiddenException('권한이 없어요.');
    return a;
  }

  async list(user: AuthUser) {
    const rows = await this.addresses.find({ where: { customerId: user.id }, order: { id: 'ASC' } });
    return rows.map(addressView);
  }

  async create(user: AuthUser, dto: CreateAddressDto) {
    const saved = await this.addresses.save(
      this.addresses.create({
        customerId: user.id, // 토큰에서 결정
        address: dto.address,
        detailAddress: dto.detailAddress ?? null,
      }),
    );
    return addressView(saved);
  }

  async detail(user: AuthUser, id: number) {
    return addressView(await this.getOwned(user, id));
  }

  // 수정해도 기존 주문의 addressSnapshot(order_address)은 그대로
  async update(user: AuthUser, id: number, dto: UpdateAddressDto) {
    if (dto.address === undefined && dto.detailAddress === undefined) {
      throw new BadRequestException('수정할 배송지를 확인해 주세요.');
    }
    const a = await this.getOwned(user, id);
    if (dto.address !== undefined) a.address = dto.address;
    if (dto.detailAddress !== undefined) a.detailAddress = dto.detailAddress;
    return addressView(await this.addresses.save(a));
  }

  async remove(user: AuthUser, id: number) {
    const a = await this.getOwned(user, id);
    if (await this.orders.existsBy({ addressId: id })) {
      throw new ConflictException('주문에 사용된 배송지는 삭제할 수 없어요.');
    }
    await this.addresses.delete({ id: a.id });
  }
}

@Roles('CUSTOMER')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly service: AddressesService) {}

  /** API 06 배송지 목록 — GET /api/addresses */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user);
  }

  /** API 07 배송지 등록 — POST /api/addresses (201) */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(validBody('배송주소를 확인해 주세요.')) dto: CreateAddressDto,
  ) {
    return this.service.create(user, dto);
  }

  /** API 08 배송지 상세 — GET /api/addresses/{addressId} */
  @Get(':addressId')
  detail(@CurrentUser() user: AuthUser, @Param('addressId', IdPipe) id: number) {
    return this.service.detail(user, id);
  }

  /** API 09 배송지 수정 — PATCH /api/addresses/{addressId} */
  @Patch(':addressId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('addressId', IdPipe) id: number,
    @Body(validBody('수정할 배송지를 확인해 주세요.')) dto: UpdateAddressDto,
  ) {
    return this.service.update(user, id, dto);
  }

  /** API 10 배송지 삭제 — DELETE /api/addresses/{addressId} (204) */
  @Delete(':addressId')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('addressId', IdPipe) id: number) {
    await this.service.remove(user, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Address, Order])],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
