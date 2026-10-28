import {
  QueryClient,
  type InvalidateQueryFilters,
  type InvalidateOptions,
  type Query,
  type QueryKey,
} from '@tanstack/react-query';
import type { PmApi } from './client.js';
import type { IssueDetail } from '../../shared/issues.js';
import { changedIssueSegments } from './changed-issues.js';

interface Refresh {
  pending: boolean;
  work: Promise<void>;
}

function isHistory(query: Query): boolean {
  const key = query.queryKey;
  return (
    key.length === 4 &&
    key[0] === 'pm' &&
    key[1] === 'issue' &&
    (key[3] === 'threads' || key[3] === 'activities')
  );
}

/** Preserve an in-flight history page, then refresh the expanded range once per invalidation burst. */
function refreshHistory(
  client: QueryClient,
  query: Query,
  entries: Map<Query, Refresh>,
  invalidate: (filters: InvalidateQueryFilters) => Promise<void>,
  options: InvalidateOptions,
): Promise<void> {
  const current = entries.get(query);
  if (current) {
    current.pending = true;
    return current.work;
  }
  const present = (): boolean =>
    client.getQueryCache().get(query.queryHash) === query;
  const active = (): boolean =>
    present() && query.isActive() && !query.isDisabled();
  if (!present() || (!active() && query.state.fetchStatus === 'idle'))
    return Promise.resolve();
  const entry: Refresh = { pending: true, work: Promise.resolve() };
  entries.set(query, entry);
  const exact = { queryKey: query.queryKey, exact: true };
  entry.work = (async () => {
    // Joining is not refreshing: a pending next page contains no edits to the older pages.
    if (query.state.fetchStatus !== 'idle')
      await query.promise?.catch(() => undefined);
    while (entry.pending && active() && query.state.fetchStatus !== 'paused') {
      entry.pending = false;
      await client.refetchQueries(
        { ...exact, type: 'active' },
        { ...options, cancelRefetch: false },
      );
    }
  })().finally(() => {
    entries.delete(query);
    // A successful in-flight read clears isInvalidated, even if the view disappeared meanwhile.
    if (entry.pending && present())
      void invalidate({ ...exact, refetchType: 'none' });
  });
  return entry.work;
}

/** All consumers share this boundary, including application-owned prefix invalidations. */
export class PmQueryClient extends QueryClient {
  private readonly historyRefreshes = new Map<Query, Refresh>();
  private readonly discussionRefreshes = new Map<Query, Refresh>();
  /** Synchronous cache writes from a push are not an explicit local action. */
  public isDiscussionUpdate = false;

  /** Read only the newest discussion pages; keep the rest of the authorized detail intact. */
  public async refreshDiscussions(
    api: Pick<PmApi, 'threads' | 'activities'>,
    issueIds: ReadonlySet<string>,
  ): Promise<void> {
    const segments = changedIssueSegments(this, issueIds);
    const queries = this.getQueryCache().findAll({
      queryKey: ['pm', 'issue'],
      predicate: (query) =>
        query.queryKey.length === 3 && segments.has(String(query.queryKey[2])),
    });
    await Promise.all(
      queries.map((query) => {
        const current = this.discussionRefreshes.get(query);
        if (current) {
          current.pending = true;
          return current.work;
        }
        if (!query.isActive() || query.isDisabled())
          return super.invalidateQueries({
            queryKey: query.queryKey,
            exact: true,
            refetchType: 'none',
          });
        const entry: Refresh = { pending: true, work: Promise.resolve() };
        this.discussionRefreshes.set(query, entry);
        entry.work = (async () => {
          while (
            entry.pending &&
            this.getQueryCache().get(query.queryHash) === query &&
            query.isActive()
          ) {
            entry.pending = false;
            if (query.state.fetchStatus !== 'idle')
              await query.promise?.catch(() => undefined);
            const before = query.state.data as IssueDetail | undefined;
            if (!before) return;
            const [threads, activities] = await Promise.all([
              api.threads(before.id),
              api.activities(before.id),
            ]);
            if (this.getQueryCache().get(query.queryHash) !== query) return;
            // A full read or local edit won the race; read after it rather than overwrite it.
            if (
              query.state.data !== before ||
              query.state.fetchStatus !== 'idle'
            ) {
              entry.pending = true;
              continue;
            }
            this.isDiscussionUpdate = true;
            try {
              this.setQueryData<IssueDetail>(query.queryKey, {
                ...before,
                threads: threads.data,
                threadsNextCursor: threads.nextCursor,
                activities: activities.data,
                activitiesNextCursor: activities.nextCursor,
              });
            } finally {
              this.isDiscussionUpdate = false;
            }
          }
        })()
          .catch(async () => {
            // Refusal or a failed partial read must still enter the ordinary snapshot recovery.
            await this.invalidateQueries({
              queryKey: query.queryKey,
              exact: true,
            });
          })
          .finally(() => {
            this.discussionRefreshes.delete(query);
          });
        return entry.work;
      }),
    );
    await this.invalidateQueries({
      queryKey: ['pm', 'issue'],
      predicate: (query) =>
        segments.has(String(query.queryKey[2])) && isHistory(query),
    });
  }

  override invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters: InvalidateQueryFilters<TTaggedQueryKey> = {},
    options: InvalidateOptions = {},
  ): Promise<void> {
    const histories = this.getQueryCache().findAll(filters).filter(isHistory);
    const invalidate = (filter: InvalidateQueryFilters): Promise<void> =>
      super.invalidateQueries(filter);
    return Promise.all([
      super.invalidateQueries(
        {
          ...filters,
          predicate: (query) =>
            !isHistory(query) &&
            (!filters.predicate || filters.predicate(query)),
        },
        options,
      ),
      ...histories.map((query) => {
        const marked = invalidate({
          queryKey: query.queryKey,
          exact: true,
          refetchType: 'none',
        });
        const refreshed =
          filters.refetchType === 'none'
            ? Promise.resolve()
            : refreshHistory(
                this,
                query,
                this.historyRefreshes,
                invalidate,
                options,
              );
        return Promise.all([marked, refreshed]);
      }),
    ]).then(() => undefined);
  }
}
