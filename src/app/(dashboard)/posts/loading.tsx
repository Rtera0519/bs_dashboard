export default function PostsLoading() {
  return (
    <div className="p-lg lg:p-xl max-w-container-max mx-auto w-full space-y-lg animate-pulse">
      {/* Title & Search Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
        <div className="h-10 w-24 bg-surface-variant rounded-lg"></div>
        <div className="h-11 w-full max-w-md bg-surface-variant/80 rounded-lg"></div>
      </div>

      {/* Status Tabs Skeleton */}
      <div className="flex gap-sm border-b border-outline-variant/30 pb-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-20 bg-surface-variant/70 rounded-md"></div>
        ))}
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-surface border border-outline-variant/30 rounded-lg overflow-hidden shadow-sm">
        <div className="p-md bg-surface-container-low/20 border-b border-outline-variant/20 flex gap-md">
          <div className="h-5 w-2/5 bg-surface-variant rounded"></div>
          <div className="h-5 w-24 bg-surface-variant rounded"></div>
          <div className="h-5 w-32 bg-surface-variant rounded"></div>
          <div className="h-5 w-32 bg-surface-variant rounded"></div>
          <div className="h-5 w-24 bg-surface-variant ml-auto rounded"></div>
        </div>
        
        <div className="divide-y divide-outline-variant/10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-md flex items-center gap-md h-20">
              {/* Content Column */}
              <div className="flex items-start gap-sm w-2/5">
                <div className="w-10 h-10 rounded bg-surface-variant/60 shrink-0"></div>
                <div className="flex-1 space-y-sm">
                  <div className="h-4 w-full bg-surface-variant rounded"></div>
                  <div className="h-3.5 w-2/3 bg-surface-variant/50 rounded"></div>
                </div>
              </div>
              {/* Status Column */}
              <div className="w-24">
                <div className="h-6 w-16 bg-surface-variant/70 rounded-full"></div>
              </div>
              {/* Date Columns */}
              <div className="w-32">
                <div className="h-4 w-24 bg-surface-variant/50 rounded"></div>
              </div>
              <div className="w-32">
                <div className="h-4 w-24 bg-surface-variant/50 rounded"></div>
              </div>
              {/* Action Column */}
              <div className="w-24 ml-auto flex justify-end gap-sm">
                <div className="w-8 h-8 rounded bg-surface-variant/40"></div>
                <div className="w-8 h-8 rounded bg-surface-variant/40"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
