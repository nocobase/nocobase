import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

export interface TaskCenterLayoutProps {
  /** Usually a `TaskSourceNav`. */
  readonly navigation: ReactNode;
  /** The status tabs, the list and its bars. */
  readonly children: ReactNode;
  /** Names the list for assistive technology, such as "Waiting for my approval / Leave". */
  readonly label?: string;
  readonly className?: string;
}

/**
 * A navigation column of 16rem beside the list from the large breakpoint, with the navigation kept in view while the
 * list scrolls; stacked above the list below that.
 */
export function TaskCenterLayout({
  children,
  className,
  label,
  navigation,
}: TaskCenterLayoutProps): ReactElement {
  return (
    <div
      className={cn(
        'grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]',
        className,
      )}
    >
      <div className='lg:sticky lg:top-4'>{navigation}</div>
      <section aria-label={label} className='flex min-w-0 flex-col gap-5'>
        {children}
      </section>
    </div>
  );
}
