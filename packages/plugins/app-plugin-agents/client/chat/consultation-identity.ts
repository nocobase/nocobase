/** Current identity for a loaded consultation; message snapshots and sequence numbers stay untouched. */
import { ApiClientError } from '@nocobase/app-client';
import { useQuery } from '@tanstack/react-query';

import type { ConsultationNotice } from '../../shared/conversations.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { agentsQueryClient } from '../query.js';
import { useAgentIdentities } from '../runs/subject-runs.js';

export interface ConsultationIdentity {
  readonly state: 'loading' | 'resolved' | 'snapshot' | 'unavailable';
  readonly name: string | null;
}

export function useConsultationIdentity(
  notice: ConsultationNotice | undefined,
): ConsultationIdentity {
  const api = useAgentsApi();
  const runId = !notice?.agentId ? notice?.runId : null;
  const run = useQuery(
    {
      queryKey: agentsKeys.run(runId ?? ''),
      queryFn: () => api.run(runId!),
      enabled: Boolean(runId),
      retry: false,
    },
    agentsQueryClient(),
  );
  const identities = useAgentIdentities(Boolean(notice));
  if (!notice) return { state: 'unavailable', name: null };
  if (runId && run.isError) {
    return run.error instanceof ApiClientError && run.error.status === 404
      ? { state: 'snapshot', name: notice.agentName }
      : { state: 'unavailable', name: null };
  }
  if (runId && run.isPending) return { state: 'loading', name: null };
  const agentId = notice.agentId ?? run.data?.agentId;
  if (!agentId) return { state: 'snapshot', name: notice.agentName };
  if (identities.failed) return { state: 'unavailable', name: null };
  if (identities.loading) return { state: 'loading', name: null };
  const name = identities.nameOf(agentId);
  return name === null
    ? { state: 'snapshot', name: notice.agentName }
    : { state: 'resolved', name };
}
