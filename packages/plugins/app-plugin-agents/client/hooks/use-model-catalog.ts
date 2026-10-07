import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { DefaultModels, ModelCatalog } from '../../shared/models.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from './use-agents-api.js';

/** The model services and models online agents may use (`GET agents/admin/models`). */
export function useModelCatalog(): UseQueryResult<ModelCatalog> {
  const api = useAgentsApi();
  return useQuery({
    queryKey: agentsKeys.models,
    queryFn: () => api.models(),
    staleTime: 30_000,
  });
}

/** The system default chat model online agents with no models of their own use (`GET agents/defaultModels`). */
export function useDefaultModels(): UseQueryResult<DefaultModels> {
  const api = useAgentsApi();
  return useQuery({
    queryKey: agentsKeys.defaultModels,
    queryFn: () => api.defaultModels(),
    staleTime: 30_000,
  });
}

/** The system default chat model as the agent pages name it, "service · model"; null while there is none or loading. */
export function useDefaultModelText(): string | null {
  const chosen = useDefaultModels().data?.effectiveChat;
  return chosen ? `${chosen.serviceTitle} · ${chosen.modelLabel}` : null;
}
