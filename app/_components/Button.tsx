import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
}

export function Button({ variant = "primary", size = "lg", className = "", ...rest }: Props) {
  const v =
    variant === "primary"
      ? "bg-brand text-white active:bg-brand-press disabled:opacity-45"
      : "bg-field text-ink active:bg-line disabled:opacity-45";
  const s = size === "lg" ? "h-[54px] text-[17px] rounded-xl" : "h-12 text-base rounded-[10px]";
  return <button className={`${v} ${s} w-full font-extrabold transition-colors ${className}`} {...rest} />;
}
