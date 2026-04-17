type Category = {
  id: string;
  name: string;
  _count: { menus: number };
};

type CategoryTabsProps = {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
};

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="หมวดหมู่เมนู"
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
    >
      <button
        role="tab"
        aria-selected={activeId === null}
        onClick={() => onSelect(null)}
        className={[
          "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
          activeId === null
            ? "bg-cafe-brown-700 text-white"
            : "bg-cafe-brown-100 text-cafe-brown-700 hover:bg-cafe-brown-200",
        ].join(" ")}
      >
        ทั้งหมด
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={activeId === cat.id}
          onClick={() => onSelect(cat.id)}
          className={[
            "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            activeId === cat.id
              ? "bg-cafe-brown-700 text-white"
              : "bg-cafe-brown-100 text-cafe-brown-700 hover:bg-cafe-brown-200",
          ].join(" ")}
        >
          {cat.name}
          <span className="ml-1.5 text-xs opacity-70">({cat._count.menus})</span>
        </button>
      ))}
    </div>
  );
}
