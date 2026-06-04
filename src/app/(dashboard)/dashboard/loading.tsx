export default function DashboardLoading() {
  return (
    <div className="max-w-container-max mx-auto space-y-xl animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="flex items-end justify-between pb-sm">
        <div className="space-y-sm">
          <div className="h-10 w-64 bg-surface-variant rounded-lg"></div>
          <div className="h-5 w-48 bg-surface-variant/70 rounded"></div>
        </div>
        <div className="h-11 w-32 bg-surface-variant rounded-lg"></div>
      </div>

      {/* Stats Grid (Bento Style) Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-outline-variant/30 rounded-xl p-md flex flex-col h-32 justify-between">
            <div className="flex justify-between items-start">
              <div className="h-5 w-16 bg-surface-variant rounded"></div>
              <div className="w-8 h-8 rounded-full bg-surface-variant/50"></div>
            </div>
            <div className="space-y-sm">
              <div className="h-8 w-12 bg-surface-variant rounded"></div>
              <div className="h-4 w-24 bg-surface-variant/55 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout (8/4 Split) Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Scheduled Posts Area Skeleton */}
        <div className="lg:col-span-8 bg-surface border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col h-96">
          <div className="px-lg py-md border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/20">
            <div className="h-6 w-32 bg-surface-variant rounded"></div>
            <div className="h-5 w-16 bg-surface-variant/70 rounded"></div>
          </div>
          <div className="divide-y divide-outline-variant/20 p-sm space-y-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-md flex gap-md">
                <div className="w-12 h-12 rounded-lg bg-surface-variant/50 shrink-0"></div>
                <div className="flex-1 space-y-sm">
                  <div className="flex justify-between">
                    <div className="h-5 w-2/3 bg-surface-variant rounded"></div>
                    <div className="h-5 w-16 bg-surface-variant/60 rounded-full"></div>
                  </div>
                  <div className="flex gap-md">
                    <div className="h-4 w-28 bg-surface-variant/40 rounded"></div>
                    <div className="h-4 w-24 bg-surface-variant/40 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed Posts Area Skeleton */}
        <div className="lg:col-span-4 bg-surface border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col h-80">
          <div className="px-md py-md border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/20">
            <div className="h-6 w-36 bg-surface-variant rounded"></div>
          </div>
          <div className="p-md space-y-md flex-1">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-sm p-sm border border-outline-variant/10 rounded-lg">
                <div className="h-4 w-full bg-surface-variant rounded"></div>
                <div className="h-3 w-3/4 bg-surface-variant/60 rounded"></div>
                <div className="flex justify-between pt-xs">
                  <div className="h-3.5 w-20 bg-surface-variant/40 rounded"></div>
                  <div className="h-3.5 w-12 bg-surface-variant/50 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
