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
