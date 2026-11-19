import type { IconType } from "react-icons";

/** 빈 화면은 다음에 할 일을 알려 준다 */
export function EmptyState({ icon: Icon, title, desc, action }: { icon: IconType; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-field text-faint">
        <Icon size={26} aria-hidden />
      </span>
      <p className="mt-4 font-bold">{title}</p>
      {desc && <p className="mt-1 text-caption text-muted">{desc}</p>}
      {action && <div className="mt-5 w-full max-w-[240px]">{action}</div>}
    </div>
  );
}
