import {
  BadRequestException,
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
  Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Like, Repository } from 'typeorm';
import { AuthUser, CurrentUser, Public, Roles } from '../auth/auth.decorators';
import { INT_MAX, STORE_STATUS, STORE_STATUSES } from '../common/constants';
import { IdPipe, validBody } from '../common/pipes';
import { isDuplicateError, menuView, storeView } from '../common/views';
import { Menu, Restaurant } from '../entities';

class CreateStoreDto {
  @IsString() @Length(1, 50) name: string;
  @IsString() @Length(1, 200) address: string;
  @IsOptional() @IsIn(STORE_STATUSES) status?: string;
  @IsOptional() @IsInt() @Min(0) @Max(INT_MAX) deliveryFee?: number;
}

class UpdateStoreDto {
  @IsOptional() @IsString() @Length(1, 50) name?: string;
  @IsOptional() @IsString() @Length(1, 200) address?: string;
  @IsOptional() @IsIn(STORE_STATUSES) status?: string;
  @IsOptional() @IsInt() @Min(0) @Max(INT_MAX) deliveryFee?: number;
}

class CreateMenuDto {
  @IsString() @Length(1, 50) name: string;
  @IsInt() @Min(0) @Max(INT_MAX) price: number;
}

class UpdateMenuDto {
  @IsOptional() @IsString() @Length(1, 50) name?: string;
  @IsOptional() @IsInt() @Min(0) @Max(INT_MAX) price?: number;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Restaurant) private readonly stores: Repository<Restaurant>,
    @InjectRepository(Menu) private readonly menus: Repository<Menu>,
  ) {}

  private async getStore(id: number) {
    const s = await this.stores.findOneBy({ id });
    if (!s) throw new NotFoundException('음식점을 찾을 수 없어요.');
    return s;
  }

  /** 본인 가게만. 없으면 404, 남의 가게면 403 */
  private async getOwnedStore(user: AuthUser, id: number) {
    const s = await this.getStore(id);
    if (s.ownerId !== user.id) throw new ForbiddenException('권한이 없어요.');
    return s;
  }

  // API 11: 가게 id 오름차순, q는 상호명 검색
  async list(q?: string) {
    const where = q ? { name: Like(`%${escapeLike(q)}%`) } : {};
    return (await this.stores.find({ where, order: { id: 'ASC' } })).map(storeView);
  }

  // API 12
  async detail(id: number) {
    return storeView(await this.getStore(id));
  }

  // API 13: 점주 1명당 0~1개 → 배열
  async myStores(user: AuthUser) {
    return (await this.stores.findBy({ ownerId: user.id })).map(storeView);
  }

  // API 14
  async create(user: AuthUser, dto: CreateStoreDto) {
    if (await this.stores.existsBy({ ownerId: user.id })) {
      throw new ConflictException('이미 등록한 음식점이 있어요.');
    }
    try {
      const saved = await this.stores.save(
        this.stores.create({
          ownerId: user.id,
          name: dto.name,
          address: dto.address,
          status: dto.status ?? STORE_STATUS.CLOSED, // 기본 영업종료
          deliveryFee: dto.deliveryFee ?? 0, // 기본 0
        }),
      );
      return storeView(saved);
    } catch (e) {
      if (isDuplicateError(e)) throw new ConflictException('이미 등록한 음식점이 있어요.');
      throw e;
    }
  }

  // API 15: 기존 주문은 복사해 둔 배달비를 그대로 사용
  async update(user: AuthUser, id: number, dto: UpdateStoreDto) {
    const keys = (['name', 'address', 'status', 'deliveryFee'] as const).filter(
      (k) => dto[k] !== undefined,
    );
    if (keys.length === 0) throw new BadRequestException('수정할 음식점 정보를 확인해 주세요.');
    const s = await this.getOwnedStore(user, id);
    for (const k of keys) (s as unknown as Record<string, unknown>)[k] = dto[k];
    return storeView(await this.stores.save(s));
  }

  // API 16: 메뉴 id 오름차순
  async listMenus(storeId: number) {
    await this.getStore(storeId);
    const rows = await this.menus.find({ where: { restaurantId: storeId }, order: { id: 'ASC' } });
    return rows.map(menuView);
  }

  // API 17
  async createMenu(user: AuthUser, storeId: number, dto: CreateMenuDto) {
    await this.getOwnedStore(user, storeId);
    const saved = await this.menus.save(
      this.menus.create({ restaurantId: storeId, name: dto.name, price: dto.price }),
    );
    return menuView(saved);
  }

  // API 18: 과거 주문의 unitPrice는 그대로
  async updateMenu(user: AuthUser, storeId: number, menuId: number, dto: UpdateMenuDto) {
    if (dto.name === undefined && dto.price === undefined) {
      throw new BadRequestException('수정할 메뉴 정보를 확인해 주세요.');
    }
    await this.getOwnedStore(user, storeId);
    const menu = await this.menus.findOneBy({ id: menuId, restaurantId: storeId });
    if (!menu) throw new NotFoundException('메뉴를 찾을 수 없어요.');
    if (dto.name !== undefined) menu.name = dto.name;
    if (dto.price !== undefined) menu.price = dto.price;
    return menuView(await this.menus.save(menu));
  }
}

@Controller()
export class StoresController {
  constructor(private readonly service: StoresService) {}

  /** API 11 음식점 목록 — GET /api/stores?q= */
  @Public()
  @Get('stores')
  list(@Query('q') q?: string) {
    return this.service.list(typeof q === 'string' && q.trim() ? q.trim() : undefined);
  }

  /** API 12 음식점 상세 — GET /api/stores/{storeId} */
  @Public()
  @Get('stores/:storeId')
  detail(@Param('storeId', IdPipe) id: number) {
    return this.service.detail(id);
  }

  /** API 13 점주 내 음식점 — GET /api/me/stores */
  @Roles('OWNER')
  @Get('me/stores')
  myStores(@CurrentUser() user: AuthUser) {
    return this.service.myStores(user);
  }

  /** API 14 음식점 등록 — POST /api/stores (201) */
  @Roles('OWNER')
  @Post('stores')
  create(
    @CurrentUser() user: AuthUser,
    @Body(validBody('음식점 정보를 확인해 주세요.')) dto: CreateStoreDto,
  ) {
    return this.service.create(user, dto);
  }

  /** API 15 음식점 수정·영업상태 변경 — PATCH /api/stores/{storeId} */
  @Roles('OWNER')
  @Patch('stores/:storeId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('storeId', IdPipe) id: number,
    @Body(validBody('수정할 음식점 정보를 확인해 주세요.')) dto: UpdateStoreDto,
  ) {
    return this.service.update(user, id, dto);
  }

  /** API 16 메뉴 목록 — GET /api/stores/{storeId}/menus */
  @Public()
  @Get('stores/:storeId/menus')
  listMenus(@Param('storeId', IdPipe) storeId: number) {
    return this.service.listMenus(storeId);
  }

  /** API 17 메뉴 등록 — POST /api/stores/{storeId}/menus (201) */
  @Roles('OWNER')
  @Post('stores/:storeId/menus')
  createMenu(
    @CurrentUser() user: AuthUser,
    @Param('storeId', IdPipe) storeId: number,
    @Body(validBody('메뉴명과 가격을 확인해 주세요.')) dto: CreateMenuDto,
  ) {
    return this.service.createMenu(user, storeId, dto);
  }

  /** API 18 메뉴 수정 — PATCH /api/stores/{storeId}/menus/{menuId} */
  @Roles('OWNER')
  @Patch('stores/:storeId/menus/:menuId')
  updateMenu(
    @CurrentUser() user: AuthUser,
    @Param('storeId', IdPipe) storeId: number,
    @Param('menuId', IdPipe) menuId: number,
    @Body(validBody('수정할 메뉴 정보를 확인해 주세요.')) dto: UpdateMenuDto,
  ) {
    return this.service.updateMenu(user, storeId, menuId, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Menu])],
  controllers: [StoresController],
  providers: [StoresService],
})
export class StoresModule {}
