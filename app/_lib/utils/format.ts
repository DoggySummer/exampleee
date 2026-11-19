/** 27000 → "27,000원" */
export function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 숫자만 입력해도 010-1234-5678 형태로 맞춘다 */
export function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:32" */
export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 오늘이면 "오늘 14:32", 아니면 "11월 16일 14:32" */
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return `${sameDay ? "오늘" : `${d.getMonth() + 1}월 ${d.getDate()}일`} ${formatTime(iso)}`;
}

/** 배달비 0원은 "무료" */
export function formatFee(n: number) {
  return n === 0 ? "무료" : formatWon(n);
}

/** 주문번호 42 → "#0042" */
export function formatOrderNo(id: number) {
  return `#${String(id).padStart(4, "0")}`;
}

/** "2026-11-10" → "11월 10일" */
export function formatDate(ymd: string) {
  const [, m, d] = ymd.split("-").map(Number);
  return `${m}월 ${d}일`;
}

/** 정산 기간 "11월 10일 ~ 11월 16일" */
export function formatPeriod(start: string, end: string) {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}
