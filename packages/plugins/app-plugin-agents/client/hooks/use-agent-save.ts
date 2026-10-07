import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useTranslation } from '@nocobase/i18n/client';

import type { Agent, AgentInput } from '../../shared/agents.js';
import { agentsKeys } from '../api/keys.js';
import { isRevisionConflict } from '../lib/revision.js';
import { useAgentsApi } from './use-agents-api.js';
import { useNotify } from './use-notify.js';

/**
 * Saves part of an agent (a tab of its page) against the revision the page shows, and refreshes it and the list. When
 * someone else saved the agent meanwhile, nothing is saved and `onConflict` hears the revision the page held; without
 * it, the refusal is a toast.
 */
export function useAgentSave(
  agent: Pick<Agent, 'id' | 'revision'>,
  onConflict?: (revision: number) => void,
): UseMutationResult<Agent, unknown, Partial<AgentInput>> {
  const api = useAgentsApi();
  const notify = useNotify();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AgentInput>) =>
      api.updateAgent(agent.id, {
        ...patch,
        expectedRevision: agent.revision,
      }),
    onSuccess: (saved) =>
      notify.success(t('agentDetail.saved', { name: saved.name })),
    onError: (error) => {
      if (isRevisionConflict(error) && onConflict) onConflict(agent.revision);
      else notify.error(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.agent(agent.id),
      });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.agentHistory(agent.id),
      });
    },
  });
}
