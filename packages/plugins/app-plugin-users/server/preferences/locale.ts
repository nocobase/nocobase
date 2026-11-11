import { BASE_LOCALE, type I18nRuntime, type Locale } from '@nocobase/i18n';
import { USER_LOCALE_PREFERENCE_KEY } from '../../shared/preference-keys.js';
import type { UserPreferencesService } from './service.js';

export { USER_LOCALE_PREFERENCE_KEY };

/** Recipient language for jobs: never consults request headers or session state. */
export async function resolveUserLocale(
  preferences: Pick<UserPreferencesService, 'get'>,
  runtime: Pick<I18nRuntime, 'getLocales' | 'getDefaultLocale'>,
  userId: string,
): Promise<Locale> {
  const value = await preferences.get(userId, USER_LOCALE_PREFERENCE_KEY);
  const supported = runtime.getLocales();
  if (typeof value === 'string' && supported.includes(value)) return value;
  const fallback = runtime.getDefaultLocale();
  return supported.includes(fallback) ? fallback : BASE_LOCALE;
}
