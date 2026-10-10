import {
  compareNavigationOrder,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';

import { isPage, type Page } from '../../../../shared/pages.js';
import routes from '../../../routes.js';

/** A sidebar section's pages that a role may be granted; `title` is the section's, null for the top entries. */
export interface PageGroup {
  readonly title: string | null;
  readonly pages: readonly Page[];
}

/** The page a menu entry is behind, when it is one a role is granted. */
function pageOf(route: AppClientRouteDefinition): Page | null {
  const authz = 'authz' in route ? route.authz : undefined;
  return typeof authz === 'object' &&
    authz.resource.type === 'page' &&
    isPage(authz.resource.id)
    ? authz.resource.id
    : null;
}

/** The menu entries among `list`, in menu order. */
const inMenuOrder = (
  list: readonly AppClientRouteDefinition[],
): AppClientRouteDefinition[] =>
  list.filter((route) => route.navigation).sort(compareNavigationOrder);

/**
 * The grantable pages grouped and ordered as the sidebar shows them: the top entries, then each section in turn.
 * Sections without such a page (Settings, whose tabs are settings items) are left out.
 */
export function pageGroupsOf(
  contributions: readonly AppClientRouteContribution[],
): readonly PageGroup[] {
  const top = inMenuOrder(
    contributions.flatMap((contribution) =>
      contribution.parent === 'app' ? contribution.routes : [],
    ),
  );
  const groups: { title: string | null; pages: Page[] }[] = [];
  for (const route of top) {
    if (!route.componentLoader && route.children) {
      groups.push({
        title: route.navigation?.title ?? null,
        pages: inMenuOrder(route.children)
          .map(pageOf)
          .filter((page) => page !== null),
      });
      continue;
    }
    const page = pageOf(route);
    if (!page) continue;
    const last = groups.at(-1);
    if (last && last.title === null) last.pages.push(page);
    else groups.push({ title: null, pages: [page] });
  }
  return groups.filter((group) => group.pages.length > 0);
}

/** The role editor's page access, from Studio's own routes (`client/routes.ts`). */
export const PAGE_GROUPS: readonly PageGroup[] = pageGroupsOf(routes);
