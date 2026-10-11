/** A repository's CI setup as the browser reads it (`GET /api/repositoryDeployments/:resourceId/ci`), and its cache keys. */
import { useApiClient } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { CiSetupView } from '../../shared/builds.js';
import type { RepositoryDeployment } from '../../shared/releases.js';

export const ciKeys = {
  setup: (resourceId: string): string[] => [
    'studio',
    'releases',
    'ciSetup',
    resourceId,
  ],
  workflow: (resourceId: string): string[] => [
    'studio',
    'releases',
    'ci',
    resourceId,
  ],
  links: (resourceId: string): string[] => [
    'studio',
    'releases',
    'links',
    resourceId,
  ],
};

/** The CI route of a repository, `rest` below it (`/setup`, `/rotate`). */
export const ciPath = (resourceId: string, rest = ''): string =>
  `repositoryDeployments/${encodeURIComponent(resourceId)}/ci${rest}`;

/** The Apps a repository builds (`GET /api/repositoryDeployments/:resourceId`), as its settings read them. */
export function useRepositoryDeployment(
  resourceId: string,
): UseQueryResult<RepositoryDeployment> {
  const api = useApiClient();
  return useQuery({
    queryKey: ciKeys.links(resourceId),
    queryFn: async () =>
      (
        await api.request<{ data: RepositoryDeployment }>({
          path: `repositoryDeployments/${encodeURIComponent(resourceId)}`,
        })
      ).data,
  });
}

export function useCiSetup(resourceId: string): UseQueryResult<CiSetupView> {
  const api = useApiClient();
  return useQuery({
    queryKey: ciKeys.setup(resourceId),
    retry: false,
    queryFn: async () =>
      (await api.request<{ data: CiSetupView }>({ path: ciPath(resourceId) }))
        .data,
  });
}
