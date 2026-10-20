import type { ReactElement, ReactNode } from 'react';

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Page-level actions, aligned to the right of the title at every viewport width. */
  readonly actions?: ReactNode;
}

/** The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page. */
export function PageHeader({
  actions,
  description,
  title,
}: PageHeaderProps): ReactElement {
  return (
    <header className='flex flex-col gap-2'>
      <div className='flex items-start justify-between gap-4'>
        <h1 className='min-w-0 font-heading text-2xl font-semibold tracking-[-0.035em]'>
          {title}
        </h1>
        {actions ? (
          <div className='flex shrink-0 items-center gap-2'>{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
          {description}
        </p>
      ) : null}
    </header>
  );
}
