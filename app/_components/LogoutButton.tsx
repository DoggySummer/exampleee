"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/_lib/api/authApi";
import { ROLE_CONFIG, type Role } from "@/app/_lib/constants/roles";

export function LogoutButton({ role }: { role: Role }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.replace(ROLE_CONFIG[role].loginPath);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="h-11 rounded-md px-3 text-caption font-bold text-muted active:bg-field disabled:opacity-45"
    >
      {pending ? "로그아웃하는 중…" : "로그아웃"}
    </button>
  );
}
