import { LuBike, LuClipboardList, LuHouse, LuReceiptText, LuStore, LuUser, LuUtensils, LuWallet } from "react-icons/lu";
import type { Role } from "@/app/_lib/constants/roles";
import type { Tab } from "./BottomTabBar";

export const CUSTOMER_TABS: Tab[] = [
  { href: "/", label: "홈", icon: LuHouse },
  { href: "/orders", label: "주문내역", icon: LuReceiptText },
  { href: "/my/addresses", label: "내 정보", icon: LuUser },
];

export const OWNER_TABS: Tab[] = [
  { href: "/owner", label: "주문", icon: LuClipboardList },
  { href: "/owner/menus", label: "메뉴", icon: LuUtensils },
  { href: "/owner/settlements", label: "정산", icon: LuWallet },
  { href: "/owner/restaurant", label: "가게", icon: LuStore },
];

export const RIDER_TABS: Tab[] = [
  { href: "/rider", label: "홈", icon: LuHouse },
  { href: "/rider/deliveries", label: "내 배달", icon: LuBike },
  { href: "/rider/settlements", label: "정산", icon: LuWallet },
];

export const TABS: Record<Role, Tab[]> = {
  customer: CUSTOMER_TABS,
  owner: OWNER_TABS,
  rider: RIDER_TABS,
};
