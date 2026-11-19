import { DeliveryDetail } from "./_components/DeliveryDetail";

export default async function Page({ params }: PageProps<"/rider/deliveries/[id]">) {
  const { id } = await params;
  return <DeliveryDetail id={Number(id)} />;
}
