export default function POSLoading() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Menu section (left) */}
      <div className="flex flex-1 flex-col overflow-hidden p-4">
        {/* Category tabs skeleton */}
        <div className="mb-4 flex gap-1 rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1">
          {[90, 80, 100, 70, 90].map((w, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg bg-cafe-brown-100"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Menu grid skeleton */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-cafe-brown-100 bg-white p-4 space-y-3"
              >
                <div className="h-24 w-full animate-pulse rounded-xl bg-cafe-brown-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-5 w-16 animate-pulse rounded bg-cafe-brown-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order panel (right) */}
      <div className="w-72 shrink-0 lg:w-80 border-l border-cafe-brown-100 bg-white p-4 space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-cafe-brown-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-cafe-brown-100" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-cafe-brown-100 p-3"
            >
              <div className="h-10 w-10 animate-pulse rounded-lg bg-cafe-brown-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-cafe-brown-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 space-y-2 border-t border-cafe-brown-100">
          <div className="flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-cafe-brown-100" />
            <div className="h-4 w-16 animate-pulse rounded bg-cafe-brown-100" />
          </div>
          <div className="flex justify-between">
            <div className="h-5 w-16 animate-pulse rounded bg-cafe-brown-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-cafe-brown-100" />
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-cafe-brown-100 mt-3" />
        </div>
      </div>
    </div>
  );
}
