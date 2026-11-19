"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import type { Role } from "@/app/_lib/constants/roles";
import { TABS } from "./tabs";

export interface Tab {
  href: string;
  label: string;
  icon: IconType;
}

/**
 * 역할별 하단 탭. 탭 화면(href와 주소가 정확히 같을 때)에서만 보이고,
 * 하위 화면(상세, 장바구니 등 하단 버튼이 있는 화면)에서는 숨긴다.
 * 아이콘(함수)은 서버 레이아웃에서 넘길 수 없어서 역할 이름만 받는다.
 */
export function BottomTabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = TABS[role];
  if (!tabs.some((t) => t.href === pathname)) return null;

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ href, label, icon: Icon }) => {
        const on = href === pathname;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-tab font-semibold ${
              on ? "text-brand" : "text-faint"
            }`}
          >
            <Icon size={22} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
