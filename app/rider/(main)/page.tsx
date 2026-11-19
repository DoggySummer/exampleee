import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="라이더 홈" badge="라이더" />
      <PagePlaceholder
        summary="출근 토글 + 수락 가능한 주문 (10초 폴링)"
        items={[
          "퇴근 상태면 목록 대신 \"출근하면 배달할 주문이 보여요\"",
          "카드: 가게명·주소(픽업지), 배달 주소, 배달비, 조리완료 후 경과 시간",
          "[수락]은 확인 없이 바로. 다른 라이더가 먼저 잡으면 안내 후 목록 새로고침",
          "배달 중이면 수락 비활성 + \"진행 중인 배달로 가기\" 배너",
          "오늘 건수·수입 표시 없음 (결정 사항)"
        ]}
      />
    </>
  );
}
