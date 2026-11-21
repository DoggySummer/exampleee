import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role, ROLES } from '../common/constants';
import { AuthUser, IS_PUBLIC, ROLES_KEY } from './auth.decorators';
import { TokenBlacklistService } from './token-blacklist.service';

/**
 * 전역 가드.
 * - @Public() 이면 통과
 * - 그 외에는 Authorization: Bearer <token> 필수 (없거나 만료·로그아웃 → 401)
 * - @Roles(...) 가 있으면 역할 확인 (다르면 403)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest();
    const [type, token] = String(req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('로그인이 필요해요.');

    let payload: { sub: number; role: Role; jti: string; exp: number };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('로그인이 만료됐어요. 다시 로그인해 주세요.');
    }
    if (!ROLES.includes(payload.role) || this.blacklist.isRevoked(payload.jti)) {
      throw new UnauthorizedException('로그인이 만료됐어요. 다시 로그인해 주세요.');
    }

    const user: AuthUser = { id: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
    req.user = user;

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('권한이 없어요.');
    return true;
  }
}
