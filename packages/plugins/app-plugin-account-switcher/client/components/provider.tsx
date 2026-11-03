import { useApiClient, useClientApplication } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import type { AccountSwitchState } from '../../shared/types.js';
import { AccountSwitcherContext } from '../context.js';
import { SwitchedBanner } from './switched-banner.js';

// Other tabs of this browser share the session, so they change identity at the same moment.
const CHANNEL = 'nocobase:account-switcher';
// The longest delay `setTimeout` holds before firing at once.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** Mounted by the plugin so that no application can leave a switch without its visible notice. */
export function AccountSwitcherProvider({
  children,
}: PropsWithChildren): ReactElement {
  const app = useClientApplication();
  // The server turns switching off in a demo, which its published mode does not reflect. Demo Mode declares the type of
  // its own section only where it is installed, so it is read untyped.
  const publicConfig = app.config.public as {
    has(path: string): boolean;
    get(path: string): unknown;
  };
  const [enabled] = useState(
    () =>
      publicConfig.has('accountSwitcher.mode') &&
      publicConfig.get('accountSwitcher.mode') !== 'off' &&
      !(
        publicConfig.has('demoMode.enabled') &&
        publicConfig.get('demoMode.enabled') === true
      ),
  );
  return enabled ? (
    <EnabledProvider>{children}</EnabledProvider>
  ) : (
    <>{children}</>
  );
}

function EnabledProvider({ children }: PropsWithChildren): ReactElement {
  const api = useApiClient();
  const { session } = useAuthentication();
  const sessionId = session?.session.id;
  // Kept with the session it answers for, so another session never sees it.
  const [loaded, setLoaded] = useState<{
    readonly sessionId: string;
    readonly state: AccountSwitchState;
  } | null>(null);
  const state =
    loaded?.sessionId === sessionId ? (loaded?.state ?? null) : null;

  useEffect(() => {
    if (!sessionId) return;
    let current = true;
    api
      .request<{ data: AccountSwitchState }>({
        path: '/accountSwitcher/state',
      })
      .then(
        ({ data }) => {
          if (current) setLoaded({ sessionId, state: data });
        },
        () => {
          if (current) setLoaded(null);
        },
      );
    return () => {
      current = false;
    };
  }, [api, sessionId]);

  // A channel does not hear its own messages, so only the other tabs reload on this one.
  const channelRef = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => window.location.reload();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, []);
  const reloadAllTabs = useCallback(() => {
    channelRef.current?.postMessage('changed');
    window.location.reload();
  }, []);

  const expiresAt = state?.switched?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    // Once it has run out the server refuses the next request, so a page left open must not sit there and fail.
    const timer = setTimeout(
      () => window.location.reload(),
      Math.min(Math.max(Date.parse(expiresAt) - Date.now(), 0), MAX_TIMEOUT_MS),
    );
    return () => clearTimeout(timer);
  }, [expiresAt]);

  const start = useCallback(
    async (userId: string) => {
      await api.request({
        path: '/accountSwitcher/switches',
        method: 'POST',
        json: { userId },
      });
      reloadAllTabs();
    },
    [api, reloadAllTabs],
  );
  const stop = useCallback(async () => {
    await api.request({
      path: '/accountSwitcher/switches/current',
      method: 'DELETE',
    });
    reloadAllTabs();
  }, [api, reloadAllTabs]);
  const value = useMemo(() => ({ state, start, stop }), [state, start, stop]);

  return (
    <AccountSwitcherContext.Provider value={value}>
      {children}
      <SwitchedBanner />
    </AccountSwitcherContext.Provider>
  );
}
