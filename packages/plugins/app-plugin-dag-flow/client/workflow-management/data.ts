import type { ApiJsonRequestOptions } from '@nocobase/app-client';

import type {
  WorkflowDetailRecord,
  WorkflowListRecord,
  WorkflowNodeRunPayload,
  WorkflowNodeRunRecord,
  WorkflowRunRecord,
} from './types.js';
import { getWorkflowClient } from './runtime.js';

interface DataResponse<T> {
  readonly data: T;
}

export interface WorkflowPage<T> {
  readonly data: T[];
  readonly meta: { page: number; pageSize: number; total: number };
}

const pendingRequests = new Map<string, Promise<unknown>>();

type WorkflowRequestOptions = Omit<ApiJsonRequestOptions, 'path'>;

async function request<T>(
  path: string,
  options: WorkflowRequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const key = `${method}:${path}`;
  const pending = method === 'GET' ? pendingRequests.get(key) : undefined;
  if (pending) return (await pending) as T;
  const operation = getWorkflowClient()
    .request<DataResponse<T>>({
      path,
      ...options,
    })
    .then((response) => {
      if (
        response === null ||
        typeof response !== 'object' ||
        !Object.hasOwn(response, 'data')
      ) {
        throw new Error('Workflow API returned an invalid response.');
      }
      return response.data;
    });
  if (method === 'GET') pendingRequests.set(key, operation);
  try {
    return await operation;
  } finally {
    if (pendingRequests.get(key) === operation) pendingRequests.delete(key);
  }
}

async function requestPage<T>(path: string): Promise<WorkflowPage<T>> {
  const key = `GET:${path}`;
  const pending = pendingRequests.get(key);
  if (pending) return (await pending) as WorkflowPage<T>;
  const operation = getWorkflowClient()
    .request<WorkflowPage<T>>({ path })
    .then((response) => {
      if (
        response === null ||
        typeof response !== 'object' ||
        !Array.isArray(response.data)
      ) {
        throw new Error('Workflow API returned an invalid paginated response.');
      }
      return {
        data: response.data,
        meta: response.meta ?? {
          page: 1,
          pageSize: 20,
          total: response.data.length,
        },
      };
    });
  pendingRequests.set(key, operation);
  try {
    return await operation;
  } finally {
    if (pendingRequests.get(key) === operation) pendingRequests.delete(key);
  }
}
/** Every item of a page-number list, read 100 at a time. */
async function requestAll<T>(path: string): Promise<T[]> {
  const separator = path.includes('?') ? '&' : '?';
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await requestPage<T>(
      `${path}${separator}page=${page}&pageSize=100`,
    );
    items.push(...result.data);
    if (result.data.length === 0 || items.length >= result.meta.total)
      return items;
  }
}

export const workflowApi = {
  workflows: (query: string = ''): Promise<WorkflowListRecord[]> =>
    request(`/workflows${query}`),
  workflowPage: (
    query: string = '',
  ): Promise<WorkflowPage<WorkflowListRecord>> =>
    requestPage(`/workflows${query}`),
  workflow: (id: string): Promise<WorkflowDetailRecord> =>
    request(`/workflows/${encodeURIComponent(id)}`),
  revisions: (
    id: string,
    update: number = 0,
  ): Promise<WorkflowDetailRecord[]> =>
    requestAll(
      `/workflows/${encodeURIComponent(id)}/revisions?update=${update}`,
    ),
  runs: (query: string = ''): Promise<WorkflowRunRecord[]> =>
    request(`/workflows/runs${query}`),
  runPage: (query: string = ''): Promise<WorkflowPage<WorkflowRunRecord>> =>
    requestPage(`/workflows/runs${query}`),
  /** The latest runs of a workflow's key, across all of its revisions. */
  workflowRuns: async (id: string): Promise<WorkflowRunRecord[]> =>
    (
      await requestPage<WorkflowRunRecord>(
        `/workflows/runs?workflowId=${encodeURIComponent(id)}&pageSize=50`,
      )
    ).data,
  run: (id: string): Promise<WorkflowRunRecord> =>
    request(`/workflows/runs/${encodeURIComponent(id)}`),
  nodeRuns: (id: string, nodeKey?: string): Promise<WorkflowNodeRunRecord[]> =>
    requestAll(
      `/workflows/runs/${encodeURIComponent(id)}/nodeRuns${nodeKey ? `?nodeKey=${encodeURIComponent(nodeKey)}` : ''}`,
    ),
  payload: (
    runId: string,
    nodeRunId: string,
  ): Promise<WorkflowNodeRunPayload> =>
    request(
      `/workflows/runs/${encodeURIComponent(runId)}/nodeRuns/${encodeURIComponent(nodeRunId)}/payload`,
    ),
  enable: (idOrHash: string): Promise<WorkflowListRecord> =>
    request(`/workflows/${encodeURIComponent(idOrHash)}/enable`, {
      method: 'POST',
    }),
  disable: (id: string): Promise<WorkflowListRecord> =>
    request(`/workflows/${encodeURIComponent(id)}/disable`, {
      method: 'POST',
    }),
  parameters: (
    id: string,
    parameterValues: Record<string, string | number | boolean>,
  ): Promise<object> =>
    request(`/workflows/${encodeURIComponent(id)}/parameters`, {
      method: 'PUT',
      json: { parameterValues },
    }),
  execute: (
    id: string,
    input: object,
    eventKey: string,
  ): Promise<WorkflowRunRecord> =>
    request(`/workflows/${encodeURIComponent(id)}/run`, {
      method: 'POST',
      headers: { 'event-key': eventKey },
      json: { input },
    }),
};

export function shouldPollRuns(runs: readonly WorkflowRunRecord[]): boolean {
  return runs.some((run) => run.status == null || run.status === 0);
}

export function createWorkflowEventKey(
  randomUUID: (() => string) | null = globalThis.crypto?.randomUUID?.bind(
    globalThis.crypto,
  ) ?? null,
): string {
  return (
    randomUUID?.() ??
    `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}
