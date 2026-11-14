"use client";

import { useEffect } from "react";
import { worker } from "@/app/_mocks/browser";

let started: Promise<unknown> | null = null;

export function MswStarter({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    // 개발 모드에서 effect가 두 번 실행돼도 워커는 한 번만 시작
    started ??= worker.start({ onUnhandledFrame: "bypass", quiet: true });
    started.then(onReady);
  }, [onReady]);

  return null;
}
