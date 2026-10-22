import type { ReactElement, ReactNode } from 'react';

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Page-level actions, aligned to the right of the title from the `sm` breakpoint up. */
  readonly actions?: ReactNode;
  /** The title's `id`, for a region the title names (`aria-labelledby`). */
  readonly titleId?: string;
}

/**
 * The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page.
 * This plugin sizes it for a work tool: a 2xl title, a one-line description, the
 * actions vertically centred on the right with the one primary action last.
 */
export function PageHeader({
  actions,
  description,
  title,
  titleId,
}: PageHeaderProps): ReactElement {
  return (
    <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0'>
        <h1
          id={titleId}
          className='font-heading text-2xl font-semibold tracking-tight'
        >
          {title}
        </h1>
        {description ? (
          <p className='mt-1.5 max-w-3xl text-sm text-muted-foreground'>
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
