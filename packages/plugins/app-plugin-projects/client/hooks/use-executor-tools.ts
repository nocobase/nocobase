import { useQuery } from '@tanstack/react-query';

import type { Executor } from '../../shared/issues.js';
import type { ExecutorTool, ExecutorAvailability } from '../../shared/kinds.js';
import { usePmApi } from './use-pm-api.js';

export interface ExecutorToolsState {
  readonly tools: readonly ExecutorTool[];
  readonly selected: ExecutorTool | null;
  readonly availability: ExecutorAvailability | null;
  readonly loading: boolean;
  readonly error: Error | null;
}

/** Tool and availability reads for application-owned selectors and start confirmations. */
export function useExecutorTools(
  executor: Executor | null,
): ExecutorToolsState {
  const api = usePmApi();
  const tools = useQuery({
    queryKey: ['pm', 'executorTools', executor?.type, executor?.id],
    queryFn: () =>
      executor ? api.executorTools(executor) : Promise.resolve([]),
    enabled: executor !== null && executor.type !== 'user',
    staleTime: 30_000,
  });
  const availability = useQuery({
    queryKey: [
      'pm',
      'executorAvailability',
      executor?.type,
      executor?.id,
      executor?.tool,
    ],
    queryFn: () =>
      executor?.tool
        ? api.executorAvailability(executor, executor.tool)
        : Promise.resolve(null),
    enabled: Boolean(
      executor?.tool && tools.data?.some((tool) => tool.id === executor.tool),
    ),
    staleTime: 0,
    refetchInterval: 15_000,
  });
  return {
    tools: tools.data ?? [],
    selected: tools.data?.find((tool) => tool.id === executor?.tool) ?? null,
    availability: availability.data ?? null,
    loading: tools.isFetching || availability.isFetching,
    error: tools.error ?? availability.error,
  };
}
