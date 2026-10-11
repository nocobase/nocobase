import { useAgentOptions } from '@nocobase/app-plugin-agents/client/kit';
import { useTranslation } from '@nocobase/i18n/client';

/** An agent's name by id, or the words for one the viewer cannot see. */
export function useAgentName(): (id: string) => string {
  const { t } = useTranslation();
  const agents = useAgentOptions();
  return (id) => agents.nameOf(id) ?? t('studioAgents.stageRules.unknownAgent');
}
