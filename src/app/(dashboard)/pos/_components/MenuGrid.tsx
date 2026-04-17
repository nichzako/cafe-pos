import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CartAction } from "@/types";

const MENU_SKELETON_COUNT = 8;

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
};

type MenuGridProps = {
  menus: MenuItem[];
  isLoading: boolean;
  cartItemIds: Set<string>;
  dispatch: React.Dispatch<CartAction>;
};

export function MenuGrid({ menus, isLoading, cartItemIds, dispatch }: MenuGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: MENU_SKELETON_COUNT }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-8 w-8" />}
        title="ไม่มีเมนูในหมวดนี้"
        description="เลือกหมวดหมู่อื่น หรือติดต่อ admin เพื่อเพิ่มเมนู"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {menus.map((menu) => {
        const inCart = cartItemIds.has(menu.id);
        return (
          <button
            key={menu.id}
            onClick={() =>
              dispatch({
                type: "ADD_ITEM",
                item: { menuId: menu.id, menuName: menu.name, menuPrice: menu.price },
              })
            }
            disabled={!menu.isAvailable}
            aria-label={`เพิ่ม ${menu.name} ราคา ฿${menu.price}`}
            aria-pressed={inCart}
            className={[
              "group relative flex flex-col rounded-2xl border bg-white p-3 text-left shadow-sm",
              "transition-all active:scale-95",
              menu.isAvailable
                ? "cursor-pointer hover:border-cafe-brown-300 hover:shadow"
                : "cursor-not-allowed opacity-50",
              inCart ? "border-cafe-brown-400 ring-2 ring-cafe-brown-300" : "border-cafe-brown-100",
            ].join(" ")}
          >
            {/* Image */}
            <div className="relative mb-2 flex h-24 items-center justify-center overflow-hidden rounded-xl bg-cafe-cream-100">
              {menu.imageUrl ? (
                <Image
                  src={menu.imageUrl}
                  alt={menu.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-cafe-brown-300" />
              )}
            </div>

            {/* Info */}
            <p className="text-sm font-medium text-cafe-brown-900 leading-tight">{menu.name}</p>
            {menu.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-cafe-brown-500">{menu.description}</p>
            )}
            <p className="mt-1.5 text-sm font-semibold text-cafe-brown-700">
              ฿{Number(menu.price).toLocaleString("th-TH")}
            </p>

            {/* In-cart indicator */}
            {inCart && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cafe-brown-700 text-xs font-bold text-white">
                ✓
              </span>
            )}

            {!menu.isAvailable && (
              <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500">
                  หมด
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
