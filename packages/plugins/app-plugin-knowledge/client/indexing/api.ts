import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  EmbeddingServiceView,
  IndexingDirectory,
  IndexingInstanceView,
  IndexingReceipt,
  IndexingSettingsView,
  IndexingStatus,
  RebuildIndexingRequest,
  RetryIndexingRequest,
  SaveIndexingRequest,
} from '../../shared/indexing.js';

export const knowledgeIndexingKeys: {
  readonly settings: readonly ['knowledge', 'indexingSettings'];
  readonly status: readonly ['knowledge', 'indexingStatus'];
  readonly instances: readonly ['knowledge', 'indexingInstances'];
  readonly models: readonly ['knowledge', 'embeddingModels'];
} = {
  settings: ['knowledge', 'indexingSettings'],
  status: ['knowledge', 'indexingStatus'],
  instances: ['knowledge', 'indexingInstances'],
  models: ['knowledge', 'embeddingModels'],
};
export class KnowledgeIndexingApi {
  public constructor(private readonly api: ApiClient) {}
  private async data<T>(
    request: Parameters<ApiClient['request']>[0],
  ): Promise<T> {
    return (await this.api.request<{ data: T }>(request)).data;
  }
  private async directory<T>(
    path: string,
    signal?: AbortSignal,
  ): Promise<IndexingDirectory<T>> {
    const result = await this.api.request<{
      data: T[];
      meta: { total: number; reason: string | null };
    }>({ path, signal });
    return { items: result.data, reason: result.meta.reason };
  }
  public settings(signal?: AbortSignal): Promise<IndexingSettingsView> {
    return this.data({ path: 'knowledge/indexingSettings', signal });
  }
  public status(signal?: AbortSignal): Promise<IndexingStatus> {
    return this.data({ path: 'knowledge/indexingSettings/status', signal });
  }
  public instances(
    signal?: AbortSignal,
  ): Promise<IndexingDirectory<IndexingInstanceView>> {
    return this.directory('knowledge/indexingInstances', signal);
  }
  public models(
    signal?: AbortSignal,
  ): Promise<IndexingDirectory<EmbeddingServiceView>> {
    return this.directory('knowledge/embeddingModels', signal);
  }
  public save(body: SaveIndexingRequest): Promise<IndexingReceipt> {
    return this.data({
      method: 'PUT',
      path: 'knowledge/indexingSettings',
      json: body,
    });
  }
  public rebuild(body: RebuildIndexingRequest): Promise<IndexingReceipt> {
    return this.data({
      method: 'POST',
      path: 'knowledge/indexingSettings/rebuild',
      json: body,
    });
  }
  public retry(body: RetryIndexingRequest): Promise<IndexingReceipt> {
    return this.data({
      method: 'POST',
      path: 'knowledge/indexingSettings/retry',
      json: body,
    });
  }
}
export function useKnowledgeIndexingApi(): KnowledgeIndexingApi {
  const api = useApiClient();
  return useMemo(() => new KnowledgeIndexingApi(api), [api]);
}
export function useKnowledgeIndexingSettings(
  enabled = true,
): UseQueryResult<IndexingSettingsView> {
  const api = useKnowledgeIndexingApi();
  return useQuery({
    queryKey: knowledgeIndexingKeys.settings,
    queryFn: ({ signal }) => api.settings(signal),
    enabled,
  });
}
export function useKnowledgeIndexingStatus(
  enabled = true,
): UseQueryResult<IndexingStatus> {
  const api = useKnowledgeIndexingApi();
  return useQuery({
    queryKey: knowledgeIndexingKeys.status,
    queryFn: ({ signal }) => api.status(signal),
    enabled,
    refetchInterval: (query) =>
      query.state.data?.availability === 'ready' ? 10000 : 2000,
    refetchIntervalInBackground: false,
  });
}
export function useKnowledgeIndexingInstances(
  enabled = true,
): UseQueryResult<IndexingDirectory<IndexingInstanceView>> {
  const api = useKnowledgeIndexingApi();
  return useQuery({
    queryKey: knowledgeIndexingKeys.instances,
    queryFn: ({ signal }) => api.instances(signal),
    enabled,
  });
}
export function useKnowledgeEmbeddingModels(
  enabled = true,
): UseQueryResult<IndexingDirectory<EmbeddingServiceView>> {
  const api = useKnowledgeIndexingApi();
  return useQuery({
    queryKey: knowledgeIndexingKeys.models,
    queryFn: ({ signal }) => api.models(signal),
    enabled,
  });
}
