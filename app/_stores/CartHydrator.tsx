"use client";

import { useEffect } from "react";
import { useCart } from "./cartStore";

/** localStorage의 장바구니를 브라우저에서만 불러온다 */
export function CartHydrator() {
  useEffect(() => {
    useCart.persist.rehydrate();
  }, []);
  return null;
}
