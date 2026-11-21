import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { validBody } from '../common/pipes';
import { AuthUser, CurrentUser, Public } from './auth.decorators';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** API 01 회원가입 — POST /api/auth/register (201) */
  @Public()
  @Post('register')
  register(@Body(validBody('가입 정보를 확인해 주세요.')) dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /** API 02 로그인 — POST /api/auth/login (200) */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body(validBody('이메일 또는 비밀번호를 확인해 주세요.')) dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** API 03 로그아웃 — POST /api/auth/logout (204) */
  @Post('logout')
  @HttpCode(204)
  logout(@CurrentUser() user: AuthUser) {
    this.auth.logout(user);
  }
}
