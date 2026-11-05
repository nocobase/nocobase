import { usePageBreadcrumbLevels } from '@nocobase/app-client';
import type { PageBreadcrumbLevel } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeftIcon } from 'lucide-react';
import { Fragment, type ReactElement } from 'react';
import { Link } from 'react-router';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { settingsHomeRoute } from '#lib/navigation-transform';
import { cn } from 'cn';

import {
  useRouteTree,
  useRouteAccess,
  useRouteTrail,
  useRouteSearches,
  type RouteTrailEntry,
} from '../routing/route-context.js';
import { navigationDestination } from '../routing/navigation-destination.js';
import { routeKey } from '../routing/route-navigation.js';

export interface BreadcrumbsProps {
  readonly className?: string;
  /** Route keys the viewer may not open (`useRouteNavigation`): the trail names none of them. */
  readonly denied?: ReadonlySet<string>;
}

/**
 * The trail of destinations leading to the current page, which the layout renders in its header after the sidebar
 * toggle. Pages do not place it.
 *
 * By default it is the route trail: a route earns a level by declaring `breadcrumb`, or by being a menu page
 * (`navigation` with a component), and structure that only owns a path segment — a tab, an overlay, a group with
 * neither — is skipped. A page whose trail names records, or does not follow its URL, declares the whole trail with
 * `usePageBreadcrumb` from `@nocobase/app-client`. Earlier levels link where a page sits behind them; the last is the
 * current page.
 *
 * On a phone the current title and a link to the nearest authorized parent show; on a medium screen a trail of three or more levels keeps its
 * first and last and folds the middle into a menu.
 */
export function Breadcrumbs({
  className,
  denied,
}: BreadcrumbsProps = {}): ReactElement | null {
  const trail = useRouteTrail();
  const routes = useRouteTree();
  const contextAccess = useRouteAccess();
  const access = denied
    ? {
        ...contextAccess,
        denied: new Set([...contextAccess.denied, ...denied]),
      }
    : contextAccess;
  const searches = useRouteSearches();
  const declared = usePageBreadcrumbLevels();
  const { t } = useTranslation();
  const candidates =
    declared ??
    trail.flatMap((entry): PageBreadcrumbLevel[] => {
      const title = routeLevelTitle(entry);
      if (title === undefined || denied?.has(routeKey(entry.route))) return [];
      // The settings group links to its home page, the way back from any settings module.
      const home = settingsHomeRoute(entry.route);
      if (home)
        return [
          {
            label: t(title, {
              ns: entry.route.packageName,
              defaultValue: title,
            }),
            to: { pathname: home.path, search: searches.get(home.path) ?? '' },
          },
        ];
      return [
        {
          label: t(title, {
            ns: entry.route.packageName,
            defaultValue: title,
          }),
          ...(entry.route.componentLoader
            ? {
                to: {
                  pathname: entry.pathname,
                  search:
                    searches.get(entry.pathname.replace(/\/+$/u, '') || '/') ??
                    '',
                },
              }
            : {}),
        },
      ];
    });

  const trailLevels = candidates.flatMap(
    (level, index): PageBreadcrumbLevel[] => {
      if (!level.to) return [level];
      const to = navigationDestination(level.to, routes, access);
      // Keep the current title during permission checks, but never expose an inaccessible ancestor's name.
      return to
        ? [{ ...level, to }]
        : index === candidates.length - 1
          ? [{ label: level.label }]
          : [];
    },
  );

  if (trailLevels.length === 0) return null;
  // A level is told apart by its depth and label; two levels may share either alone.
  const levels = trailLevels.map((level, depth) => ({
    ...level,
    key: `${depth}:${level.label}`,
  }));
  const last = levels.length - 1;
  const folded = levels.slice(1, last);
  const parent = levels.slice(0, last).findLast((level) => level.to);

  return (
    <Breadcrumb
      aria-label={t('navigation.breadcrumb', { defaultValue: 'Breadcrumb' })}
      className={cn('min-w-0', className)}
    >
      <BreadcrumbList className='flex-nowrap'>
        {parent ? (
          <BreadcrumbItem className='shrink-0 md:hidden'>
            <BreadcrumbLink
              aria-label={t('navigation.backTo', {
                label: parent.label,
                defaultValue: `Back to ${parent.label}`,
              })}
              title={parent.label}
              className='inline-flex size-9 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-ring'
              render={<Link to={parent.to!} replace />}
            >
              <ArrowLeftIcon aria-hidden='true' className='size-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : null}
        {levels.map((level, index) => (
          <Fragment key={level.key}>
            {index === 1 && folded.length > 0 ? (
              <>
                <BreadcrumbItem className='hidden md:inline-flex lg:hidden'>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={t('navigation.breadcrumbMore', {
                        defaultValue: 'Show the levels in between',
                      })}
                      className='rounded-sm transition-colors hover:text-foreground'
                    >
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start'>
                      {folded.map((middle) =>
                        middle.to ? (
                          <DropdownMenuItem
                            key={middle.key}
                            render={<Link to={middle.to} />}
                          >
                            {middle.label}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem key={middle.key} disabled>
                            {middle.label}
                          </DropdownMenuItem>
                        ),
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block lg:hidden' />
              </>
            ) : null}
            <BreadcrumbItem
              className={cn(
                'min-w-0',
                index === last
                  ? undefined
                  : index === 0
                    ? 'hidden shrink-0 md:inline-flex'
                    : 'hidden shrink-0 lg:inline-flex',
              )}
            >
              {index === last ? (
                <BreadcrumbPage
                  title={level.label}
                  className='truncate font-medium'
                >
                  {level.label}
                </BreadcrumbPage>
              ) : level.to ? (
                <BreadcrumbLink
                  className='max-w-48 truncate'
                  render={<Link to={level.to} />}
                >
                  {level.label}
                </BreadcrumbLink>
              ) : (
                <span className='max-w-48 truncate'>{level.label}</span>
              )}
            </BreadcrumbItem>
            {index < last ? (
              <BreadcrumbSeparator
                className={index === 0 ? 'hidden md:block' : 'hidden lg:block'}
              />
            ) : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** A route's level title: its `breadcrumb`, else the menu title of a page; `undefined` for structure. */
function routeLevelTitle(entry: RouteTrailEntry): string | undefined {
  const { route } = entry;
  if (route.breadcrumb) return route.breadcrumb.title;
  if (route.navigation && route.componentLoader) return route.navigation.title;
  return undefined;
}

Breadcrumbs.displayName = 'Breadcrumbs';
