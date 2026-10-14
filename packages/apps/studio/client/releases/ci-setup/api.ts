/**
 * A repository's CI as the browser reads and changes it (`shared/ci-modes.ts`): `GET …/ci/connection`,
 * `POST …/ci/configure`, `DELETE …/ci/apps/:appId`, the standard file of an application and target
 * (`POST /api/repositoryDeployments/ciWorkflows/generate`), the environments a run may deploy to
 * (`GET /api/repositoryDeployments/ciWorkflows/environments`), the builds CI reported (`GET …/builds`), and the
 * repository's CI key revealed once (`POST …/ci/setup` or `…/ci/rotate` with `reveal`).
 */
import { useApiClient } from '@nocobase/app-client';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { BuildView, CiSetupAnswer } from '../../../shared/builds.js';
import type {
  CiApp,
  CiConnectionView,
  CiEnvironment,
  CiReportedApp,
  CiRunRequest,
  CiTarget,
  CiWorkflowFile,
} from '../../../shared/ci-modes.js';

export const ciModeKeys = {
  connection: (resourceId: string): string[] => [
    'studio',
    'releases',
    'ciConnection',
    resourceId,
  ],
  builds: (resourceId: string): string[] => [
    'studio',
    'releases',
    'ciBuilds',
    resourceId,
  ],
  environments: (): string[] => ['studio', 'releases', 'ciEnvironments'],
  generated: (
    app: CiApp,
    target: CiTarget,
    defaultBranch: string,
    managed: boolean,
  ): unknown[] => [
    'studio',
    'releases',
    'ciGenerated',
    app,
    target,
    defaultBranch,
    managed,
  ],
};

const base = (resourceId: string) =>
  `repositoryDeployments/${encodeURIComponent(resourceId)}`;

export function useCiConnection(
  resourceId: string,
): UseQueryResult<CiConnectionView> {
  const api = useApiClient();
  return useQuery({
    queryKey: ciModeKeys.connection(resourceId),
    retry: false,
    queryFn: async () =>
      (
        await api.request<{ data: CiConnectionView }>({
          path: `${base(resourceId)}/ci/connection`,
        })
      ).data,
  });
}

/** Several repositories' connections at once, by working directory; a repository still loading is left out. */
export function useCiConnections(
  resourceIds: readonly string[],
): Readonly<Record<string, CiConnectionView>> {
  const api = useApiClient();
  return useQueries({
    queries: resourceIds.map((resourceId) => ({
      queryKey: ciModeKeys.connection(resourceId),
      retry: false,
      queryFn: async () =>
        (
          await api.request<{ data: CiConnectionView }>({
            path: `${base(resourceId)}/ci/connection`,
          })
        ).data,
    })),
    combine: (results) =>
      Object.fromEntries(
        results.flatMap((result, index) =>
          result.data ? [[resourceIds[index], result.data] as const] : [],
        ),
      ),
  });
}

/** Runs "Configure CI" and answers the connection as it then stands. */
export function useConfigureCi(
  resourceId: string,
): UseMutationResult<CiConnectionView, Error, CiRunRequest> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (run: CiRunRequest) =>
      (
        await api.request<{ data: CiConnectionView }>({
          method: 'POST',
          path: `${base(resourceId)}/ci/configure`,
          json: run,
        })
      ).data,
    onSuccess: (view) => {
      queryClient.setQueryData(ciModeKeys.connection(resourceId), view);
      void queryClient.invalidateQueries({
        queryKey: ['studio', 'releases', 'ciSetup', resourceId],
      });
    },
  });
}

/**
 * Makes the repository's CI key (`setup`) or gives it a new secret (`rotate`), answering the secret once instead of
 * writing it to the repository; the connection is read again. The secret lives only in the mutation's result.
 */
export function useRevealCiKey(
  resourceId: string,
): UseMutationResult<string, Error, 'setup' | 'rotate'> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: 'setup' | 'rotate') => {
      const { data } = await api.request<{ data: CiSetupAnswer }>({
        method: 'POST',
        path: `${base(resourceId)}/ci/${action}`,
        json: { reveal: true },
      });
      if (!data.secret) throw new Error(data.lastError ?? 'No key was issued.');
      return data.secret;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ciModeKeys.connection(resourceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['studio', 'releases', 'ciSetup', resourceId],
      });
    },
  });
}

/** Takes an App off the repository's list; the connection is read again. */
export function useRemoveCiApp(
  resourceId: string,
): UseMutationResult<void, Error, CiReportedApp> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (app: CiReportedApp) => {
      await api.request({
        method: 'DELETE',
        path: `${base(resourceId)}/ci/apps/${encodeURIComponent(app.appId)}`,
        query: {
          environmentId: app.environmentId,
          ...(app.pullRequests ? { pullRequests: 'true' } : {}),
        },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ciModeKeys.connection(resourceId),
      }),
  });
}

/** The environments a run may deploy to, in release management's order. */
export function useCiEnvironments(): UseQueryResult<CiEnvironment[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: ciModeKeys.environments(),
    retry: false,
    queryFn: async () =>
      (
        await api.request<{ data: CiEnvironment[] }>({
          path: 'repositoryDeployments/ciWorkflows/environments',
        })
      ).data,
  });
}

/** The standard workflow file of an application and a target. */
export function useGeneratedWorkflow(
  input: {
    readonly app: CiApp;
    readonly target: CiTarget;
    readonly defaultBranch: string;
  },
  options: { readonly managed: boolean; readonly enabled: boolean },
): UseQueryResult<CiWorkflowFile | null> {
  const api = useApiClient();
  return useQuery({
    queryKey: ciModeKeys.generated(
      input.app,
      input.target,
      input.defaultBranch,
      options.managed,
    ),
    enabled: options.enabled,
    retry: false,
    queryFn: async () =>
      (
        await api.request<{ data: CiWorkflowFile[] }>({
          method: 'POST',
          path: 'repositoryDeployments/ciWorkflows/generate',
          json: {
            app: input.app,
            target: input.target,
            defaultBranch: input.defaultBranch,
            managed: options.managed,
          },
        })
      ).data[0] ?? null,
  });
}

/** The builds and deployments CI reported for the repository, the newest first. */
export function useRepositoryBuilds(
  resourceId: string,
  pageSize = 50,
): UseQueryResult<BuildView[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: [...ciModeKeys.builds(resourceId), pageSize],
    retry: false,
    queryFn: async () =>
      (
        await api.request<{ data: BuildView[] }>({
          path: `${base(resourceId)}/builds`,
          query: { pageSize },
        })
      ).data,
  });
}
