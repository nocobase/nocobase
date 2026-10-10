import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeftIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link, type To, useLocation } from 'react-router';

import { cn } from 'cn';

export interface BackButtonProps {
  /**
   * Where it leads. Defaults to the parent route with the current query string, as closing a route overlay does, so
   * the list a child page covers keeps its search and filters.
   */
  readonly to?: To;
  /** The label, "Back" by default. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * The way back from a page that sits below another one: a covering child page, a record's own page, a form too long
 * for a dialog.
 *
 * It stands on its own, above the page's heading where breadcrumbs would otherwise be, and needs no `PageHeader`.
 * Going back is navigation, so it is a muted text link with an arrow, turning to the foreground on hover: no button
 * chrome, so it reads as a way out rather than an action. It replaces the history entry, as closing a route overlay
 * does, so the browser's Back does not return to the page just left, such as a form that would reopen empty.
 */
export function BackButton({
  children,
  className,
  to,
}: BackButtonProps = {}): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Link
      replace
      className={cn(
        'inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      to={to ?? { pathname: '..', search: location.search }}
    >
      <ArrowLeftIcon className='size-4' />
      {children ?? t('navigation.back', { defaultValue: 'Back' })}
    </Link>
  );
}
