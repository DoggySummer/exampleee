import { OrderDetailView } from "./_components/OrderDetailView";

export default async function Page({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return <OrderDetailView id={Number(id)} />;
}
