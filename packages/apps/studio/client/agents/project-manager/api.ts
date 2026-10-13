/**
 * The project manager's settings (`GET`/`PATCH /api/projectManager`, `shared/project-manager.ts`), read by the Agent
 * page's section and its settings dialog.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type {
  ProjectManagerPatch,
  ProjectManagerView,
} from '../../../shared/project-manager.js';

export const projectManagerKey = ['studio', 'projectManager'] as const;

export function useProjectManager(): UseQueryResult<ProjectManagerView> {
  const api = useApiClient();
  return useQuery({
    queryKey: projectManagerKey,
    queryFn: async () =>
      (
        await api.request<{ data: ProjectManagerView }>({
          path: 'projectManager',
        })
      ).data,
  });
}

export function useUpdateProjectManager(): UseMutationResult<
  ProjectManagerView,
  Error,
  ProjectManagerPatch
> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ProjectManagerPatch) =>
      (
        await api.request<{ data: ProjectManagerView }>({
          path: 'projectManager',
          method: 'PATCH',
          json: patch,
        })
      ).data,
    onSuccess: (view) => {
      queryClient.setQueryData(projectManagerKey, view);
    },
  });
}
