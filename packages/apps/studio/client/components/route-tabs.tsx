import type { ReactElement, ReactNode } from 'react';
import {
  matchPath,
  resolvePath,
  useHref,
  useLinkClickHandler,
  useLocation,
  useResolvedPath,
  type To,
} from 'react-router';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * A trigger that is a link. A plain anchor with React Router's click handler, not `<Link>`: `<Link>` gives its anchor a
 * new ref on every render, and the tab list registers its items by ref, so the two would update each other forever.
 */
function RouteTabTrigger({
  value,
  to,
  children,
}: {
  readonly value: string;
  readonly to: To;
  readonly children: ReactNode;
}): ReactElement {
  const href = useHref(to);
  const onClick = useLinkClickHandler(to);
  return (
    <TabsTrigger
      value={value}
      nativeButton={false}
      render={<a href={href} onClick={onClick} />}
    >
      {children}
    </TabsTrigger>
  );
}

export interface RouteTab {
  /** The child route path relative to the page, such as `owned`. */
  readonly path: string;
  readonly label: string;
  /** After the label, such as a count. */
  readonly extra?: ReactNode;
}

function kept(search: string, drop: readonly string[]): string {
  if (drop.length === 0) return search;
  const params = new URLSearchParams(search);
  for (const name of drop) params.delete(name);
  const text = params.toString();
  return text ? `?${text}` : '';
}

/**
 * Page tabs that are child routes: the shadcn tabs, each trigger a link, the selected one the tab whose route the
 * location is in. The query string is kept unless `keepSearch` is false. The page renders its `<Outlet />` below.
 */
export function RouteTabs({
  tabs,
  label,
  keepSearch = true,
  dropParams = [],
}: {
  readonly tabs: readonly RouteTab[];
  readonly label: string;
  readonly keepSearch?: boolean;
  /** Query parameters that belong to one tab, left behind when moving to another, such as the selected task. */
  readonly dropParams?: readonly string[];
}): ReactElement {
  const location = useLocation();
  const base = useResolvedPath('.').pathname;
  const active =
    tabs.find(
      (tab) =>
        matchPath(
          { path: resolvePath(tab.path, base).pathname, end: false },
          location.pathname,
        ) !== null,
    )?.path ?? null;
  return (
    <Tabs value={active} className='shrink-0'>
      <TabsList variant='line' aria-label={label}>
        {tabs.map((tab) => (
          <RouteTabTrigger
            key={tab.path}
            value={tab.path}
            to={{
              pathname: tab.path,
              search: keepSearch
                ? kept(location.search, dropParams)
                : undefined,
            }}
          >
            {tab.label}
            {tab.extra}
          </RouteTabTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
