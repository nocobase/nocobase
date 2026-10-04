import type { ApiClient } from '@nocobase/app-client';

export type AIRequestQuery = Readonly<
  Record<string, string | number | boolean | null | undefined>
>;

export interface AIRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly query?: AIRequestQuery;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

/** A list response: the rows, and the paging facts the route reports. */
export interface AIListResponse<T> {
  readonly data: T[];
  readonly meta?: {
    readonly page?: number;
    readonly pageSize?: number;
    readonly total?: number;
    readonly nextPageToken?: string;
  };
}

/**
 * The path of an AI route under `/api`, each segment encoded. Employees are under `aiEmployees`, every other AI resource
 * under `aiEmployee`: `aiPath('aiEmployees', username)`, `aiPath('aiEmployee', 'skills', name)`.
 */
export function aiPath(...segments: readonly string[]): string {
  return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

/** Calls an AI route and returns its `data`. A `204` returns `undefined`. */
export async function requestAI<T>(
  api: ApiClient,
  path: string,
  options: AIRequestOptions = {},
): Promise<T> {
  const payload = await api.request<{ data: T } | undefined>(
    requestOptions(path, options),
  );
  return payload?.data as T;
}

/** Calls an AI list route and returns its rows with the paging `meta`. */
export async function requestAIList<T>(
  api: ApiClient,
  path: string,
  options: AIRequestOptions = {},
): Promise<AIListResponse<T>> {
  const payload = await api.request<AIListResponse<T> | undefined>(
    requestOptions(path, options),
  );
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta ?? {},
  };
}

function requestOptions(path: string, options: AIRequestOptions) {
  return {
    path,
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    ...(options.query === undefined ? {} : { query: options.query }),
    ...(options.body === undefined ? {} : { json: options.body }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  } as const;
}
