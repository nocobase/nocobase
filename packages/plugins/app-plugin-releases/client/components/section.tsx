/**
 * A block of a page: a small semibold heading with an optional count, one line of description and the block's actions
 * on the right, then its content. The application's detail pages head their blocks the same way (the projects
 * plugin's `PmSectionHeading`).
 */
import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

export function Section({
  title,
  count,
  description,
  actions,
  children,
  className,
}: {
  readonly title: ReactNode;
  readonly count?: number;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <section className={cn('space-y-3', className)}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='flex items-center gap-2 font-heading text-sm font-semibold'>
            {title}
            {count !== undefined ? (
              <span className='text-xs font-normal text-muted-foreground tabular-nums'>
                {count}
              </span>
            ) : null}
          </h2>
          {description ? (
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className='flex shrink-0 flex-wrap items-center gap-2'>
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
