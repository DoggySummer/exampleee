import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// 명세: 오류 응답은 항상 { "message": "..." }
// 우리가 던진 한국어 메시지는 그대로, 프레임워크 기본 영어 메시지는 상태별 한국어 문구로 바꾼다.
const DEFAULT_MESSAGES: Record<number, string> = {
  400: '요청 형식을 확인해 주세요.',
  401: '로그인이 필요해요.',
  403: '권한이 없어요.',
  404: '요청한 API를 찾을 수 없어요.',
  409: '현재 상태에서 처리할 수 없어요.',
  500: '요청을 처리할 수 없어요.',
};

const hasKorean = (s: unknown): s is string => typeof s === 'string' && /[가-힣]/.test(s);

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: unknown }).message;
      const message = hasKorean(raw)
        ? raw
        : DEFAULT_MESSAGES[status] ?? DEFAULT_MESSAGES[status >= 500 ? 500 : 400];
      res.status(status).json({ message });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: DEFAULT_MESSAGES[500] });
  }
}
