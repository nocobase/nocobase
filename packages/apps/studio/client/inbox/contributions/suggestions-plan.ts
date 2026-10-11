/** The plan behind a suggested executor's card (`suggestions.ts`); the can-act check and the actions share the query. */
import { planKeys, usePlanApi } from '@nocobase/app-plugin-projects/client/kit';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { kindOf, type InboxEntry } from '@/extensions/nocobase-inbox/model';
import { paramsOf } from './projects-wording.js';

export function useSuggestionPlan(entry: InboxEntry): UseQueryResult<Plan> {
  const api = usePlanApi();
  const planId = paramsOf(entry).planId ?? null;
  return useQuery({
    queryKey: planKeys.plan(planId ?? ''),
    queryFn: () => api.plan(planId ?? ''),
    enabled: planId !== null && kindOf(entry) === 'decision',
    retry: false,
  });
}
