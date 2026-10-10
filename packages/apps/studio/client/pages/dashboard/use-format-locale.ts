import { useLocale } from '@nocobase/i18n/client';

/** The interface language for the dashboard's numbers and dates; English while none is known. */
export function useFormatLocale(): string {
  return useLocale().locale || 'en-US';
}
