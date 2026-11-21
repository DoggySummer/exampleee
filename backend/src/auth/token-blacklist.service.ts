import { Injectable } from '@nestjs/common';

/**
 * 로그아웃한 토큰 목록 (메모리 보관).
 * 서버를 재시작하면 비워지지만, 과제·로컬 시연 범위에서는 충분하다.
 */
@Injectable()
export class TokenBlacklistService {
  private readonly revoked = new Map<string, number>(); // jti → 만료(초)

  revoke(jti: string, exp: number) {
    this.revoked.set(jti, exp);
    this.cleanup();
  }

  isRevoked(jti: string) {
    return this.revoked.has(jti);
  }

  private cleanup() {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.revoked) if (exp < now) this.revoked.delete(jti);
  }
}
