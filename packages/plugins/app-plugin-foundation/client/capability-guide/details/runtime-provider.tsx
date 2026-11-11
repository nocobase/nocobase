import type { ReactElement } from 'react';
import { useClientApplication } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  useAuthorizationClient,
  useAuthorizationRevision,
  type AuthorizationRequirement,
} from '@nocobase/app-plugin-authorization/client';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { DetailRouteContext } from './route-context.js';
import { routeKey } from './route-key.js';

const NONE_DENIED: ReadonlySet<string> = new Set();

/** Discover routes and permissions through public runtimes, without requiring a particular application shell. */
export function GuideRuntimeProvider({
  children,
}: PropsWithChildren): ReactElement | null {
  const { runtime } = useClientApplication();
  const routes = runtime.routes;
  const client = useAuthorizationClient();
  const revision = useAuthorizationRevision();
  const guards = useMemo(() => {
    function collect(
      nodes: readonly AppClientRegisteredRoute[],
    ): { id: string; check: AuthorizationRequirement }[] {
      return nodes.flatMap((route) => [
        ...(route.componentLoader && route.authz !== 'skip'
          ? [{ id: routeKey(route), check: route.authz }]
          : []),
        ...collect(route.children ?? []),
      ]);
    }
    return collect(routes);
  }, [routes]);
  const [result, setResult] = useState<{
    client: typeof client;
    guards: typeof guards;
    revision: number;
    denied: ReadonlySet<string>;
  }>();
  useEffect(() => {
    if (!guards.length) return;
    let active = true;
    void Promise.all(
      guards.map(async ({ id, check }) => {
        try {
          return (await client.can(check)) ? undefined : id;
        } catch {
          return id;
        }
      }),
    ).then((ids) => {
      if (active)
        setResult({
          client,
          guards,
          revision,
          denied: new Set(ids.filter((id) => id !== undefined)),
        });
    });
    return () => {
      active = false;
    };
  }, [client, guards, revision]);
  const loading = Boolean(
    guards.length &&
    (result?.client !== client ||
      result.guards !== guards ||
      result.revision !== revision),
  );
  const denied = guards.length && result ? result.denied : NONE_DENIED;
  const value = useMemo(
    () => ({ routes, denied, loading }),
    [routes, denied, loading],
  );
  return (
    <DetailRouteContext.Provider value={value}>
      {children}
    </DetailRouteContext.Provider>
  );
}
