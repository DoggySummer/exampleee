import { BadRequestException, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common';

/**
 * 요청 본문 검증. 실패하면 API마다 명세에 적힌 400 문구로 응답한다.
 * 예) @Body(validBody('가입 정보를 확인해 주세요.')) dto: RegisterDto
 */
export function validBody(message: string) {
  return new ValidationPipe({
    whitelist: true, // DTO에 없는 필드는 버림
    transform: true,
    exceptionFactory: () => new BadRequestException(message),
  });
}

/** 경로의 {id}: 양의 정수만 허용 */
@Injectable()
export class IdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^[1-9]\d{0,9}$/.test(value) || Number(value) > 2147483647) {
      throw new BadRequestException('요청 경로의 ID를 확인해 주세요.');
    }
    return Number(value);
  }
}
