import { useQuery } from '@tanstack/react-query';

import { pmKeys } from '../api/keys.js';
import { usePmApi } from './use-pm-api.js';

/**
 * Organizations' API keys by the id of the identity each acts as, with the key's name: they are not members, so the
 * name the server did not give and the "API key" tag beside it come from here. Deleted keys stay, so what they did
 * keeps its name. Empty until loaded.
 */
export function useApiKeyActors(): ReadonlyMap<string, string> {
  const api = usePmApi();
  const actors = useQuery({
    queryKey: pmKeys.apiKeyActors,
    queryFn: () => api.apiKeyActors(),
    staleTime: 60_000,
  });
  return new Map((actors.data ?? []).map((actor) => [actor.id, actor.name]));
}
