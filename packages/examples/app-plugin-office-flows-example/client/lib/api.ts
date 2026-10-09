import type { ApiClient } from '@nocobase/app-client';

import { OFFICE_FLOWS_ROUTES } from '../../shared/routes.js';

export type Plain = Record<string, unknown>;

/** Mirrors the server's `LifecycleDescription`; the client imports no server code. */
export interface Description {
  readonly name: string;
  readonly states: readonly string[];
  readonly transitions: readonly {
    readonly name: string;
    readonly title: string;
  }[];
}

export interface Available {
  readonly name: string;
  readonly title: string;
  readonly allowed: boolean;
}

export interface TransitionEntry {
  readonly id: string;
  readonly transition: string;
  /** Null on the entry that records the creation. */
  readonly from: string | null;
  readonly to: string;
  readonly actorId: string;
  readonly input: Plain;
  readonly at: string;
}

export interface EffectRun {
  readonly id: string;
  readonly transitionId: string;
  readonly effect: string;
  readonly status:
    'queued' | 'running' | 'succeeded' | 'failed' | 'dead' | 'cancelled';
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly error: string | null;
}

export interface Trace {
  readonly id: number | string;
  readonly actorId: string;
  readonly action: string;
  readonly detail: Plain;
  readonly at: string;
}

export interface RecordView {
  readonly record: Plain;
  readonly description: Description;
  readonly available: readonly Available[];
  readonly history: {
    readonly transitions: readonly TransitionEntry[];
    readonly effectRuns: readonly EffectRun[];
  };
  readonly traces: readonly Trace[];
}

export interface ProcessingLevel {
  readonly title: string;
  readonly opinionLabel: string;
  readonly opinion: string;
  readonly kind: TaskKind;
  readonly tasks: readonly Plain[];
}

export type TaskKind = 'clerk' | 'team' | 'executor';

export interface Config {
  readonly departments: readonly {
    readonly id: string;
    readonly name: string;
    readonly clerks: readonly string[];
    readonly heads: readonly string[];
    readonly leaders: readonly string[];
  }[];
  readonly managementGroups: readonly {
    readonly id: string;
    readonly name: string;
    readonly members: readonly string[];
  }[];
  readonly holidays: readonly {
    readonly date: string;
    readonly kind: string;
    readonly name: string;
  }[];
}

/** The transition name of the log entry that records a creation. */
export const CREATE_TRANSITION = '$create';

const base = OFFICE_FLOWS_ROUTES;

/** Lists show at most this many records; the routes page by it. */
const PAGE_SIZE = '100';

/** `actAs` travels in the query string; the rest of `json` is the body. */
function split(json: Plain): { query?: Record<string, string>; json: Plain } {
  const { actAs, ...body } = json;
  return {
    ...(typeof actAs === 'string' ? { query: { actAs } } : {}),
    json: body,
  };
}

/** One place that knows the paths and the response shape, so pages read as what they do. */
export function api(client: ApiClient): {
  get<T>(path: string, actAs?: string): Promise<T>;
  list<T = Plain>(path: string, actAs?: string): Promise<T[]>;
  post<T = void>(path: string, json: Plain): Promise<T>;
  patch(path: string, json: Plain): Promise<void>;
  remove(path: string, actAs: string): Promise<void>;
} {
  const query = (actAs?: string): Record<string, string> | undefined =>
    actAs ? { actAs } : undefined;
  return {
    get: async <T>(path: string, actAs?: string): Promise<T> => {
      const actor = query(actAs);
      return (
        await client.request<{ readonly data: T }>({
          path: `${base}/${path}`,
          ...(actor ? { query: actor } : {}),
        })
      ).data;
    },
    list: async <T = Plain>(path: string, actAs?: string): Promise<T[]> =>
      (
        await client.request<{ readonly data: T[] }>({
          path: `${base}/${path}`,
          query: { ...query(actAs), pageSize: PAGE_SIZE },
        })
      ).data,
    post: async <T = void>(path: string, json: Plain): Promise<T> => {
      const body = await client.request<{ readonly data?: T } | undefined>({
        method: 'POST',
        path: `${base}/${path}`,
        ...split(json),
      });
      return body?.data as T;
    },
    patch: async (path: string, json: Plain): Promise<void> => {
      await client.request({
        method: 'PATCH',
        path: `${base}/${path}`,
        ...split(json),
      });
    },
    remove: async (path: string, actAs: string): Promise<void> => {
      await client.request({
        method: 'DELETE',
        path: `${base}/${path}`,
        query: { actAs },
      });
    },
  };
}

export function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/** The standard error body's message, or the error's own. */
export function errorMessage(cause: unknown): string {
  if (typeof cause === 'object' && cause !== null) {
    const payload = (cause as { payload?: { error?: { message?: unknown } } })
      .payload;
    if (typeof payload?.error?.message === 'string')
      return payload.error.message;
  }
  return cause instanceof Error ? cause.message : String(cause);
}
