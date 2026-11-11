import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { parsePath, type To, type Path } from 'react-router';

import type { RouteAccess } from './route-context.js';
import { matchRouteTree, routeKey } from './route-navigation.js';

/** Only application-absolute, registered, authorized pages can be navigation destinations. */
export function navigationDestination(
  to: To,
  routes: readonly AppClientRegisteredRoute[],
  access: RouteAccess,
): Partial<Path> | undefined {
  if (access.loading) return undefined;
  const path = typeof to === 'string' ? parsePath(to) : to;
  const pathname = path.pathname;
  if (
    !pathname ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.includes('\\') ||
    [...pathname].some((character) => character.charCodeAt(0) <= 32)
  )
    return undefined;
  // Do not normalize dot segments or malformed escapes into a different authorized route.
  try {
    if (
      pathname
        .split('/')
        .some((segment) => ['.', '..'].includes(decodeURIComponent(segment)))
    )
      return undefined;
  } catch {
    return undefined;
  }
  const matches = matchRouteTree(routes, pathname);
  if (
    !matches?.at(-1)?.route.componentLoader ||
    matches.some(({ route }) => access.denied.has(routeKey(route)))
  )
    return undefined;
  return { pathname, search: path.search ?? '', hash: path.hash ?? '' };
}
