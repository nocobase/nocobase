import { useTranslation } from '@nocobase/i18n/client';

import { AUTHENTICATION_NAMESPACE } from '../actions/errors.js';

/** This plugin's translations. */
export function useAuthenticationTranslation(): ReturnType<
  typeof useTranslation
> {
  return useTranslation(AUTHENTICATION_NAMESPACE);
}

/** Seconds as the largest whole unit: "7 days", "1 hour", "10 seconds". */
export function useDuration(): (seconds: number) => string {
  const { t } = useAuthenticationTranslation();
  return (seconds) => {
    for (const [unit, size] of [
      ['days', 86_400],
      ['hours', 3_600],
      ['minutes', 60],
    ] as const)
      if (seconds >= size && seconds % size === 0)
        return t(`settings.duration.${unit}`, { count: seconds / size });
    return t('settings.duration.seconds', { count: seconds });
  };
}
