export default function StaffLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-cafe-brown-100" />
        <div className="h-9 w-28 animate-pulse rounded-xl bg-cafe-brown-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="rounded-2xl border border-cafe-brown-100 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-28 animate-pulse rounded bg-cafe-brown-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-cafe-brown-100" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-full bg-cafe-brown-100" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="h-3 w-24 animate-pulse rounded bg-cafe-brown-100" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-cafe-brown-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
