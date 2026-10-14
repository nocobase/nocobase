import { usePageBreadcrumbLevels } from '@nocobase/app-client';
import type { PageBreadcrumbLevel } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
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
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'cn';

import {
  useRouteTrail,
  type RouteTrailEntry,
} from '../routing/route-context.js';
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
 * On a phone only the last level shows, beside the brand; on a medium screen a trail of three or more levels keeps its
 * first and last and folds the middle into a menu.
 */
export function Breadcrumbs({
  className,
  denied,
}: BreadcrumbsProps = {}): ReactElement | null {
  const trail = useRouteTrail();
  const declared = usePageBreadcrumbLevels();
  const { t } = useTranslation();
  const trailLevels =
    declared ??
    trail.flatMap((entry): PageBreadcrumbLevel[] => {
      const title = routeLevelTitle(entry);
      if (title === undefined || denied?.has(routeKey(entry.route))) return [];
      return [
        {
          label: t(title, {
            ns: entry.route.packageName,
            defaultValue: title,
          }),
          ...(entry.route.componentLoader ? { to: entry.pathname } : {}),
        },
      ];
    });

  if (trailLevels.length === 0) return null;
  // A level is told apart by its depth and label; two levels may share either alone.
  const levels = trailLevels.map((level, depth) => ({
    ...level,
    key: `${depth}:${level.label}`,
  }));
  const last = levels.length - 1;
  const folded = levels.slice(1, last);

  return (
    <Breadcrumb
      aria-label={t('navigation.breadcrumb', { defaultValue: 'Breadcrumb' })}
      className={cn('min-w-0', className)}
    >
      <BreadcrumbList className='flex-nowrap'>
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
                <BreadcrumbPage className='truncate font-medium'>
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
