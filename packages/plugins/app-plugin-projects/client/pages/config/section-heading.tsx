import type { ReactElement, ReactNode } from 'react';

/** The heading of a settings tab section: title, one sentence, and actions on the right. */
export function SectionHeading({
  id,
  title,
  description,
  actions,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}): ReactElement {
  return (
    <div className='flex flex-wrap items-end justify-between gap-3'>
      <div className='min-w-0'>
        <h2 id={id} className='font-heading text-sm font-semibold'>
          {title}
        </h2>
        {description ? (
          <p className='text-sm text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      ) : null}
    </div>
  );
}
