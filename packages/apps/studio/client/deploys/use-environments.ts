/** What runs on a project's staging and production Apps, loaded once per project (`environments.tsx`). */
import { useApiClient } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ProjectEnvironments } from '../../shared/previews.js';
import { previewKeys, readEnvironments } from '../previews/api.js';

export function useProjectEnvironments(
  projectId: string | null,
): UseQueryResult<ProjectEnvironments> {
  const api = useApiClient();
  return useQuery({
    queryKey: previewKeys.environments(projectId ?? ''),
    queryFn: () => readEnvironments(api, projectId!),
    enabled: projectId !== null,
    staleTime: 30_000,
  });
}
