import { useTranslation } from '@nocobase/i18n/client';

/** The namespace of this plugin's translations. */
export const NAMESPACE = '@nocobase/app-plugin-scheduler';

export function useSchedulerTranslation(): ReturnType<typeof useTranslation> {
  return useTranslation(NAMESPACE);
}
