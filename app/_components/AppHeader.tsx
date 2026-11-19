import { BackButton } from "./BackButton";
import { RoleBadge } from "./RoleBadge";

interface Props {
  title: string;
  /** 하위 화면: 뒤로가기 + 가운데 제목 */
  back?: string;
  /** 탭 화면: 역할 라벨 + 왼쪽 제목 */
  badge?: string | null;
  right?: React.ReactNode;
}

export function AppHeader({ title, back, badge, right }: Props) {
  if (back) {
    return (
      <header className="sticky top-0 z-10 flex h-[52px] items-center border-b border-line bg-paper px-1">
        <BackButton fallback={back} />
        <h1 className="absolute inset-x-14 truncate text-center text-lg font-extrabold tracking-tight">{title}</h1>
        <div className="ml-auto pr-3">{right}</div>
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-10 flex h-[52px] items-center gap-2 border-b border-line bg-paper px-4">
      {badge && <RoleBadge>{badge}</RoleBadge>}
      <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
      <div className="ml-auto">{right}</div>
    </header>
  );
}
