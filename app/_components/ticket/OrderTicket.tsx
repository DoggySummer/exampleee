import { formatOrderNo } from "@/app/_lib/utils/format";

/**
 * 주문 티켓 — 같은 주문이 손님·사장님·라이더 화면에 같은 모양으로 나온다.
 * 큰 주문번호, 절취선(점선 + 양옆 반원 홈)으로 구역을 나눈다.
 */
export function OrderTicket({
  orderId,
  meta,
  badge,
  children,
}: {
  orderId: number;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-xl bg-paper" aria-label={`주문 ${formatOrderNo(orderId)}`}>
      <div className="flex items-start justify-between gap-3 px-[18px] pt-4 pb-3">
        <div>
          <p className="text-[36px] leading-none font-black tracking-tight tabular-nums">{formatOrderNo(orderId)}</p>
          {meta && <div className="mt-2 text-caption text-muted">{meta}</div>}
        </div>
        {badge}
      </div>
      {children}
    </article>
  );
}

/** 티켓 절취선. 배경색(tray)과 같은 반원으로 양옆을 파낸다 */
export function TicketPerforation() {
  return (
    <div className="relative h-[18px]" aria-hidden>
      <div className="absolute inset-x-3.5 top-2 border-t-2 border-dashed border-line" />
      <div className="absolute top-0 -left-[9px] size-[18px] rounded-full bg-tray" />
      <div className="absolute top-0 -right-[9px] size-[18px] rounded-full bg-tray" />
    </div>
  );
}

export function TicketSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-[18px] py-1.5 ${className}`}>{children}</div>;
}
