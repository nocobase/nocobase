import { useTranslation } from '@nocobase/i18n/client';

import { person, personName } from '../../shared/people.js';
import { NAMESPACE } from './format.js';

/**
 * Names whoever fired a transition: the system's triggers and effects, one
 * of the example's personas, or — in the durable flows, which name no
 * persona — the signed-in user.
 */
export function useActorName(): (id: string) => string {
  const { t } = useTranslation(NAMESPACE);
  return (id) => {
    if (id === 'system') return t('common.system');
    return person(id) ? personName(id) : t('common.signedInUser');
  };
}
