import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useState } from 'react';
import { useHref } from 'react-router';

import type { DemoSignInAccount } from '../server/accounts.js';

export type { DemoSignInAccount } from '../server/accounts.js';

/** The route a visitor, or an embedding page's iframe, opens to enter a demo account: `?as=<username>&redirect=/path`. */
export const DEMO_SIGN_IN_PATH = '/demo-sign-in';

export interface DemoAccounts {
  /** Null until the first answer; empty when quick sign-in is not offered or the request failed. */
  readonly accounts: readonly DemoSignInAccount[] | null;
  /** Signs in as `username`, then loads `redirect` afresh so nothing of the previous account stays in the page. */
  readonly signIn: (username: string, redirect?: string) => Promise<void>;
}

/** The demo accounts a visitor may enter, read again whenever `refreshKey` changes. */
export function useDemoAccounts(refreshKey?: unknown): DemoAccounts {
  const api = useApiClient();
  const root = useHref('/');
  const [accounts, setAccounts] = useState<readonly DemoSignInAccount[] | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    api
      .request<{ data: DemoSignInAccount[] }>({ path: '/demoMode/accounts' })
      .then((payload) => {
        if (active) setAccounts(payload.data);
      })
      // Without the list nothing is offered; signing in with a password still works.
      .catch(() => {
        if (active) setAccounts([]);
      });
    return () => {
      active = false;
    };
  }, [api, refreshKey]);

  const signIn = useCallback(
    async (username: string, redirect?: string) => {
      await api.request({
        path: `/demoMode/accounts/${encodeURIComponent(username)}/signIn`,
        method: 'POST',
      });
      window.location.assign(
        `${root.replace(/\/+$/u, '')}${safeRedirect(redirect)}`,
      );
    },
    [api, root],
  );

  return { accounts, signIn };
}

/** A path inside this application; anything else, such as another origin, falls back to the home page. */
export function safeRedirect(redirect: string | null | undefined): string {
  if (!redirect || !redirect.startsWith('/') || /^\/[/\\]/u.test(redirect))
    return '/';
  return redirect;
}
