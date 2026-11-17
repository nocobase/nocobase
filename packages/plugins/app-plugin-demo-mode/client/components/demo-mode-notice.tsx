import {
  useApiClient,
  useClientApplication,
  useToaster,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { matchRoutes, useLocation, type RouteObject } from 'react-router';

import { DemoEntry } from './demo-entry.js';
import { demoAccountCache } from '../account-cache.js';
import { DemoModeContext } from '../demo-mode-context.js';
import {
  DEMO_MODE_NAMESPACE,
  DEMO_SERVER_TIMING_METRIC,
} from '../namespace.js';

const REFUSED_TOAST_ID = 'demo-mode-refused';

/**
 * The registered routes as the router nests them. Registered paths are absolute and a pathless group carries its
 * parent's path, so each path is made relative to its parent's, as the application router does; a route at its
 * parent's own path, or an ancestor's, nests with an empty path.
 */
function entryRoutes(
  routes: readonly AppClientRegisteredRoute[],
  parentPath = '',
): RouteObject[] {
  return routes.map((route) => {
    const inside = parentPath.startsWith(`${route.path.replace(/\/$/, '')}/`);
    const path = !parentPath
      ? route.path
      : route.path === parentPath || inside
        ? ''
        : route.path.slice(parentPath === '/' ? 1 : parentPath.length + 1);
    return {
      path,
      handle: route.auth,
      children: entryRoutes(
        route.children ?? [],
        inside ? parentPath : route.path,
      ),
    };
  });
}

/** Whether the page at `pathname` needs a signed-in visitor, so Demo Mode enters an account before showing it. */
function demoEntryRequired(
  routes: readonly AppClientRegisteredRoute[],
  pathname: string,
): boolean {
  return (
    pathname === '/' ||
    matchRoutes(entryRoutes(routes), pathname)?.at(-1)?.route.handle ===
      'required'
  );
}

/** Whether a finished request's response says the server refused one of its writes. */
function isRefusedEntry(entry: PerformanceEntry): boolean {
  const serverTiming = (entry as Partial<PerformanceResourceTiming>)
    .serverTiming;
  return (
    serverTiming?.some((metric) => metric.name === DEMO_SERVER_TIMING_METRIC) ??
    false
  );
}

/**
 * Tells visitors of a demo, with a toast, whenever the server refuses a change. Refusals are read from
 * finished requests' `Server-Timing`, so this works whichever client made the request and however the application
 * shows its own errors. Shares demo status and preloads accounts for the application's header entry.
 */
export function DemoModeNotice({ children }: PropsWithChildren): ReactElement {
  const api = useApiClient();
  const toaster = useToaster();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const app = useClientApplication();
  const [enabled] = useState(
    () =>
      app.config.public.has('demoMode.enabled') &&
      app.config.public.get('demoMode.enabled') === true,
  );
  const { pathname } = useLocation();
  // Only a demo enters accounts, so a disabled one never matches routes.
  const required = useMemo(
    () => enabled && demoEntryRequired(app.runtime.routes, pathname),
    [app, enabled, pathname],
  );
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const refresh = previousPathRef.current !== pathname;
    previousPathRef.current = pathname;
    if (enabled) void demoAccountCache(api).load(refresh);
  }, [api, enabled, pathname]);

  useEffect(() => {
    if (!enabled || typeof PerformanceObserver === 'undefined') {
      return;
    }
    const observer = new PerformanceObserver((list) => {
      if (!list.getEntries().some(isRefusedEntry)) return;
      toaster.show({
        id: REFUSED_TOAST_ID,
        type: 'warning',
        title: t('refused.title'),
        description: t('refused.description'),
      });
    });
    observer.observe({ type: 'resource' });
    return () => observer.disconnect();
  }, [enabled, toaster, t]);

  return (
    <DemoModeContext value={enabled}>
      {enabled ? (
        <DemoEntry required={required}>{children}</DemoEntry>
      ) : (
        children
      )}
    </DemoModeContext>
  );
}
