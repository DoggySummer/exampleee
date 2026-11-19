/** 화면 아래에 붙는 주 버튼 영역 (하단 탭이 없는 하위 화면용) */
export function FixedBottom({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t border-line bg-paper px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
