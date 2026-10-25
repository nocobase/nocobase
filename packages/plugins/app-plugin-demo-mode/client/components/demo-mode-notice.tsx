import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { useLocation } from 'react-router';

import { DemoAccountSwitcher } from './demo-account-switcher.js';
import { DemoHomeEntry } from './demo-home-entry.js';
import { demoAccountCache } from '../account-cache.js';
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
 * shows its own errors. In a demo it also offers the demo accounts to enter or switch to.
 */
export function DemoModeNotice({
  children,
  accountSwitcher = 'floating',
  showFloatingAccountSwitcher = true,
}: PropsWithChildren<{
  readonly accountSwitcher?: 'floating' | 'menu';
  readonly showFloatingAccountSwitcher?: boolean;
}>): ReactElement {
  const api = useApiClient();
  const toaster = useToaster();
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  const [enabled, setEnabled] = useState<boolean>();
  const { pathname } = useLocation();
  const home = pathname === '/';
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    let active = true;
    api
      .request<{ data: { enabled: boolean } }>({ path: '/demoMode/status' })
      .then((payload) => {
        if (active) setEnabled(payload.data.enabled);
      })
      // Without the status no toast is shown; the server still refuses writes.
      .catch(() => {
        if (active) setEnabled(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

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
    <>
      {home && enabled === undefined ? (
        <p role='status' className='p-4 text-sm text-muted-foreground'>
          {t('accounts.entering')}
        </p>
      ) : home && enabled ? (
        <DemoHomeEntry>{children}</DemoHomeEntry>
      ) : (
        children
      )}
      {!enabled || !showFloatingAccountSwitcher ? null : (
        <DemoAccountSwitcher signedOutOnly={accountSwitcher === 'menu'} />
      )}
    </>
  );
}
