/** TanStack Query 키는 여기서만 만든다 */
export const queryKeys = {
  me: ["me"] as const,
  restaurants: ["restaurants"] as const,
  restaurant: (id: number) => ["restaurants", id] as const,
  addresses: ["addresses"] as const,
  myOrders: ["orders", "mine"] as const,
  order: (id: number) => ["orders", id] as const,
};
