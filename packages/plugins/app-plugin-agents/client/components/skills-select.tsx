import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { TerminalIcon } from 'lucide-react';
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

/**
 * For an online agent: the scripts of the selected skills, which it reads but never runs, listed by skill; nothing when
 * none of them holds a script.
 */
export function SkillScriptsNotice({
  value,
}: {
  readonly value: readonly string[];
}): ReactElement | null {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const skills = useQuery({
    queryKey: agentsKeys.skills,
    queryFn: () => api.skills(),
  });
  const withScripts = (skills.data ?? []).filter(
    (skill) => value.includes(skill.id) && skill.scripts.length > 0,
  );
  if (withScripts.length === 0) return null;
  return (
    <div
      className='flex flex-col gap-1 text-sm text-muted-foreground'
      data-testid='ag-skill-scripts-notice'
    >
      <p className='flex items-center gap-2'>
        <TerminalIcon className='size-4 shrink-0' aria-hidden='true' />
        {t('agentSkills.onlineScripts')}
      </p>
      <ul className='flex flex-col gap-1 pl-6'>
        {withScripts.map((skill) => (
          <li key={skill.id}>
            <span className='font-mono'>{skill.name}</span>
            {t('agentSkills.skippedScripts', {
              paths: skill.scripts.join(t('agentSkills.pathSeparator')),
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}
