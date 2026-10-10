/**
 * An issue's deployment marks (`marks.tsx`): each issue's are one query, and the queries a page starts together go to
 * the server as one request (`GET /api/deploys/marks`).
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { DeployMark } from '../../shared/previews.js';
import { previewKeys, readMarks } from '../previews/api.js';

const BATCH_MS = 20;
const MAX_BATCH = 200;

interface Waiting {
  readonly resolve: (marks: readonly DeployMark[]) => void;
  readonly reject: (error: unknown) => void;
}

/** Issue ids asked for within a few milliseconds, fetched together. */
function createBatcher(api: ApiClient) {
  let queue = new Map<string, Waiting[]>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    timer = null;
    const batch = queue;
    queue = new Map();
    const ids = [...batch.keys()];
    for (let start = 0; start < ids.length; start += MAX_BATCH) {
      const slice = ids.slice(start, start + MAX_BATCH);
      readMarks(api, slice).then(
        (marks) => {
          for (const id of slice)
            for (const waiting of batch.get(id) ?? [])
              waiting.resolve(marks[id] ?? []);
        },
        (error: unknown) => {
          for (const id of slice)
            for (const waiting of batch.get(id) ?? []) waiting.reject(error);
        },
      );
    }
  };
  return (issueId: string) =>
    new Promise<readonly DeployMark[]>((resolve, reject) => {
      queue.set(issueId, [...(queue.get(issueId) ?? []), { resolve, reject }]);
      timer ??= setTimeout(flush, BATCH_MS);
    });
}

const batchers = new WeakMap<ApiClient, ReturnType<typeof createBatcher>>();

function batcherOf(api: ApiClient) {
  let batcher = batchers.get(api);
  if (!batcher) {
    batcher = createBatcher(api);
    batchers.set(api, batcher);
  }
  return batcher;
}

export function useDeployMarks(
  issueId: string,
): UseQueryResult<readonly DeployMark[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: previewKeys.marks(issueId),
    queryFn: () => batcherOf(api)(issueId),
    staleTime: 30_000,
  });
}

/** One mark per environment, release targets first, as the ones people ask about. */
export function marksByEnvironment(marks: readonly DeployMark[]): DeployMark[] {
  return [...marks]
    .sort(
      (a, b) =>
        Number(b.role === 'production') - Number(a.role === 'production'),
    )
    .filter(
      (mark, index, all) =>
        all.findIndex((other) => other.environmentId === mark.environmentId) ===
        index,
    );
}
