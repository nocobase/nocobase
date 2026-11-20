import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { AgMultiSelect } from './ag-multi-select.js';

/** A multi-select over the skill library, each skill with its current version. */
export function SkillsSelect({
  id,
  value,
  disabled,
  onChange,
}: {
  readonly id: string;
  readonly value: readonly string[];
  readonly disabled?: boolean;
  readonly onChange: (skillIds: string[]) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const skills = useQuery({
    queryKey: agentsKeys.skills,
    queryFn: () => api.skills(),
  });
  return (
    <AgMultiSelect
      id={id}
      aria-label={t('agentSkills.title')}
      options={(skills.data ?? []).map((skill) => ({
        value: skill.id,
        label: `${skill.name} · v${skill.version}`,
      }))}
      value={value}
      disabled={disabled}
      placeholder={t('agentSkills.placeholder')}
      emptyText={t('agentSkills.empty')}
      onChange={onChange}
    />
  );
}
