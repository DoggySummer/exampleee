/** TanStack Query 키는 여기서만 만든다 */
export const queryKeys = {
  me: ["me"] as const,
  restaurants: ["restaurants"] as const,
  restaurant: (id: number) => ["restaurants", id] as const,
  addresses: ["addresses"] as const,
  myOrders: ["orders", "mine"] as const,
  order: (id: number) => ["orders", id] as const,
  ownerRestaurant: ["owner", "restaurant"] as const,
  ownerOrders: ["owner", "orders"] as const,
  ownerSettlements: ["owner", "settlements"] as const,
  settlement: (id: number) => ["settlements", id] as const,
  riderMe: ["rider", "me"] as const,
  available: ["rider", "available"] as const,
  myDeliveries: ["rider", "deliveries"] as const,
  riderSettlements: ["rider", "settlements"] as const,
};
