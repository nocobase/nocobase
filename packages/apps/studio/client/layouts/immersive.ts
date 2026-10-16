/**
 * Routes that hide the shell's header on a phone, so the page has the whole height: an issue's page, under whichever
 * list opens it. It draws its own row (the task detail's top row) with the way back and to the navigation the header
 * would have given; a wider screen keeps the header.
 */
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';

import { matchRouteTree } from '../routing/route-navigation.js';

/** By route name: every `…issue-detail` that `routes.ts` declares under a list. */
export function isImmersiveOnPhone(name: string): boolean {
  return name.endsWith('issue-detail');
}

export function immersiveOnPhone(
  routes: readonly AppClientRegisteredRoute[],
  pathname: string,
): boolean {
  return (matchRouteTree(routes, pathname) ?? []).some((match) =>
    isImmersiveOnPhone(match.route.name),
  );
}
