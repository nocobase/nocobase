/**
 * Requests to AI from the AI draft tab and the issue page (`shared/intake-ai.ts`): whether the viewer can ask now, and
 * one request followed until it ends. A running request is read again every two seconds, and whenever the server
 * announces a change (the keys sit under `['pm', 'plans']`).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type {
  IntakeAiAvailability,
  IntakeAiJob,
} from '../../../shared/intake-ai.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canCreateIssues } from '../../lib/permissions.js';
import { planKeys, usePlanApi } from '../../kit/plans/api.js';

/** The URL parameter holding the running request, so a reload or a link (from the issue page) follows it. */
export const INTAKE_JOB_PARAM = 'job';

const POLL_MS = 2_000;

/** Whether the viewer can ask AI now; nothing is asked of someone who may not create issues. */
export function useIntakeAiAvailability(): IntakeAiAvailability | null {
  const api = usePlanApi();
  const viewer = useViewer();
  const allowed = canCreateIssues(viewer);
  const query = useQuery({
    queryKey: planKeys.intakeAi,
    queryFn: () => api.intakeAiAvailability(),
    enabled: allowed,
    staleTime: 30_000,
    retry: false,
  });
  return allowed ? (query.data ?? null) : null;
}

export function useIntakeJob(jobId: string): UseQueryResult<IntakeAiJob> {
  const api = usePlanApi();
  return useQuery({
    queryKey: planKeys.intakeJob(jobId),
    queryFn: () => api.intakeJob(jobId),
    enabled: jobId !== '',
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'running' ? POLL_MS : false,
  });
}
