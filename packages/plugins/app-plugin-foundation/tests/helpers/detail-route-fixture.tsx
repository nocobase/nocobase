import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { PropsWithChildren } from 'react';
import { DetailRouteContext } from '../../client/capability-guide/details/route-context.js';

/** Preserves the existing overview fixtures while their assertions await prototype acceptance. */
export function RouteTreeProvider({
  children,
  routes,
  access,
}: PropsWithChildren<{
  routes: readonly AppClientRegisteredRoute[];
  access?: { denied: ReadonlySet<string>; loading: boolean };
}>) {
  return (
    <DetailRouteContext.Provider
      value={{
        routes,
        denied: access?.denied ?? new Set(),
        loading: access?.loading ?? false,
      }}
    >
      {children}
    </DetailRouteContext.Provider>
  );
}
