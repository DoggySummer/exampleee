import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { RIDER_STATUS } from '../common/constants';
import { toKstIso } from '../common/time';
import { isDuplicateError, userView } from '../common/views';
import { AuthUser } from './auth.decorators';
import { LoginDto, RegisterDto } from './auth.dto';
import { AccountsService } from './accounts.service';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly accounts: AccountsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  // API 01 회원가입
  async register(dto: RegisterDto) {
    const needsPhone = dto.role !== 'OWNER';
    if (needsPhone && !dto.phone) throw new BadRequestException('가입 정보를 확인해 주세요.');

    if (await this.accounts.findByEmail(dto.role, dto.email)) {
      throw new ConflictException('이미 가입된 이메일이에요.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const data: Record<string, unknown> = { email: dto.email, name: dto.name, passwordHash };
    if (needsPhone) data.phone = dto.phone;
    if (dto.role === 'RIDER') data.status = RIDER_STATUS.OFF; // 최초 운행종료

    try {
      const repo = this.accounts.repo(dto.role);
      const saved = await repo.save(repo.create(data));
      return userView(dto.role, saved);
    } catch (e) {
      if (isDuplicateError(e)) throw new ConflictException('이미 가입된 이메일이에요.');
      throw e;
    }
  }

  // API 02 로그인
  async login(dto: LoginDto) {
    const account = await this.accounts.findByEmail(dto.role, dto.email);
    const ok = account && (await bcrypt.compare(dto.password, account.passwordHash));
    if (!account || !ok) throw new UnauthorizedException('이메일 또는 비밀번호를 확인해 주세요.');

    const expiresIn = Number(this.config.get('JWT_EXPIRES_IN_SECONDS') ?? 86400);
    const token = this.jwt.sign(
      { sub: account.id, role: dto.role, jti: randomUUID() },
      { expiresIn },
    );
    const { exp } = this.jwt.decode(token) as { exp: number };

    return {
      token,
      tokenType: 'Bearer',
      expiresAt: toKstIso(new Date(exp * 1000)),
      user: userView(dto.role, account),
    };
  }

  // API 03 로그아웃
  logout(user: AuthUser) {
    this.blacklist.revoke(user.jti, user.exp);
  }
}
