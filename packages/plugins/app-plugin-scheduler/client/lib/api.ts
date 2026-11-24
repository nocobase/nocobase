/**
 * The scheduler API as the settings page reads it: `/api/scheduler/...` through the application's API client, and a
 * small loader hook that keeps the latest answer and its error.
 */
import { useApiClient } from '@nocobase/app-client';
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

export type OccurrenceStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'cancelled'
  | 'timed_out'
  | 'triggered';

export type TargetState = 'ready' | 'disabled' | 'missing' | 'invalid';

export interface LastRun {
  readonly status: OccurrenceStatus;
  readonly reason?: string;
  readonly finishedAt?: string;
}

export interface Schedule {
  readonly id: string;
  readonly key: string;
  readonly sourceType: string;
  readonly title: string;
  readonly description?: string;
  readonly cron: string;
  readonly timezone: string;
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
  readonly enabled: boolean;
  readonly targetType: string;
  readonly lifecycleState: 'active' | 'inactive';
  readonly inactiveReason?: string;
  readonly runCount: number;
  readonly completedCount: number;
  readonly nextRunAt?: string;
  readonly lastRunAt?: string;
  readonly lastRun?: LastRun;
  readonly scheduleStatus: 'active' | 'paused';
  readonly targetState: TargetState;
  readonly targetSummary: {
    readonly targetLabel: string;
    readonly description?: string;
    readonly href?: string;
    readonly state?: TargetState;
  };
}

export interface ScheduleDetail extends Schedule {
  readonly upcomingRuns: readonly string[];
}

export interface Occurrence {
  readonly id: string;
  readonly scheduleId: string;
  readonly status: OccurrenceStatus;
  readonly reason?: string;
  readonly executionCount: number;
  readonly startedAt: string;
  readonly scheduledAt?: string;
  readonly acceptedAt?: string;
  readonly finishedAt?: string;
  readonly targetReceipt?: Readonly<Record<string, unknown>>;
  readonly resultSummary?: Readonly<Record<string, unknown>>;
  readonly target: {
    readonly type: string;
    readonly reference?: { readonly type: string; readonly id: string };
    readonly href?: string;
  };
}

export type ConfigSource = 'environment' | 'config' | 'default';

export interface RemovedSchedule {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly lastRunAt?: string;
  readonly lastRun?: LastRun;
}

export interface JobsDescription {
  readonly configuration: string | null;
  readonly selectedBy: 'scheduler.jobs' | 'jobs.default' | 'built-in';
  readonly adapter: string;
  readonly pluginRegistered: boolean;
  readonly multiInstance: boolean;
  readonly persistencePath?: string;
  readonly concurrency: number;
  readonly attempts: number;
  readonly namespace?: string;
  readonly connection?: string;
  readonly sources: {
    readonly configuration: ConfigSource;
    readonly adapter: ConfigSource;
    readonly concurrency: ConfigSource;
    readonly attempts: ConfigSource;
    readonly namespace?: ConfigSource;
    readonly connection?: ConfigSource;
  };
  readonly removedFromCode: readonly RemovedSchedule[];
}

export interface SchedulesAnswer {
  readonly schedules: readonly Schedule[];
  readonly jobs?: JobsDescription;
}

export interface OccurrencePage {
  readonly items: readonly Occurrence[];
  readonly nextPageToken?: string;
}

export interface HistoryFilters {
  readonly scheduleId?: string;
  readonly statuses?: readonly OccurrenceStatus[];
  readonly from?: string;
  readonly to?: string;
}

/** The largest page the API serves. */
const PAGE_SIZE = 100;

type Query = Record<
  string,
  string | number | boolean | readonly string[] | undefined
>;

export interface SchedulerApi {
  /** Every Schedule of the application, with the jobs configuration they run on. */
  listSchedules(): Promise<SchedulesAnswer>;
  getSchedule(id: string): Promise<ScheduleDetail>;
  listScheduleOccurrences(
    id: string,
    pageToken?: string,
  ): Promise<OccurrencePage>;
  listOccurrences(
    filters: HistoryFilters,
    pageToken?: string,
  ): Promise<OccurrencePage>;
  setEnabled(id: string, enabled: boolean): Promise<Schedule>;
}

export function useSchedulerApi(): SchedulerApi {
  const client = useApiClient();
  return useMemo(() => {
    const list = async <T, M>(path: string, query: Query) => {
      const response = await client.request<{ data: T[]; meta: M }>({
        path: `scheduler/${path}`,
        query,
      });
      return response;
    };
    return {
      async listSchedules() {
        const schedules: Schedule[] = [];
        let jobs: JobsDescription | undefined;
        for (let page = 1; ; page += 1) {
          const response = await list<
            Schedule,
            { total: number; jobs?: JobsDescription }
          >('schedules', { page, pageSize: PAGE_SIZE });
          schedules.push(...response.data);
          jobs ??= response.meta.jobs;
          if (
            response.data.length === 0 ||
            schedules.length >= response.meta.total
          )
            break;
        }
        return { schedules, ...(jobs ? { jobs } : {}) };
      },
      async getSchedule(id) {
        const response = await client.request<{ data: ScheduleDetail }>({
          path: `scheduler/schedules/${encodeURIComponent(id)}`,
        });
        return response.data;
      },
      async listScheduleOccurrences(id, pageToken) {
        const response = await list<Occurrence, { nextPageToken?: string }>(
          `schedules/${encodeURIComponent(id)}/occurrences`,
          { pageSize: 20, pageToken },
        );
        return pageOf(response);
      },
      async listOccurrences(filters, pageToken) {
        const response = await list<Occurrence, { nextPageToken?: string }>(
          'occurrences',
          {
            pageSize: 20,
            pageToken,
            scheduleId: filters.scheduleId,
            status: filters.statuses,
            from: filters.from,
            to: filters.to,
          },
        );
        return pageOf(response);
      },
      async setEnabled(id, enabled) {
        const response = await client.request<{ data: Schedule }>({
          path: `scheduler/schedules/${encodeURIComponent(id)}/${enabled ? 'enable' : 'disable'}`,
          method: 'POST',
        });
        return response.data;
      },
    };
  }, [client]);
}

function pageOf(response: {
  data: Occurrence[];
  meta: { nextPageToken?: string };
}): OccurrencePage {
  return {
    items: response.data,
    ...(response.meta?.nextPageToken
      ? { nextPageToken: response.meta.nextPageToken }
      : {}),
  };
}

export interface Loaded<T> {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly loading: boolean;
  readonly reload: () => void;
}

/**
 * Loads with `load`, again whenever `key` changes or `reload` is called; answers for an older key are dropped. A reload
 * keeps the previous answer on screen until the new one arrives.
 */
export function useLoad<T>(load: () => Promise<T>, key: string): Loaded<T> {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{
    readonly token: string;
    readonly data?: T;
    readonly error?: unknown;
  }>({ token: '' });
  const fetchLatest = useEffectEvent(() => load());
  const token = `${key}#${tick}`;
  useEffect(() => {
    let active = true;
    fetchLatest().then(
      (data) => {
        if (active) setState({ token, data });
      },
      (reason: unknown) => {
        if (active)
          setState((previous) => ({
            token,
            data: previous.data,
            error: reason ?? new Error('Request failed.'),
          }));
      },
    );
    return () => {
      active = false;
    };
  }, [token]);
  const reload = useCallback(() => setTick((value) => value + 1), []);
  return {
    data: state.data,
    error: state.token === token ? state.error : undefined,
    loading: state.token !== token,
    reload,
  };
}

/**
 * A history read page by page: the first page loads with `key`, `more()` appends the next. Changing `key` starts
 * over; an answer for an older key is dropped.
 */
export function usePagedOccurrences(
  load: (pageToken?: string) => Promise<OccurrencePage>,
  key: string,
): {
  readonly items: readonly Occurrence[];
  readonly loading: boolean;
  readonly error: unknown;
  readonly hasMore: boolean;
  readonly more: () => void;
  readonly reload: () => void;
} {
  const [state, setState] = useState<{
    readonly key: string;
    readonly items: readonly Occurrence[];
    readonly nextPageToken?: string;
    readonly loading: boolean;
    readonly error?: unknown;
  }>({ key: '', items: [], loading: true });
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const token = `${key}#${tick}`;
  const received = (
    current: string,
    page: OccurrencePage,
    previous: readonly Occurrence[],
  ) => ({
    key: current,
    items: [...previous, ...page.items],
    loading: false,
    ...(page.nextPageToken ? { nextPageToken: page.nextPageToken } : {}),
  });
  useEffect(() => {
    let active = true;
    loadRef.current().then(
      (page) => {
        if (active) setState(received(token, page, []));
      },
      (error: unknown) => {
        if (active) setState({ key: token, items: [], loading: false, error });
      },
    );
    return () => {
      active = false;
    };
  }, [token]);
  const current = state.key === token;
  const more = () => {
    const next = state.nextPageToken;
    if (!current || !next || state.loading) return;
    setState((previous) => ({ ...previous, loading: true }));
    loadRef.current(next).then(
      (page) =>
        setState((previous) =>
          previous.key === token
            ? received(token, page, previous.items)
            : previous,
        ),
      (error: unknown) =>
        setState((previous) =>
          previous.key === token
            ? { ...previous, loading: false, error }
            : previous,
        ),
    );
  };
  return {
    items: current ? state.items : [],
    loading: !current || state.loading,
    error: current ? state.error : undefined,
    hasMore: current && state.nextPageToken !== undefined,
    more,
    reload: () => setTick((value) => value + 1),
  };
}
