import type { ReactElement, ReactNode } from 'react';

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /**
   * Page-level actions, on the title's row at every width so a phone does not spend a row on them; keep one primary
   * action there and put the rest in a menu.
   */
  readonly actions?: ReactNode;
}

/** The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page. */
export function PageHeader({
  actions,
  description,
  title,
}: PageHeaderProps): ReactElement {
  return (
    <header className='flex items-start justify-between gap-3 sm:items-end sm:gap-4'>
      <div className='min-w-0'>
        <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em]'>
          {title}
        </h1>
        {description ? (
          <p className='mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-2'>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      ) : null}
    </header>
  );
}
