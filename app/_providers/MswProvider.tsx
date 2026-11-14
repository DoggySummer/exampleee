"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/**
 * msw/browser는 브라우저 전용 모듈이라 서버 번들에 들어가면 빌드가 깨진다.
 * → ssr: false 로 브라우저에서만 불러온다.
 */
const MswStarter = dynamic(() => import("./MswStarter").then((m) => m.MswStarter), { ssr: false });

/**
 * NEXT_PUBLIC_API_MOCKING=enabled 일 때만 MSW 워커를 켠다.
 * 워커가 준비되기 전에 요청이 나가면 실제 서버로 가므로, 준비될 때까지 화면을 그리지 않는다.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!MOCKING_ENABLED);

  if (!MOCKING_ENABLED) return <>{children}</>;

  return (
    <>
      <MswStarter onReady={() => setReady(true)} />
      {ready && children}
    </>
  );
}
