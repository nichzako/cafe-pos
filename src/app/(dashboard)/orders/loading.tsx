export default function OrdersLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Title skeleton */}
      <div className="h-7 w-40 animate-pulse rounded-lg bg-cafe-brown-100" />

      {/* Tab bar skeleton */}
      <div className="flex gap-1 rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1">
        {[120, 100, 100, 90].map((w, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-lg bg-cafe-brown-100"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-cafe-brown-100 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-cafe-brown-100" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-cafe-brown-100" />
            </div>
            <div className="mt-3 flex gap-3">
              <div className="h-3 w-16 animate-pulse rounded bg-cafe-brown-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-cafe-brown-100" />
              <div className="ml-auto h-3 w-14 animate-pulse rounded bg-cafe-brown-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
