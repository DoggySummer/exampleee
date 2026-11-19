/** 모든 화면을 최대 480px 폭으로 가운데에 둔다 (PC로 영상을 찍어도 앱처럼 보이게) */
export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper shadow-[0_0_0_1px_var(--color-line)]">
      {children}
    </div>
  );
}
