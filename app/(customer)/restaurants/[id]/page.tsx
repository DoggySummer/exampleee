import { RestaurantDetailView } from "./_components/RestaurantDetailView";

export default async function Page({ params }: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  return <RestaurantDetailView id={Number(id)} />;
}
