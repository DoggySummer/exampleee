import Link from "next/link";
import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader
        title="동네배달"
        right={
          <Link href="/login" className="flex h-11 items-center px-1 text-caption font-bold text-brand">
            로그인
          </Link>
        }
      />
      <PagePlaceholder
        summary="가게 목록 (로그인 없이 볼 수 있음)"
        items={[
          "가게 카드: 대표 사진, 상호명, 주소, 배달비, 영업중/영업종료",
          "영업중인 가게가 위로. 영업종료 가게는 회색 + \"준비중\"",
          "검색·정렬 없음 (결정 사항)",
          "오른쪽 위 로그인 버튼 (로그인 전)"
        ]}
      />
    </>
  );
}
