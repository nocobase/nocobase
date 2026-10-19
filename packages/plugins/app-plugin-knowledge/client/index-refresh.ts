import { useEffect } from 'react';
import {
  useQueryClient,
  type Query,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {
  createRealtimeRefresh,
  refreshRealtimeQueries,
  realtimeClientToken,
  useService,
  type RealtimeClient,
  type RealtimeRefresh,
} from '@nocobase/app-client';
import {
  KNOWLEDGE_TOPIC,
  type KnowledgeDocIndex,
  type KnowledgeChanged,
  type KnowledgeIndexNotifications,
  type KnowledgeUnindexedDoc,
} from '../shared/knowledge.js';

export interface KnowledgeIndexRefreshOptions {
  /** Maximum fallback interval without acknowledged complete notifications. Defaults to 30 seconds; clamped to 5–60 seconds. */
  readonly maxPollMs?: number;
}

type IndexData = KnowledgeDocIndex | KnowledgeUnindexedDoc[] | null;
const entries = new WeakMap<Query, IndexRefresh>();
const INITIAL_MS = 5_000;
const MAX_MS = 30_000;
const RECONCILE_MS = 60_000;

function statusOf(error: unknown): number | undefined {
  return typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
    ? error.status
    : undefined;
}
function transient(error: unknown): boolean {
  const status = statusOf(error);
  return (
    status === undefined ||
    status < 400 ||
    status >= 500 ||
    status === 408 ||
    status === 429
  );
}

/** One scheduler per cached index query, shared by every mounted observer. */
class IndexRefresh {
  public notifications: KnowledgeIndexNotifications = 'none';
  public references = 0;
  private scheduled?: RealtimeRefresh;
  private stop?: () => void;
  private timer?: ReturnType<typeof setTimeout>;
  private ready = false;
  private allowRetry = false;
  private signature?: string;
  private unchanged = 0;
  private updated = -1;
  private readonly limits: number[] = [];

  public constructor(
    private client: QueryClient,
    private query: Query,
  ) {}

  public reset(): void {
    this.signature = undefined;
    this.unchanged = 0;
  }

  private plan(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    const { data, error, fetchStatus } = this.query.state;
    if (
      !this.scheduled ||
      this.scheduled.snapshot.status === 'failed' ||
      fetchStatus !== 'idle' ||
      (error && !transient(error))
    )
      return;
    const index = data as IndexData | undefined;
    const enabled =
      index !== null &&
      index !== undefined &&
      (Array.isArray(index) || index.enabled);
    if (!enabled) return;
    const pending = Array.isArray(index)
      ? index.some((doc) => doc.pending > 0)
      : index.pending > 0;
    const complete = this.notifications === 'complete' && this.ready;
    // Idle legacy indexers stop fast polling; complete indexers retain reconciliation
    // so lost start/progress events and changes to the indexer are discovered.
    if (!complete && !pending) return;
    const delay = complete
      ? RECONCILE_MS
      : Math.min(
          Math.min(...this.limits),
          INITIAL_MS * 2 ** Math.min(this.unchanged, 20),
        );
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        this.scheduled?.request();
      },
      Math.max(0, delay - (Date.now() - this.query.state.dataUpdatedAt)),
    );
  }

  private observe(): void {
    const { data, error, status, dataUpdateCount, fetchStatus } =
      this.query.state;
    if (status === 'error') {
      clearTimeout(this.timer);
      if (
        (statusOf(error) === 401 || statusOf(error) === 403) &&
        data !== undefined
      )
        this.query.setState({ data: undefined, dataUpdatedAt: 0 });
      // The initial useQuery read runs before the scheduler. Its transient
      // failure needs recovery too; scheduled reads already own their retries.
      if (fetchStatus === 'idle' && this.scheduled?.snapshot.status === 'idle')
        this.scheduled.request();
      return;
    }
    if (status === 'success' && dataUpdateCount !== this.updated) {
      this.updated = dataUpdateCount;
      const signature = JSON.stringify(data);
      this.unchanged = signature === this.signature ? this.unchanged + 1 : 0;
      this.signature = signature;
      // A successful explicit refetch also recovers a previously blocked scheduler.
      if (this.scheduled?.snapshot.status === 'failed') this.scheduled.retry();
    }
    this.plan();
  }

  public retain(realtime: RealtimeClient, maxPollMs: number): () => void {
    this.limits.push(maxPollMs);
    this.references += 1;
    if (this.references === 1) {
      this.ready = false;
      this.allowRetry = false;
      this.reset();
      this.scheduled = createRealtimeRefresh(
        (signal) => {
          if (
            this.client.getQueryCache().get(this.query.queryHash) !== this.query
          )
            return;
          const error = this.query.state.error;
          if (error && !transient(error) && !this.allowRetry) throw error;
          this.allowRetry = false;
          return refreshRealtimeQueries(
            this.client,
            { queryKey: this.query.queryKey, exact: true },
            signal,
          );
        },
        {
          shouldRetry: transient,
          onStateChange: (snapshot) => {
            if (snapshot.status === 'idle' || snapshot.status === 'failed')
              this.plan();
          },
        },
      );
      const subscription = realtime.watch<KnowledgeChanged>(KNOWLEDGE_TOPIC, {
        onEvent: ({ payload }) => {
          if (
            payload.docId &&
            this.query.queryKey[1] === 'index' &&
            payload.docId !== this.query.queryKey[2]
          )
            return;
          this.reset();
          this.scheduled?.request();
        },
        onReady: () => {
          this.allowRetry = true;
          this.ready = true;
          this.reset();
          this.scheduled?.retry();
        },
        onStateChange: (state) => {
          if (state !== 'subscribed') {
            this.ready = false;
            this.reset();
            this.plan();
          }
        },
      });
      const release = this.client.getQueryCache().subscribe((event) => {
        if (event.type === 'updated' && event.query === this.query)
          this.observe();
      });
      this.stop = () => {
        release();
        subscription.close();
        this.scheduled?.close();
        this.scheduled = undefined;
        clearTimeout(this.timer);
      };
      this.observe();
    }
    this.plan();
    let retained = true;
    return () => {
      if (!retained) return;
      retained = false;
      this.limits.splice(this.limits.indexOf(maxPollMs), 1);
      this.references -= 1;
      if (this.references === 0) {
        this.stop?.();
        this.stop = undefined;
      }
    };
  }
}

function entryFor(
  client: QueryClient,
  key: QueryKey,
): IndexRefresh | undefined {
  const query = client.getQueryCache().find({ queryKey: key, exact: true });
  if (!query) return undefined;
  let entry = entries.get(query);
  if (!entry) {
    entry = new IndexRefresh(client, query);
    entries.set(query, entry);
  }
  return entry;
}

export function recordIndexNotifications(
  client: QueryClient,
  key: QueryKey,
  notifications?: KnowledgeIndexNotifications,
): void {
  const entry = entryFor(client, key);
  if (entry) entry.notifications = notifications ?? 'none';
}

/** General Knowledge event refreshes leave managed index queries to their own scheduler. */
export function hasIndexRefresh(query: Query): boolean {
  return (entries.get(query)?.references ?? 0) > 0;
}

export function resetIndexRefresh(client: QueryClient, key: QueryKey): void {
  entryFor(client, key)?.reset();
}

export function useIndexRefresh(
  key: QueryKey,
  enabled: boolean,
  options: KnowledgeIndexRefreshOptions = {},
): void {
  const client = useQueryClient();
  const realtime = useService(realtimeClientToken);
  const query = client.getQueryCache().find({ queryKey: key, exact: true });
  const maxPollMs =
    typeof options.maxPollMs === 'number' && Number.isFinite(options.maxPollMs)
      ? Math.min(RECONCILE_MS, Math.max(INITIAL_MS, options.maxPollMs))
      : MAX_MS;
  useEffect(() => {
    if (
      !enabled ||
      !query ||
      client.getQueryCache().get(query.queryHash) !== query
    )
      return;
    return entryFor(client, query.queryKey)?.retain(realtime, maxPollMs);
  }, [client, realtime, query, enabled, maxPollMs]);
}
