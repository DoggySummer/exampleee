import { SettlementDetailView } from "@/app/_components/settlement/SettlementDetailView";

export default async function Page({ params }: PageProps<"/rider/settlements/[id]">) {
  const { id } = await params;
  return <SettlementDetailView id={Number(id)} back="/rider/settlements" />;
}
