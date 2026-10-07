import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

/** One section of a detail page, as NocoProject's agent page stacks them: a heading, a sentence, then its form. */
export function AgSection({
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  readonly id: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <section
      className={cn('max-w-2xl space-y-3', className)}
      aria-labelledby={id}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='min-w-0 space-y-1'>
          <h2 id={id} className='font-heading text-sm font-semibold'>
            {title}
          </h2>
          {description ? (
            <p className='text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
        {actions ? <div className='flex gap-2'>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
