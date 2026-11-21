// 시간 표기: 명세는 "시간대를 포함한 ISO" (예: 2026-11-15T18:00:00+09:00)
// DB DATETIME 은 한국시간(KST)으로 저장한다 (TypeORM timezone '+09:00').

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** Date → "YYYY-MM-DDTHH:mm:ss+09:00" */
export function toKstIso(date: Date | null | undefined): string | null {
  if (!date) return null;
  const k = new Date(date.getTime() + KST_OFFSET_MS);
  return (
    `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}` +
    `T${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}:${pad(k.getUTCSeconds())}+09:00`
  );
}

/** DATE 컬럼 값(문자열 또는 Date) → "YYYY-MM-DD" */
export function toDateString(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const k = new Date(value.getTime() + KST_OFFSET_MS);
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`;
}

/** 오늘 날짜 (KST) "YYYY-MM-DD" */
export function kstToday(): string {
  return toDateString(new Date());
}

/** "YYYY-MM-DD" 형식이고 실제 존재하는 날짜인지 */
export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** 월요일인지 */
export function isMonday(s: string): boolean {
  return new Date(`${s}T00:00:00Z`).getUTCDay() === 1;
}

/** "YYYY-MM-DD" + n일 */
export function addDays(s: string, n: number): string {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 그 날짜가 속한 주의 월요일 */
export function mondayOf(s: string): string {
  const day = new Date(`${s}T00:00:00Z`).getUTCDay(); // 0=일
  return addDays(s, day === 0 ? -6 : 1 - day);
}
