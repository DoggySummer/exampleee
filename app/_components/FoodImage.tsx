import Image from "next/image";
import { LuUtensils } from "react-icons/lu";

/** 가게·메뉴 사진. 사진이 없으면 회색 칸 + 아이콘 */
export function FoodImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-field text-faint ${className}`} aria-hidden>
        <LuUtensils size={22} />
      </div>
    );
  }
  // 가짜 데이터는 SVG라 최적화를 끈다. 실제 사진(서버 uploads/)으로 바뀌면 images 설정 후 최적화 사용
  return (
    <div className={`relative overflow-hidden bg-field ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 480px) 100vw, 480px" unoptimized className="object-cover" />
    </div>
  );
}
