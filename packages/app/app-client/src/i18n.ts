import { I18nRuntime, type Locale, type LocalesModule } from '@nocobase/i18n';

import { resolveAppBase } from './client.js';
import type { AppClientContributionSource } from './plugins.js';

/** The language an application falls back to when its configuration names none. */
export const DEFAULT_LOCALE: Locale = 'en-US';

export interface AppClientLocaleContribution {
  readonly packageName: string;
  readonly source: AppClientContributionSource;
  readonly locales: LocalesModule;
}

export interface CreateAppI18nRuntimeOptions {
  /**
   * The application's default language, from `i18n.defaultLocale` in its configuration.
   *
   * One value, the same for every visitor. It decides what someone who has never chosen a language sees, and it is
   * what a key untranslated in the language in use falls back to. Switching language does not change it.
   */
  readonly defaultLocale?: Locale;
  /**
   * Locales to offer, stated outright.
   *
   * Omit it and the application's own contribution decides, which is what an application does. Pass it only where
   * there is no application contribution to derive from, such as a focused test.
   */
  readonly locales?: readonly Locale[];
  readonly contributions: readonly AppClientLocaleContribution[];
  /**
   * The language to start this browser in — the result of resolving the visitor's stored choice against
   * `defaultLocale`, not a configured value. Omitted, storage alone decides.
   */
  readonly initialLocale?: Locale;
}

/**
 * Reads the visitor's language preference for this application's full mount path.
 *
 * Storage is the source of truth on the client, so the first frame renders in the right language without waiting for
 * the server. Access is guarded because a browser can refuse it outright in private modes.
 * The old shared key is deliberately ignored: its choice may belong to another application on the same origin.
 */
export function readStoredLocale(): Locale | undefined {
  try {
    return (
      globalThis.localStorage?.getItem(`nocobase.locale:${resolveAppBase()}`) ??
      undefined
    );
  } catch {
    return undefined;
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    globalThis.localStorage?.setItem(
      `nocobase.locale:${resolveAppBase()}`,
      locale,
    );
  } catch {
    // A visitor who blocks storage still gets a working switch for this session.
  }
}

/**
 * Builds the i18n runtime for an application and loads the starting locale.
 *
 * Every contribution's resources for that one locale are fetched in parallel before this resolves, so the application
 * renders already translated instead of flashing keys behind a loading state. Other locales stay unfetched until the
 * visitor switches to one.
 */
export async function createAppI18nRuntime(
  options: CreateAppI18nRuntimeOptions,
): Promise<I18nRuntime> {
  const applicationContribution = options.contributions.find(
    (contribution) => contribution.source === 'application',
  );
  const runtime = new I18nRuntime({
    defaultLocale: options.defaultLocale ?? DEFAULT_LOCALE,
    locales: options.locales,
    applicationNamespace: applicationContribution?.packageName,
  });

  for (const contribution of options.contributions) {
    if (contribution.source === 'application') {
      // Registering the application's namespace is also what settles which languages are on offer: its own locale
      // files are the list, and a plugin's only supply translations for languages already on it.
      runtime.registerApplicationNamespace(
        contribution.packageName,
        contribution.locales,
      );
    } else {
      runtime.registerNamespace(contribution.packageName, contribution.locales);
    }
  }

  await runtime.init(options.initialLocale ?? readStoredLocale());
  return runtime;
}
