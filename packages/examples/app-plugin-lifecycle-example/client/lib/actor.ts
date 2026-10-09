import { useTranslation } from '@nocobase/i18n/client';

import { personName } from '../../shared/people.js';
import { NAMESPACE } from './format.js';

/** Names whoever fired a transition, including the system's triggers and effects. */
export function useActorName(): (id: string) => string {
  const { t } = useTranslation(NAMESPACE);
  return (id) => (id === 'system' ? t('common.system') : personName(id));
}
