export default function OrderDetailLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header: back + title + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-cafe-brown-100" />
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-cafe-brown-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-cafe-brown-100" />
          </div>
        </div>
        <div className="h-7 w-20 animate-pulse rounded-full bg-cafe-brown-100" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Items list */}
        <div className="lg:col-span-2 rounded-2xl border border-cafe-brown-100 bg-white p-4 space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-cafe-brown-100" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-t border-cafe-brown-100 pt-3"
            >
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-cafe-brown-100" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-cafe-brown-100" />
            </div>
          ))}
        </div>

        {/* Summary + actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-cafe-brown-100 bg-white p-4 space-y-3">
            <div className="h-5 w-24 animate-pulse rounded bg-cafe-brown-100" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-cafe-brown-100" />
              </div>
            ))}
            <div className="flex justify-between border-t border-cafe-brown-100 pt-3">
              <div className="h-5 w-16 animate-pulse rounded bg-cafe-brown-100" />
              <div className="h-5 w-20 animate-pulse rounded bg-cafe-brown-100" />
            </div>
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-cafe-brown-100" />
        </div>
      </div>
    </div>
  );
}
