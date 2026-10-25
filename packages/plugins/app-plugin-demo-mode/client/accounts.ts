import { useApiClient } from '@nocobase/app-client';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useHref } from 'react-router';

import type { DemoSignInAccount } from '../shared/accounts.js';
import { demoAccountCache } from './account-cache.js';

export type { DemoSignInAccount } from '../shared/accounts.js';

/** The route a visitor opens to enter a demo account: `?as=<username>&redirect=/path`. */
export const DEMO_SIGN_IN_PATH = '/demo-sign-in';

export interface DemoAccounts {
  /** Null until the first answer; empty when quick sign-in is not offered or the initial request failed. */
  readonly accounts: readonly DemoSignInAccount[] | null;
  /** Signs in as `username`, then loads `redirect` afresh so nothing of the previous account stays in the page. */
  readonly signIn: (username: string, redirect?: string) => Promise<void>;
}

/** Shares the preloaded account list; refreshes in the background whenever `refreshKey` changes. */
export function useDemoAccounts(refreshKey?: unknown): DemoAccounts {
  const api = useApiClient();
  const root = useHref('/');
  const cache = demoAccountCache(api);
  const accounts = useSyncExternalStore(
    cache.subscribe,
    cache.snapshot,
    cache.snapshot,
  );
  const previousKeyRef = useRef(refreshKey);

  useEffect(() => {
    const refresh = !Object.is(previousKeyRef.current, refreshKey);
    previousKeyRef.current = refreshKey;
    void cache.load(refresh);
  }, [cache, refreshKey]);

  const signIn = useCallback(
    async (username: string, redirect?: string) => {
      await api.request({
        path: `/demoMode/accounts/${encodeURIComponent(username)}/signIn`,
        method: 'POST',
      });
      window.location.assign(safeRedirect(redirect, root));
    },
    [api, root],
  );

  return { accounts, signIn };
}

/** A path inside this application; anything else, such as another origin, falls back to the home page. */
export function safeRedirect(
  redirect: string | null | undefined,
  root = '/',
): string {
  const home = `${root.replace(/\/+$/u, '')}/`;
  if (
    !redirect?.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.includes('\\') ||
    /\p{Cc}/u.test(redirect)
  )
    return home;
  const base = new URL(home, 'https://demo.invalid');
  const target = new URL(`${home.slice(0, -1)}${redirect}`, base);
  if (
    target.origin !== base.origin ||
    target.pathname.startsWith('//') ||
    (target.pathname !== base.pathname.slice(0, -1) &&
      !target.pathname.startsWith(base.pathname))
  )
    return home;
  return `${target.pathname}${target.search}${target.hash}`;
}
