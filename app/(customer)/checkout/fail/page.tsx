import Link from "next/link";
import { LuCircleX } from "react-icons/lu";
import { AppHeader } from "@/app/_components/AppHeader";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** 토스 결제창을 닫았거나 인증에 실패하면 이 주소로 온다: ?code&message */
export default async function Page({ searchParams }: PageProps<"/checkout/fail">) {
  const sp = await searchParams;
  const canceled = one(sp.code) === "PAY_PROCESS_CANCELED";
  return (
    <>
      <AppHeader title="결제" back="/cart" />
      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <LuCircleX size={32} className="text-muted" aria-hidden />
        <h2 className="mt-4 text-lg font-extrabold">{canceled ? "결제를 취소했어요" : "결제하지 못했어요"}</h2>
        <p className="mt-1.5 text-muted">{canceled ? "장바구니는 그대로 있어요." : (one(sp.message) ?? "다른 결제수단으로 다시 시도해 주세요.")}</p>
        <Link href="/cart" className="mt-7 flex h-12 w-full max-w-[280px] items-center justify-center rounded-[10px] bg-brand font-extrabold text-white">
          장바구니로 돌아가기
        </Link>
      </main>
    </>
  );
}
