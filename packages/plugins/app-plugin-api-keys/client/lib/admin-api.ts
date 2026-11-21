import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import type { ApiKeyView, KeyPermissions } from '../../shared/scopes.js';

/** A system key as `/api/systemApiKeys` answers it. */
export interface SystemKey extends ApiKeyView {
  readonly identityId: string;
  readonly owner: { readonly id: string; readonly name: string } | null;
  readonly managedBy: {
    readonly kind: string;
    readonly id: string;
    readonly title: string;
  } | null;
  readonly createdById: string | null;
  readonly permissions: KeyPermissions;
}

export interface SystemKeyEvent {
  readonly id: string;
  readonly action:
    | 'create'
    | 'update'
    | 'permissions'
    | 'rotate'
    | 'disable'
    | 'enable'
    | 'delete'
    | 'adopt';
  readonly actor: { readonly id: string; readonly name: string } | null;
  readonly details: Readonly<Record<string, unknown>> | null;
  readonly createdAt: string;
}

export interface MemberKey extends ApiKeyView {
  readonly member: {
    readonly id: string;
    readonly name: string;
    readonly disabled: boolean;
  };
}

export interface KeyRules {
  readonly allowSameAsMe: boolean;
  readonly personalMaxDays: number | null;
  readonly personalDefaultDays: number;
  readonly idleDisableDays: number | null;
  readonly idleSince: string | null;
  readonly saved: boolean;
}

export interface CreateSystemKeyInput {
  readonly name: string;
  readonly description: string | null;
  readonly ownerId: string | null;
  readonly expiresInDays: number | null;
  readonly permissions: KeyPermissions;
}

/** System settings › API keys, over `/api/systemApiKeys` and `/api/apiKeys`. */
export interface ApiKeysAdminApi {
  systemKeys(search?: string): Promise<SystemKey[]>;
  systemKey(identityId: string): Promise<SystemKey>;
  createSystemKey(
    input: CreateSystemKeyInput,
  ): Promise<{ key: SystemKey; secret: string }>;
  updateSystemKey(
    identityId: string,
    input: {
      name?: string;
      description?: string | null;
      ownerId?: string | null;
    },
  ): Promise<SystemKey>;
  setPermissions(
    identityId: string,
    permissions: KeyPermissions,
  ): Promise<SystemKey>;
  rotate(identityId: string): Promise<{ key: SystemKey; secret: string }>;
  setEnabled(identityId: string, enabled: boolean): Promise<SystemKey>;
  remove(identityId: string): Promise<void>;
  events(identityId: string): Promise<SystemKeyEvent[]>;
  memberKeys(filter: {
    search?: string;
    sameAsMember?: boolean;
    idleDays?: number;
    page?: number;
  }): Promise<{ data: MemberKey[]; total: number }>;
  revokeMemberKey(keyId: string): Promise<void>;
  rules(): Promise<KeyRules>;
  saveRules(rules: Omit<KeyRules, 'idleSince' | 'saved'>): Promise<KeyRules>;
}

export function createApiKeysAdminApi(api: ApiClient): ApiKeysAdminApi {
  const key = (identityId: string) =>
    `systemApiKeys/${encodeURIComponent(identityId)}`;
  const data = async <T>(promise: Promise<{ data: T }>): Promise<T> =>
    (await promise).data;
  return {
    systemKeys: (search) =>
      data(
        api.request<{ data: SystemKey[] }>({
          path: 'systemApiKeys',
          ...(search ? { query: { q: search } } : {}),
        }),
      ),
    systemKey: (identityId) =>
      data(api.request<{ data: SystemKey }>({ path: key(identityId) })),
    createSystemKey: (input) =>
      data(
        api.request<{ data: { key: SystemKey; secret: string } }>({
          path: 'systemApiKeys',
          method: 'POST',
          json: input,
        }),
      ),
    updateSystemKey: (identityId, input) =>
      data(
        api.request<{ data: SystemKey }>({
          path: key(identityId),
          method: 'PATCH',
          json: input,
        }),
      ),
    setPermissions: (identityId, permissions) =>
      data(
        api.request<{ data: SystemKey }>({
          path: `${key(identityId)}/permissions`,
          method: 'PUT',
          json: { permissions },
        }),
      ),
    rotate: (identityId) =>
      data(
        api.request<{ data: { key: SystemKey; secret: string } }>({
          path: `${key(identityId)}/rotate`,
          method: 'POST',
        }),
      ),
    setEnabled: (identityId, enabled) =>
      data(
        api.request<{ data: SystemKey }>({
          path: `${key(identityId)}/${enabled ? 'enable' : 'disable'}`,
          method: 'POST',
        }),
      ),
    remove: async (identityId) => {
      await api.request({ path: key(identityId), method: 'DELETE' });
    },
    events: (identityId) =>
      data(
        api.request<{ data: SystemKeyEvent[] }>({
          path: `${key(identityId)}/events`,
        }),
      ),
    memberKeys: async (filter) => {
      const answer = await api.request<{
        data: MemberKey[];
        meta: { total: number };
      }>({
        path: 'apiKeys/members',
        query: {
          ...(filter.search ? { q: filter.search } : {}),
          ...(filter.sameAsMember ? { sameAsMember: 'true' } : {}),
          ...(filter.idleDays ? { idleDays: String(filter.idleDays) } : {}),
          ...(filter.page ? { page: String(filter.page) } : {}),
        },
      });
      return { data: answer.data, total: answer.meta.total };
    },
    revokeMemberKey: async (keyId) => {
      await api.request({
        path: `apiKeys/members/${encodeURIComponent(keyId)}`,
        method: 'DELETE',
      });
    },
    rules: () =>
      data(api.request<{ data: KeyRules }>({ path: 'apiKeys/rules' })),
    saveRules: (rules) =>
      data(
        api.request<{ data: KeyRules }>({
          path: 'apiKeys/rules',
          method: 'PUT',
          json: rules,
        }),
      ),
  };
}

export function useApiKeysAdminApi(): ApiKeysAdminApi {
  const api = useApiClient();
  return useMemo(() => createApiKeysAdminApi(api), [api]);
}
