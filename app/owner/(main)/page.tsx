import { AppHeader } from "@/app/_components/AppHeader";
import { PagePlaceholder } from "@/app/_components/PagePlaceholder";

export default function Page() {
  return (
    <>
      <AppHeader title="김밥천국 광교점" badge="사장님" />
      <PagePlaceholder
        summary="주문 관리 (신규 / 조리중 / 완료 탭)"
        items={[
          "헤더 오른쪽 영업 토글 (판매 가능한 메뉴가 0개면 켤 수 없음)",
          "티켓 카드: 주문번호, 시각, 손님 이름·전화번호, 메뉴·수량, 배달 주소, 주문금액",
          "신규: [거절] [수락] / 조리중: [조리완료] / 완료: 배달 진행 상황 읽기 전용",
          "거절은 확인 모달 (\"거절하면 손님 결제가 취소돼요\")",
          "새 주문: 10초 폴링 + 알림음 + \"새 주문 n건\" 팝업 (레이아웃에서 감시)"
        ]}
      />
    </>
  );
}
