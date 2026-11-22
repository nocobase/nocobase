import type { ReactElement, ReactNode } from 'react';

import { cn } from '#lib/utils';

export interface PageHeaderProps {
  readonly title: ReactNode;
  /**
   * A short line about the page. On a phone it shows at most two lines, so the first screen reaches the page's content
   * (mobile.md M1.1); wider screens show all of it. Keep what the user must read elsewhere, such as an `Alert`.
   */
  readonly description?: ReactNode;
  /** A small label above the title, such as the workspace or section. Shown from 640px up; phones leave it out. */
  readonly eyebrow?: ReactNode;
  /**
   * Page-level actions, beside the title so a phone does not spend a row on them. Keep one primary action and put the
   * rest in a menu.
   */
  readonly actions?: ReactNode;
  /** A line under the description that every width shows in full, such as a link that explains the page. */
  readonly note?: ReactNode;
}

/** The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page. */
export function PageHeader({
  actions,
  description,
  eyebrow,
  note,
  title,
}: PageHeaderProps): ReactElement {
  const below = description || note;
  return (
    // On a phone the title shares its row with the actions and the description takes the full width under both; wider
    // screens keep the description under the title and the actions at the bottom of the header.
    <header className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 sm:gap-x-4 sm:gap-y-2'>
      <div className='min-w-0'>
        {eyebrow ? (
          <div className='mb-1 hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex'>
            {eyebrow}
          </div>
        ) : null}
        <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em] break-words'>
          {title}
        </h1>
      </div>
      {below ? (
        <div className='col-span-2 min-w-0 sm:col-span-1'>
          {description ? (
            <p className='line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:line-clamp-none'>
              {description}
            </p>
          ) : null}
          {note ? <div className='mt-1 text-sm leading-6'>{note}</div> : null}
        </div>
      ) : null}
      {actions ? (
        <div
          className={cn(
            'col-start-2 row-start-1 flex max-w-full flex-wrap items-center justify-end gap-2 sm:flex-nowrap',
            below && 'sm:row-span-2 sm:self-end',
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
