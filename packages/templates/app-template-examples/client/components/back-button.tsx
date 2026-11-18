import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeftIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link, type To, parsePath, useResolvedPath } from 'react-router';

import { navigationDestination } from '../routing/navigation-destination.js';
import {
  useRouteTree,
  useRouteAccess,
  useRouteSearches,
} from '../routing/route-context.js';

import { cn } from 'cn';

export interface BackButtonProps {
  /**
   * Where it leads. Defaults to the parent route with its last visited query; a directly opened detail falls back
   * to the default parent list. An explicit destination must match an authorized application page.
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
}: BackButtonProps = {}): ReactElement | null {
  const { t } = useTranslation();
  const parent = useResolvedPath('..');
  const resolved = useResolvedPath(to ?? '..');
  const routes = useRouteTree();
  const access = useRouteAccess();
  const searches = useRouteSearches();

  const fallback = {
    ...parent,
    search: searches.get(parent.pathname.replace(/\/+$/u, '') || '/') ?? '',
  };
  const rawPath =
    typeof to === 'string' ? parsePath(to).pathname : to?.pathname;
  const unsafe =
    rawPath &&
    (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(rawPath) ||
      rawPath.includes('\\') ||
      [...rawPath].some((character) => character.charCodeAt(0) <= 32));
  const primary = unsafe
    ? undefined
    : navigationDestination(
        to && rawPath?.startsWith('/') ? to : to ? resolved : fallback,
        routes,
        access,
      );
  const destination =
    primary ?? navigationDestination(fallback, routes, access);
  if (!destination) return null;

  return (
    <Link
      replace
      className={cn(
        'inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      to={destination}
    >
      <ArrowLeftIcon className='size-4' />
      {(primary ? children : undefined) ??
        t('navigation.back', { defaultValue: 'Back' })}
    </Link>
  );
}
