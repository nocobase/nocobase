import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  KnowledgeSearchHit,
  KnowledgeSpaceSummary,
  KnowledgeTree,
  SpaceRef,
} from '../../shared/knowledge.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';

export interface KnowledgeDirectorySource {
  summaries(signal?: AbortSignal): Promise<readonly KnowledgeSpaceSummary[]>;
  search(query: string, signal?: AbortSignal): Promise<KnowledgeSearchHit[]>;
  readonly sharedScope: string;
  readonly sharedLabel: string;
}

export const directoryKey = (space: SpaceRef): string =>
  `${space.scope}:${space.scopeId}`;

/** Trees are fetched on expansion or direct selection, never to implement global search. */
export function useDirectory(
  source: KnowledgeDirectorySource | undefined,
  expanded: ReadonlySet<string>,
  active: SpaceRef | null,
  archived: boolean,
): {
  summaries: UseQueryResult<readonly KnowledgeSpaceSummary[]>;
  entries: readonly (KnowledgeSpaceSummary & {
    tree: UseQueryResult<KnowledgeTree>;
    docs: KnowledgeTree['spaces'][number]['docs'];
  })[];
} {
  const api = useKnowledgeApi();
  const summaries = useQuery({
    queryKey: ['knowledge', 'directory'],
    queryFn: ({ signal }) => source!.summaries(signal),
    enabled: !!source,
    retry: false,
  });
  const entries = summaries.data ?? [];
  const trees = useQueries({
    queries: entries.map(({ space }) => ({
      queryKey: knowledgeKeys.tree(space, archived),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        api.tree(space, archived, signal),
      enabled:
        !!source &&
        (expanded.has(directoryKey(space)) ||
          (!!active && directoryKey(active) === directoryKey(space))),
      retry: false,
    })),
  });
  return {
    summaries,
    entries: entries.map((entry, index) => ({
      ...entry,
      tree: trees[index],
      docs:
        trees[index]?.data?.spaces.find(
          (node) => directoryKey(node.space) === directoryKey(entry.space),
        )?.docs ?? [],
    })),
  };
}
