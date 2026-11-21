import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';

@Controller('health')
export class HealthController {
  /** API 36 서버 상태 확인 — GET /api/health */
  @ApiTags('9 서버 확인')
  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }
}
