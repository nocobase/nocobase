import { useApiClient } from '@nocobase/app-client';
import {
  SkillSettingsContext,
  SkillMountToggle,
} from '@nocobase/app-plugin-agents/client/config';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';

import { STUDIO_NAMESPACE } from '../../shared/access.js';

function ProjectDefaultSkill({
  skillId,
}: {
  readonly skillId: string;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation(STUDIO_NAMESPACE);
  const load = async () =>
    (
      await api.request<{ data: { skillIds: string[] } }>({
        path: 'projectDefaultSkills',
      })
    ).data.skillIds;
  const save = async (skillIds: readonly string[]) =>
    (
      await api.request<{ data: { skillIds: string[] } }>({
        path: 'projectDefaultSkills',
        method: 'PUT',
        json: { skillIds },
      })
    ).data.skillIds;
  return (
    <SkillMountToggle
      skillId={skillId}
      queryKey={['studio', 'project-default-skills']}
      load={load}
      save={save}
      title={t('studioAgents.newProjectSkill')}
      description={t('studioAgents.newProjectSkillDescription')}
    />
  );
}

export function StudioSkillSettings({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <SkillSettingsContext.Provider value={settings}>
      {children}
    </SkillSettingsContext.Provider>
  );
}

const settings = { Settings: ProjectDefaultSkill };
