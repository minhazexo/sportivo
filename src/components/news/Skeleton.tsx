import { motion } from 'motion/react';

export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)' }}>
      <div className="aspect-[16/10] animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)' }} />
      <div className="p-6 space-y-4">
        <div className="h-3 w-16 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
        <div className="space-y-2">
          <div className="h-6 animate-pulse w-full" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          <div className="h-6 animate-pulse w-3/4" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
        </div>
        <div className="space-y-2">
          <div className="h-3 animate-pulse w-full" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          <div className="h-3 animate-pulse w-5/6" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
        </div>
        <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border-primary)' }}>
          <div className="h-3 w-20 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          <div className="h-3 w-16 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
}

export function ScoreWidgetSkeleton() {
  return (
    <div className="h-12 flex items-center px-6 gap-8 overflow-hidden -mx-4 md:mx-0 shrink-0 mb-8" style={{ backgroundColor: 'var(--color-card-bg)', borderBottom: '1px solid var(--color-border-primary)' }}>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 bg-[var(--color-skeleton)] rounded-full animate-pulse" />
        <div className="w-16 h-3 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
      </div>
      <div className="flex gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-6 pr-8 items-center" style={{ borderRight: '1px solid var(--color-border-primary)' }}>
            <div className="w-24 h-3 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
            <div className="w-12 h-3 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-border-primary)', borderRadius: '8px' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
        <div className="h-6 w-32 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 last:border-0" style={{ borderBottom: i < rows - 1 ? '1px solid var(--color-border-primary)' : 'none' }}>
          <div className="w-8 h-6 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          <div className="w-8 h-8 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-skeleton)' }} />
          <div className="flex-1 h-4 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          <div className="w-12 h-6 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
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
          <div className="h-10 w-40 animate-pulse mb-6" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </div>
        <aside className="space-y-8">
          <div className="p-8 space-y-6" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <div className="h-6 w-32 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
                <div className="h-4 w-full animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
                <div className="h-3 w-12 animate-pulse" style={{ backgroundColor: 'var(--color-skeleton)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
