export default function TablesLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-cafe-brown-100" />
        <div className="h-9 w-24 animate-pulse rounded-xl bg-cafe-brown-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="rounded-2xl border border-cafe-brown-100 bg-white p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-16 animate-pulse rounded bg-cafe-brown-100" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-cafe-brown-100" />
            </div>
            <div className="h-3 w-24 animate-pulse rounded bg-cafe-brown-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
