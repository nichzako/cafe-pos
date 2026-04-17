export default function MenuLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-cafe-brown-100" />
        <div className="h-9 w-28 animate-pulse rounded-xl bg-cafe-brown-100" />
      </div>
      <div className="flex gap-1 rounded-xl border border-cafe-brown-100 bg-cafe-brown-50 p-1">
        {[80, 90, 70, 100].map((w, i) => (
          <div key={`skeleton-${i}`} className="h-9 animate-pulse rounded-lg bg-cafe-brown-100" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="rounded-2xl border border-cafe-brown-100 bg-white p-4 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-cafe-brown-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-cafe-brown-100" />
            <div className="flex justify-between">
              <div className="h-5 w-16 animate-pulse rounded bg-cafe-brown-100" />
              <div className="h-6 w-12 animate-pulse rounded-full bg-cafe-brown-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
