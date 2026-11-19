"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/** msw/browser는 브라우저 전용이라 서버 번들에 들어가면 빌드가 깨진다 → ssr: false */
const MswStarter = dynamic(() => import("./MswStarter").then((m) => m.MswStarter), { ssr: false });

/**
 * NEXT_PUBLIC_API_MOCKING=enabled 일 때만 MSW 워커를 켠다.
 * children은 항상 그리고, 워커 준비 전 API 요청은 apiClient가 기다렸다가 보낸다.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {MOCKING_ENABLED && (
        <Suspense fallback={null}>
          <MswStarter />
        </Suspense>
      )}
      {children}
    </>
  );
}
