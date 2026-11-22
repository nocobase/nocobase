import { useApiClient, useClientApplication } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { FOUNDATION_NAMESPACE } from '../shared/access.js';
import {
  PLUGIN_PACKAGE_PATTERN,
  type FoundationPluginView,
  type FoundationPluginsMeta,
} from '../shared/plugins.js';

export interface FoundationPlugins {
  readonly data: readonly FoundationPluginView[];
  readonly meta: FoundationPluginsMeta;
}

/**
 * Reads `GET /api/foundation/plugins`, telling the server which plugins this browser application registers: only the
 * browser knows that half of a registration.
 */
export function usePlugins(): UseQueryResult<FoundationPlugins> {
  const api = useApiClient();
  const { runtime } = useClientApplication();
  const client = (runtime.registeredPlugins ?? [])
    .map(({ packageName }) => packageName)
    .filter((packageName) => PLUGIN_PACKAGE_PATTERN.test(packageName));
  return useQuery({
    queryKey: ['foundation', 'plugins', client],
    queryFn: () =>
      api.request<FoundationPlugins>({
        path: `${FOUNDATION_NAMESPACE}/plugins`,
        query: { client },
      }),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
