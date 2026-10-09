import { useQuery } from '@tanstack/react-query';

import type { Executor } from '../../shared/issues.js';
import type { ExecutorTool, ExecutorAvailability } from '../../shared/kinds.js';
import { usePmApi } from './use-pm-api.js';

export interface ExecutorToolsState {
  readonly tools: readonly ExecutorTool[];
  readonly defaultTool: ExecutorTool | null;
  readonly selected: ExecutorTool | null;
  /** Concrete tool to persist at confirmation, with default provenance when no tool was selected. */
  readonly resolvedExecutor: Executor | null;
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
  const choices = tools.data ?? [];
  const defaults = choices.filter((tool) => tool.isDefault);
  const defaultTool =
    defaults.length === 1
      ? defaults[0]
      : defaults.length === 0 && choices.length === 1
        ? choices[0]
        : null;
  const selected = executor?.tool
    ? (choices.find((tool) => tool.id === executor.tool) ?? null)
    : defaultTool;
  const availability = useQuery({
    queryKey: [
      'pm',
      'executorAvailability',
      executor?.type,
      executor?.id,
      selected?.id,
    ],
    queryFn: () =>
      executor && selected
        ? api.executorAvailability(executor, selected.id)
        : Promise.resolve(null),
    enabled: executor !== null && selected !== null,
    staleTime: 0,
    refetchInterval: 15_000,
  });
  return {
    tools: choices,
    defaultTool,
    selected,
    resolvedExecutor:
      executor && !executor.tool && selected
        ? { ...executor, tool: selected.id, toolSource: 'default' }
        : executor,
    availability: availability.data ?? null,
    loading: tools.isFetching || availability.isFetching,
    error: tools.error ?? availability.error,
  };
}
