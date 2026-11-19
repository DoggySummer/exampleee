/** 점주·라이더 화면 제목 앞에 붙는 작은 역할 라벨 */
export function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-brand-soft px-2 py-0.5 text-caption font-bold text-brand">
      {children}
    </span>
  );
}
