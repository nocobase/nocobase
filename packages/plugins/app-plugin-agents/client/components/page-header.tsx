import { useContext, type ReactElement, type ReactNode } from 'react';

import { cn } from 'cn';

import { PageTitleContext } from '../lib/page-title-context.js';

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Page-level actions, aligned to the right of the title from the `sm` breakpoint up. */
  readonly actions?: ReactNode;
}

/**
 * The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page.
 * This plugin sizes it for a work tool: a 2xl title, a one-line description, the
 * actions vertically centred on the right with the one primary action last.
 *
 * Under an application's own heading or tab bar (`PageTitleContext` is `screenReaderOnly`) the title is read by screen
 * readers only, and the description and actions take its row.
 */
export function PageHeader({
  actions,
  description,
  title,
}: PageHeaderProps): ReactElement {
  const titleShown = useContext(PageTitleContext) === 'visible';
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        // Nothing left to show: the header takes no room either.
        !titleShown && !description && !actions && 'sr-only',
      )}
    >
      <div className='min-w-0'>
        <h1
          className={
            titleShown
              ? 'font-heading text-2xl font-semibold tracking-tight'
              : 'sr-only'
          }
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              'max-w-3xl text-sm text-muted-foreground',
              titleShown && 'mt-1.5',
            )}
          >
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
