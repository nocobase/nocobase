import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useQuery } from '@tanstack/react-query';

import type { Me } from '../../shared/members.js';
import { pmKeys } from '../api/keys.js';
import { usePmApi } from './use-pm-api.js';

/**
 * The signed-in user and what they may do (`GET /api/projects/me`). Refetched when their permissions change, so controls
 * follow a role change without a reload. Undefined while loading.
 */
export function useViewer(): Me | undefined {
  const api = usePmApi();
  const revision = useAuthorizationRevision();
  return useQuery({
    queryKey: [...pmKeys.me, revision],
    queryFn: () => api.me(),
    staleTime: 60_000,
  }).data;
}
