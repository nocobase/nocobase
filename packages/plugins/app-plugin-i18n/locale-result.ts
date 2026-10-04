import type { Locale, LocaleDefinition } from '@nocobase/i18n';

/** The server's language choice, which may differ from the browser's. */
export interface ServerLocaleResult {
  readonly locale: Locale;
  readonly requestedLocale: Locale;
  readonly fallback: boolean;
}

/** What `GET /i18n/locales` answers in `data`: the server's default and every language it offers. */
export interface ServerLocaleList {
  readonly defaultLocale: Locale;
  readonly locales: readonly LocaleDefinition[];
}
