/** The agent picker's wording in this plugin's namespace (`chat.agents.*`, `chat.availability.*`), for its forms. */
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { AgentPickerLabels } from '../components/agent-picker.js';

const AVAILABILITY = [
  'online',
  'agentMissing',
  'agentArchived',
  'forbidden',
  'noModel',
  'noRunner',
  'othersPersonal',
] as const;

/** `field` names the form field, so the trigger reads "<field>: <agent>". */
export function useAgentPickerLabels(
  field: string,
): Partial<AgentPickerLabels> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      switch: `${field}: {name}`,
      field: `${field}: {name}`,
      unknown: t('chat.agents.unknown'),
      placeholder: t('chat.agents.placeholder'),
      chooseFor: t('chat.agents.chooseFor'),
      empty: t('chat.agents.empty'),
      none: t('chat.agents.none'),
      myDefault: t('chat.agents.myDefault'),
      systemDefault: t('chat.agents.systemDefault'),
      personal: t('chat.agents.personalOnly'),
      modeHint: t('chat.agents.hint'),
      availability: Object.fromEntries(
        AVAILABILITY.map((key) => [key, t(`chat.availability.${key}`)]),
      ) as AgentPickerLabels['availability'],
    }),
    [field, t],
  );
}
