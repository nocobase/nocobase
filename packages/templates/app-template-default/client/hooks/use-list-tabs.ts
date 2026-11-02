import { useLocation, useResolvedPath } from 'react-router';
import { useRouteSearches } from '../routing/route-context.js';

export interface ListTab {
  readonly path: string;
  readonly label: string;
  /** Tabs sharing a dataset may retain its filters, sorting and pagination. */
  readonly dataset: string;
}

/** Tabs are routes; only a list's own parameters are discarded on a dataset change. */
export function useListTabs({
  tabs,
  parameterKeys,
  pending = false,
}: {
  tabs: readonly ListTab[];
  parameterKeys: readonly string[];
  pending?: boolean;
}) {
  const location = useLocation();
  const parent = useResolvedPath('.').pathname.replace(/\/+$/u, '');
  const searches = useRouteSearches();
  const segment = location.pathname.slice(parent.length + 1).split('/')[0];
  const active = tabs.find((tab) => tab.path === segment);
  const destination = (tab: ListTab) => {
    const params = new URLSearchParams(location.search);
    if (!active || tab.dataset !== active.dataset) {
      for (const key of parameterKeys) params.delete(key);
    }
    return { pathname: `${parent}/${tab.path}`, search: params.toString() };
  };
  const activePath = active ? `${parent}/${active.path}` : undefined;
  return {
    active,
    source: activePath
      ? { pathname: activePath, search: searches.get(activePath) ?? '' }
      : undefined,
    destination,
    fallback: !pending && !active && tabs[0] ? destination(tabs[0]) : undefined,
  };
}
