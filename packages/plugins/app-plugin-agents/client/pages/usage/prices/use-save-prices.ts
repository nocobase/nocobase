/** Saving the model prices (`/api/agents/admin/prices`). */
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { PricesAnswer, PricesInput } from '../../../../shared/reports.js';
import { agentsKeys } from '../../../api/keys.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';

/** Saves the whole price table (the page changes one row at a time) and keeps the answer as the prices read. */
export function useSavePrices(): UseMutationResult<
  PricesAnswer,
  Error,
  PricesInput
> {
  const api = useAgentsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PricesInput) => api.savePrices(input),
    onSuccess: (answer) => queryClient.setQueryData(agentsKeys.prices, answer),
  });
}
