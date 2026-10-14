/**
 * Routes that hide the shell's header on a phone, so the page has the whole height: My follow-ups and an issue's page,
 * under whichever list opens it. Such a page draws its own phone bar (`components/phone-bar.tsx`) with the way to the
 * navigation and to the agent chat the header would have given; a wider screen keeps the header.
 */
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';

import { matchRouteTree } from '../routing/route-navigation.js';

/** By route name: `follow-ups`, and every `…issue-detail` that `routes.ts` declares under a list. */
export function isImmersiveOnPhone(name: string): boolean {
  return name === 'follow-ups' || name.endsWith('issue-detail');
}

export function immersiveOnPhone(
  routes: readonly AppClientRegisteredRoute[],
  pathname: string,
): boolean {
  return (matchRouteTree(routes, pathname) ?? []).some((match) =>
    isImmersiveOnPhone(match.route.name),
  );
}
