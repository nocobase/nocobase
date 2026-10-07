import { useTranslation } from '@nocobase/i18n/client';

import {
  ANY_STATUS,
  hasDefaultName,
  type WorkflowDefinition,
} from '../../../../shared/workflows.js';

/** A status's name: a built-in status still named by default shows its translation; `*` is "any status". */
export function useStatusName(
  definition: Pick<WorkflowDefinition, 'states'>,
): (key: string) => string {
  const { t } = useTranslation();
  return (key) => {
    if (key === ANY_STATUS) return t('workflows.anyStatus');
    const status = definition.states.find((entry) => entry.key === key);
    if (!status) return key;
    return hasDefaultName(status)
      ? t(`status.${key}`, { defaultValue: status.name })
      : status.name;
  };
}
