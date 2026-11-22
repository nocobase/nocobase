import { useQuery } from '@tanstack/react-query';

import {
  MODEL_PROVIDERS,
  type ModelProviderOption,
} from '../../shared/models.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';

/**
 * The providers a model service can use, as the server lists them: the built-in ones, then those other plugins
 * registered. The built-in ones stand in until the list arrives.
 */
export function useModelProviders(): readonly ModelProviderOption[] {
  const api = useAgentsApi();
  const listed = useQuery({
    queryKey: agentsKeys.modelProviders,
    queryFn: () => api.modelProviders(),
    staleTime: Infinity,
  });
  return listed.data ?? MODEL_PROVIDERS;
}
