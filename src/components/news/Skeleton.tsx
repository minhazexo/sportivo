import { motion } from 'motion/react';

export function ArticleCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 overflow-hidden">
      <div className="aspect-[16/10] bg-zinc-200 animate-pulse" />
      <div className="p-6 space-y-4">
        <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 bg-zinc-200 rounded animate-pulse w-full" />
          <div className="h-6 bg-zinc-200 rounded animate-pulse w-3/4" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-zinc-200 rounded animate-pulse w-full" />
          <div className="h-3 bg-zinc-200 rounded animate-pulse w-5/6" />
        </div>
        <div className="pt-4 flex items-center justify-between border-t border-zinc-100">
          <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ScoreWidgetSkeleton() {
  return (
    <div className="h-12 bg-white border-b border-zinc-300 flex items-center px-6 gap-8 overflow-hidden -mx-4 md:mx-0 shrink-0 mb-8">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-pulse" />
        <div className="w-16 h-3 bg-zinc-200 rounded animate-pulse" />
      </div>
      <div className="flex gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-6 border-r pr-8 border-zinc-200 items-center">
            <div className="w-24 h-3 bg-zinc-200 rounded animate-pulse" />
            <div className="w-12 h-3 bg-zinc-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-100">
        <div className="h-6 w-32 bg-zinc-200 rounded animate-pulse" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-zinc-50 last:border-0">
          <div className="w-8 h-6 bg-zinc-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-zinc-200 rounded-full animate-pulse" />
          <div className="flex-1 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-12 h-6 bg-zinc-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-in">
      <ScoreWidgetSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="h-10 w-40 bg-zinc-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </div>
        <aside className="space-y-8">
          <div className="bg-zinc-100 p-8 space-y-6">
            <div className="h-6 w-32 bg-zinc-200 rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-zinc-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-zinc-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-zinc-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
