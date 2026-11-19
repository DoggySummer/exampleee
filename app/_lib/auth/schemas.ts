import { z } from "zod";
import type { Role } from "@/app/_lib/constants/roles";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const email = z
  .string()
  .trim()
  .min(1, "이메일을 입력해 주세요")
  .regex(EMAIL, "이메일 형식이 맞지 않아요");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});
export type LoginValues = z.infer<typeof loginSchema>;

const signupBase = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(30, "이름은 30자까지 쓸 수 있어요"),
  email,
  phone: z.string().optional(),
  password: z
    .string()
    .min(1, "비밀번호를 입력해 주세요")
    .refine((v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v), "영문과 숫자를 섞어 8자 이상 입력해 주세요"),
  password2: z.string().min(1, "비밀번호를 한 번 더 입력해 주세요"),
});
export type SignupValues = z.infer<typeof signupBase>;

/** 점주는 전화번호가 없다 (owner 테이블 기준) */
export function hasPhone(role: Role) {
  return role !== "owner";
}

export function signupSchema(role: Role) {
  return signupBase
    .refine((v) => !hasPhone(role) || (v.phone ?? "").length > 0, {
      path: ["phone"],
      message: "전화번호를 입력해 주세요",
    })
    .refine((v) => !hasPhone(role) || !v.phone || /^010-\d{4}-\d{4}$/.test(v.phone), {
      path: ["phone"],
      message: "010-0000-0000 형식으로 입력해 주세요",
    })
    .refine((v) => v.password === v.password2, {
      path: ["password2"],
      message: "비밀번호가 서로 달라요",
    });
}
