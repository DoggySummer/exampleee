import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '../common/constants';

export interface AuthUser {
  id: number;
  role: Role;
  jti: string;
  exp: number; // 초 단위 만료 시각
}

export const IS_PUBLIC = 'isPublic';
export const ROLES_KEY = 'roles';

/** 로그인 없이 호출 가능 (명세 권한 "공개") */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** 이 역할만 호출 가능. 다른 역할이면 403 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** 토큰에서 꺼낸 로그인 사용자 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
