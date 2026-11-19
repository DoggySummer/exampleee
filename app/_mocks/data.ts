/**
 * MSW 가짜 DB (메모리). 새로고침하면 처음 상태로 돌아간다.
 * 테스트 계정 비밀번호는 모두 test1234
 */
import type { Role } from "@/app/_lib/constants/roles";

export interface MockUser {
  id: number;
  role: Role;
  name: string;
  email: string;
  password: string;
  phone?: string;
  /** 점주만: 가게가 없으면 null */
  restaurant_id?: number | null;
}

export const db = {
  users: [
    { id: 1, role: "customer", name: "김지민", email: "customer@test.com", password: "test1234", phone: "010-2345-6789" },
    { id: 2, role: "customer", name: "이미 가입", email: "taken@test.com", password: "test1234", phone: "010-1111-2222" },
    { id: 1, role: "owner", name: "박사장", email: "owner@test.com", password: "test1234", restaurant_id: 1 },
    { id: 2, role: "owner", name: "최신규", email: "newowner@test.com", password: "test1234", restaurant_id: null },
    { id: 1, role: "rider", name: "정라이더", email: "rider@test.com", password: "test1234", phone: "010-3456-7890" },
  ] as MockUser[],
};

/** 같은 역할 안에서만 이메일 중복 검사 (고객·점주·라이더 테이블이 따로라서) */
export function findUser(role: Role, email: string) {
  return db.users.find((u) => u.role === role && u.email.toLowerCase() === email.toLowerCase());
}

export function nextId(role: Role) {
  return Math.max(0, ...db.users.filter((u) => u.role === role).map((u) => u.id)) + 1;
}
