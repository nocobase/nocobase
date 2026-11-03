import {
  useApiClient,
  useClientApplication,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { useLocation } from 'react-router';

import { DemoHomeEntry } from './demo-home-entry.js';
import { demoAccountCache } from '../account-cache.js';
import { DemoModeContext } from '../demo-mode-context.js';
import {
  DEMO_MODE_NAMESPACE,
  DEMO_SERVER_TIMING_METRIC,
} from '../namespace.js';

const REFUSED_TOAST_ID = 'demo-mode-refused';

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
  const home = pathname === '/';
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
      {home && enabled ? <DemoHomeEntry>{children}</DemoHomeEntry> : children}
    </DemoModeContext>
  );
}
