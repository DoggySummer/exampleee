/**
 * 새 주문 알림음 (파일 없이 Web Audio로 "띵동").
 * 브라우저는 사용자가 한 번 누르기 전에는 소리를 막는다 → unlockSound()를 클릭 때 부른다.
 */
let ctx: AudioContext | null = null;

export function unlockSound() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* 소리를 못 내는 환경이면 팝업만 */
  }
}

export function playNewOrderSound() {
  if (!ctx || ctx.state !== "running") return false;
  const now = ctx.currentTime;
  [880, 660].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.22 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 0.4);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(now + i * 0.22);
    osc.stop(now + i * 0.22 + 0.42);
  });
  return true;
}
