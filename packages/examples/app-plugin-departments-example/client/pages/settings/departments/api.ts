import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

/** Plain text, or the translation descriptor a seeded department stores. */
export type DepartmentTitle = string | { key: string; ns: string };

export interface Department {
  readonly id: string;
  readonly title: DepartmentTitle;
  readonly parentId: string | null;
  readonly region: string | null;
  /** The head's user id; the head need not be a member. */
  readonly managerId?: string | null;
  /** The head's display name, which the server reads from the user directory. */
  readonly manager?: UserOption | null;
  readonly active: boolean;
  readonly sortOrder: number;
}

export interface DirectMember {
  readonly userId: string;
  readonly title: string;
  readonly description?: string;
  readonly primary: boolean;
}

export interface UserOption {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

export interface DepartmentChanges {
  readonly title?: string;
  readonly parentId?: string | null;
  readonly region?: string | null;
  readonly managerId?: string | null;
}

/** What the page hands its department child route through the outlet. */
export interface DepartmentsOutletContext {
  readonly departments: readonly Department[];
  readonly canUpdate: boolean;
  /** Reloads the tree after a child route changed it. */
  readonly reload: () => void;
}

export interface DepartmentsApi {
  listDepartments(signal?: AbortSignal): Promise<readonly Department[]>;
  createDepartment(input: {
    title: string;
    parentId?: string;
  }): Promise<Department>;
  updateDepartment(id: string, changes: DepartmentChanges): Promise<Department>;
  setActive(id: string, active: boolean): Promise<void>;
  listMembers(
    id: string,
    signal?: AbortSignal,
  ): Promise<readonly DirectMember[]>;
  addMember(id: string, userId: string): Promise<void>;
  removeMember(id: string, userId: string): Promise<void>;
  setPrimary(id: string, userId: string): Promise<void>;
  searchUsers(
    search: string,
    signal?: AbortSignal,
  ): Promise<readonly UserOption[]>;
}

const BASE = 'departmentsExample';

function department(id: string): string {
  return `${BASE}/departments/${encodeURIComponent(id)}`;
}

/** The `errors.*` key describing a failed request, from the reason the server answered. */
export function errorKey(error: unknown): string {
  if (!(error instanceof ApiClientError)) return 'errors.requestFailed';
  if (error.status === 403) return 'errors.FORBIDDEN';
  const code = error.reason;
  return code &&
    [
      'DEPARTMENT_NOT_FOUND',
      'DEPARTMENT_EXISTS',
      'PARENT_NOT_FOUND',
      'PARENT_CYCLE',
      'USER_NOT_FOUND',
      'MEMBER_NOT_FOUND',
      'INVALID_INPUT',
    ].includes(code)
    ? `errors.${code}`
    : 'errors.requestFailed';
}

export function useDepartmentsApi(): DepartmentsApi {
  const api = useApiClient();
  return useMemo<DepartmentsApi>(
    () => ({
      async listDepartments(signal) {
        const body = await api.request<{ data: Department[] }>({
          path: `${BASE}/departments`,
          ...(signal ? { signal } : {}),
        });
        return body.data;
      },
      async createDepartment(input) {
        const body = await api.request<{ data: Department }>({
          path: `${BASE}/departments`,
          method: 'POST',
          json: input,
        });
        return body.data;
      },
      async updateDepartment(id, changes) {
        const body = await api.request<{ data: Department }>({
          path: department(id),
          method: 'PATCH',
          json: changes,
        });
        return body.data;
      },
      async setActive(id, active) {
        await api.request({
          path: `${department(id)}/${active ? 'activate' : 'deactivate'}`,
          method: 'POST',
        });
      },
      async listMembers(id, signal) {
        const body = await api.request<{ data: DirectMember[] }>({
          path: `${department(id)}/members`,
          ...(signal ? { signal } : {}),
        });
        return body.data;
      },
      async addMember(id, userId) {
        await api.request({
          path: `${department(id)}/members`,
          method: 'POST',
          json: { userId },
        });
      },
      async removeMember(id, userId) {
        await api.request({
          path: `${department(id)}/members/${encodeURIComponent(userId)}`,
          method: 'DELETE',
        });
      },
      async setPrimary(id, userId) {
        await api.request({
          path: `${department(id)}/members/${encodeURIComponent(userId)}/makePrimary`,
          method: 'POST',
        });
      },
      async searchUsers(search, signal) {
        const body = await api.request<{ data: UserOption[] }>({
          path: `${BASE}/memberCandidates`,
          query: { q: search, page: 1, pageSize: 10 },
          ...(signal ? { signal } : {}),
        });
        return body.data;
      },
    }),
    [api],
  );
}
