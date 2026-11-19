/**
 * 아직 만들지 않은 화면의 자리. 화면 시나리오 문서의 내용을 요약해 둔다.
 * 화면을 구현하면 이 컴포넌트를 지우고 실제 내용으로 바꾼다.
 */
export function PagePlaceholder({
  summary,
  items,
  children,
}: {
  summary: string;
  items: string[];
  children?: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col gap-4 bg-tray p-4">
      <section className="rounded-xl bg-paper p-5">
        <p className="text-caption font-bold text-brand">만들 예정인 화면</p>
        <p className="mt-1 font-semibold">{summary}</p>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-caption text-muted">
          {items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      </section>
      {children}
    </main>
  );
}
