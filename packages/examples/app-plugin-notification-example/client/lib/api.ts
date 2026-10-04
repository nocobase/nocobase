import type { ApiClient } from '@nocobase/app-client';

export const TASK_STATUSES = ['open', 'in-progress', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly creatorId: string;
  readonly assigneeId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly creator: User;
  readonly assignee: User;
}

interface DataResponse<T> {
  readonly data: T;
}

export interface TaskPage {
  readonly data: Task[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface TaskPageOptions {
  readonly page: number;
  readonly pageSize: number;
}

const basePath = 'notificationExample';

export async function listTasks(
  api: ApiClient,
  options: TaskPageOptions,
): Promise<TaskPage> {
  const response = await api.request<TaskPage>({
    path: `${basePath}/tasks`,
    query: { page: options.page, pageSize: options.pageSize },
  });
  return response;
}

export async function getTask(api: ApiClient, id: string): Promise<Task> {
  const response = await api.request<DataResponse<Task>>({
    path: `${basePath}/tasks/${encodeURIComponent(id)}`,
  });
  return response.data;
}

export async function listUsers(api: ApiClient): Promise<User[]> {
  const response = await api.request<DataResponse<User[]>>({
    path: `${basePath}/assignees`,
  });
  return response.data;
}

export async function createTask(
  api: ApiClient,
  values: Pick<Task, 'title' | 'description' | 'assigneeId'>,
): Promise<Task> {
  const response = await api.request<DataResponse<Task>>({
    method: 'POST',
    path: `${basePath}/tasks`,
    json: values,
  });
  return response.data;
}

export async function updateTask(
  api: ApiClient,
  id: string,
  values: Pick<Task, 'title' | 'description' | 'status' | 'assigneeId'>,
): Promise<Task> {
  const response = await api.request<DataResponse<Task>>({
    method: 'PATCH',
    path: `${basePath}/tasks/${encodeURIComponent(id)}`,
    json: values,
  });
  return response.data;
}

export function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
