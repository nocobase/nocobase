import { createContext, useContext, type Context } from 'react';

import type { AccountSwitchState } from '../shared/types.js';

export const ACCOUNT_SWITCHER_NAMESPACE =
  '@nocobase/app-plugin-account-switcher';

export interface AccountSwitcherContextValue {
  /** Null until the server answers, and when it cannot. */
  readonly state: AccountSwitchState | null;
  /** Acts as the account, then loads the page afresh so nothing of the previous identity stays in it. */
  readonly start: (userId: string) => Promise<void>;
  /** Returns to the signed-in person's own account, then loads the page afresh. */
  readonly stop: () => Promise<void>;
}

/** Null outside the provider and while account switching is off. */
export const AccountSwitcherContext: Context<AccountSwitcherContextValue | null> =
  createContext<AccountSwitcherContextValue | null>(null);

export function useAccountSwitcher(): AccountSwitcherContextValue | null {
  return useContext(AccountSwitcherContext);
}

/** Whether requests act as another account: an application hides what only makes sense for one's own account. */
export function useAccountSwitched(): boolean {
  return Boolean(useAccountSwitcher()?.state?.switched);
}
