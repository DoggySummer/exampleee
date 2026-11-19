"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuBike, LuCircleAlert, LuCircleCheck, LuStore } from "react-icons/lu";
import { Button } from "@/app/_components/Button";
import { RoleBadge } from "@/app/_components/RoleBadge";
import { ApiError } from "@/app/_lib/api/client";
import { login } from "@/app/_lib/api/authApi";
import { loginSchema, type LoginValues } from "@/app/_lib/auth/schemas";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import { ROLE_CONFIG, type Role } from "@/app/_lib/constants/roles";
import { FormField } from "./FormField";

interface Props {
  role: Role;
  /** 로그인 후 돌아갈 주소 (proxy.ts가 붙여 줌) */
  next?: string;
  /** 가입 직후 넘어온 이메일 */
  joinedEmail?: string;
}

/** 다른 역할의 화면 주소로는 보내지 않는다 (예: 손님 로그인 후 /owner로 가는 것 방지) */
function safeNext(role: Role, next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  const isOwner = next === "/owner" || next.startsWith("/owner/");
  const isRider = next === "/rider" || next.startsWith("/rider/");
  const ok = role === "owner" ? isOwner : role === "rider" ? isRider : !isOwner && !isRider;
  return ok ? next : null;
}

export function LoginForm({ role, next, joinedEmail }: Props) {
  const cfg = ROLE_CONFIG[role];
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: joinedEmail ?? "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const user = await login(role, values);
      // 로그인 전 화면에서 "로그인 안 함"으로 캐시된 내 정보를 바로 바꾼다
      queryClient.setQueryData(queryKeys.me, user);
      // 가게가 없는 점주는 /owner에 들어가면 OwnerShell이 가게 등록으로 보낸다
      const dest = safeNext(role, next) ?? cfg.home;
      router.replace(dest);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  });

  return (
    <main className="flex flex-1 flex-col px-[22px] pt-7 pb-6">
      <div className="mb-7 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-[17px] font-black text-white">
          동
        </div>
        <span className="text-[17px] font-extrabold tracking-tight">
          동네배달<small className="ml-1 text-xs font-medium text-faint">가칭</small>
        </span>
      </div>

      {cfg.badge && (
        <div className="mb-2.5">
          <RoleBadge>{cfg.badge}</RoleBadge>
        </div>
      )}
      <h1 className="text-[26px] leading-tight font-extrabold tracking-tight">로그인</h1>
      <p className="mt-1.5 mb-6 text-muted">{cfg.loginLead}</p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {joinedEmail && !serverError && (
          <p role="status" className="flex gap-2 rounded-[10px] bg-brand-soft px-3.5 py-3 text-sm text-brand-ink">
            <LuCircleCheck size={20} aria-hidden className="shrink-0" />
            가입이 끝났어요. 방금 만든 계정으로 로그인해 주세요.
          </p>
        )}
        {serverError && (
          <p role="alert" className="flex gap-2 rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm text-danger">
            <LuCircleAlert size={20} aria-hidden className="shrink-0" />
            {serverError}
          </p>
        )}
        <FormField
          id="email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus={!joinedEmail}
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          autoFocus={!!joinedEmail}
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "로그인하는 중…" : "로그인"}
        </Button>
      </form>

      <p className="mt-[18px] text-center text-sm text-muted">
        아직 계정이 없나요?{" "}
        <Link href={cfg.signupPath} className="px-0.5 py-1 font-extrabold text-brand">
          회원가입
        </Link>
      </p>

      {role === "customer" ? (
        <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-7">
          <OtherRoleLink href={ROLE_CONFIG.owner.loginPath} icon={<LuStore size={20} aria-hidden />}
            title="사장님이신가요?" desc="사장님 로그인으로 가게 주문을 받아요" />
          <OtherRoleLink href={ROLE_CONFIG.rider.loginPath} icon={<LuBike size={20} aria-hidden />}
            title="라이더로 일하기" desc="라이더 로그인으로 배달을 시작해요" />
        </div>
      ) : (
        <p className="mt-auto pt-7 text-center">
          <Link href={ROLE_CONFIG.customer.loginPath} className="py-1 font-extrabold text-brand">
            손님으로 주문하기
          </Link>
        </p>
      )}
    </main>
  );
}

function OtherRoleLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[10px] px-1 py-3 active:bg-field">
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-field text-brand">
        {icon}
      </span>
      <span>
        <b className="block font-bold">{title}</b>
        <span className="text-caption text-muted">{desc}</span>
      </span>
    </Link>
  );
}
