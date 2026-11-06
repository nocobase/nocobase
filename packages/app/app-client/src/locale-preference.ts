import { createContext, type Context } from 'react';

/** Optional identity integration. i18n remains usable without a users plugin. */
export interface AppLocalePreference {
  readonly identity: string | null;
  readonly ready: boolean;
  readonly value: unknown;
  readonly set: (locale: string) => Promise<{
    readonly locale: string;
    readonly requestedLocale: string;
    readonly fallback: boolean;
  }>;
}

export const AppLocalePreferenceContext: Context<
  AppLocalePreference | undefined
> = createContext<AppLocalePreference | undefined>(undefined);
