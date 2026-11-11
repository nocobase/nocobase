import type { ReactElement, ReactNode } from 'react';

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
   * Page-level actions, beside the title so a phone does not spend a row on them. On a phone the title keeps at least
   * 12rem: one primary action fits beside it, while several actions wrap together onto one row under the title instead
   * of squeezing it. Keep one primary action and put the rest in a menu.
   */
  readonly actions?: ReactNode;
}

/** The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page. */
export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageHeaderProps): ReactElement {
  return (
    <header className='flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap sm:items-end sm:gap-4'>
      <div className='min-w-48 flex-1 sm:min-w-0 sm:flex-initial'>
        {eyebrow ? (
          <div className='mb-1 hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex'>
            {eyebrow}
          </div>
        ) : null}
        <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em] break-words'>
          {title}
        </h1>
        {description ? (
          <p className='mt-1 line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-2 sm:line-clamp-none'>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className='flex max-w-full flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap'>
          {actions}
        </div>
      ) : null}
    </header>
  );
}
