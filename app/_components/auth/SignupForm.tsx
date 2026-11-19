"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { LuCircleAlert } from "react-icons/lu";
import { Button } from "@/app/_components/Button";
import { ApiError } from "@/app/_lib/api/client";
import { signup } from "@/app/_lib/api/authApi";
import { hasPhone, signupSchema, type SignupValues } from "@/app/_lib/auth/schemas";
import { ROLE_CONFIG, type Role } from "@/app/_lib/constants/roles";
import { formatPhone } from "@/app/_lib/utils/format";
import { FormField } from "./FormField";

export function SignupForm({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const router = useRouter();
  const schema = useMemo(() => signupSchema(role), [role]);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", password: "", password2: "" },
  });

  const onSubmit = handleSubmit(async ({ name, email, password, phone }) => {
    setServerError(null);
    // 비밀번호 확인(password2)은 화면에서만 쓰고 서버로 보내지 않는다
    const values = { name, email, password };
    try {
      await signup(role, hasPhone(role) ? { ...values, phone } : values);
      router.replace(`${cfg.loginPath}?joined=${encodeURIComponent(values.email)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError("email", { message: e.message }, { shouldFocus: true });
        return;
      }
      setServerError(e instanceof ApiError ? e.message : "가입하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  });

  const phoneField = hasPhone(role) && (
    <FormField
      id="phone"
      label="전화번호"
      type="tel"
      inputMode="numeric"
      placeholder="010-0000-0000"
      autoComplete="tel"
      error={errors.phone?.message}
      {...register("phone", {
        onChange: (e) => {
          e.target.value = formatPhone(e.target.value);
        },
      })}
    />
  );

  return (
    <main className="flex flex-1 flex-col px-[22px] pt-6 pb-6">
      <p className="mb-6 text-muted">{cfg.signupLead}</p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {serverError && (
          <p role="alert" className="flex gap-2 rounded-[10px] bg-danger-soft px-3.5 py-3 text-sm text-danger">
            <LuCircleAlert size={20} aria-hidden className="shrink-0" />
            {serverError}
          </p>
        )}
        <FormField id="name" label="이름" placeholder="홍길동" autoComplete="name"
          error={errors.name?.message} {...register("name")} />
        {/* 라이더는 테이블 순서대로 전화번호를 먼저 받는다 */}
        {role === "rider" && phoneField}
        <FormField id="email" label="이메일" type="email" placeholder="you@example.com" autoComplete="email"
          help="로그인할 때 아이디로 써요." error={errors.email?.message} {...register("email")} />
        {role === "customer" && phoneField}
        <FormField id="password" label="비밀번호" type="password" placeholder="8자 이상" autoComplete="new-password"
          help="영문과 숫자를 섞어 8자 이상" error={errors.password?.message} {...register("password")} />
        <FormField id="password2" label="비밀번호 확인" type="password" placeholder="한 번 더 입력"
          autoComplete="new-password" error={errors.password2?.message} {...register("password2")} />
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "가입하는 중…" : "가입하기"}
        </Button>
      </form>

      <p className="mt-[18px] text-center text-sm text-muted">
        이미 계정이 있나요?{" "}
        <Link href={cfg.loginPath} className="px-0.5 py-1 font-extrabold text-brand">
          로그인
        </Link>
      </p>
    </main>
  );
}
