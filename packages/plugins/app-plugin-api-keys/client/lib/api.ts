import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import type {
  ApiKeyDetailView,
  ApiKeyView,
  CreatedApiKey,
  GrantablePermissions,
  KeyPermissions,
  KeyScopeObject,
} from '../../shared/scopes.js';

/** `GET /api/apiKeys`'s meta: whether the caller may create keys, and keys that act as them in full. */
export interface OwnKeysMeta {
  readonly total: number;
  readonly mayCreate: boolean;
  readonly allowSameAsMe: boolean;
}

/** The body of `POST /api/apiKeys`; `permissions: null` makes a key that acts as its owner in full. */
export interface CreateKeyInput {
  readonly name: string;
  readonly description: string | null;
  readonly expiresInDays: number | null;
  readonly permissions: KeyPermissions | null;
}

/** The signed-in person's own keys, over `/api/apiKeys`. */
export interface ApiKeysApi {
  list(): Promise<{ data: ApiKeyView[]; meta: OwnKeysMeta }>;
  get(keyId: string): Promise<ApiKeyDetailView>;
  grantable(): Promise<GrantablePermissions>;
  objects(business: string, search?: string): Promise<KeyScopeObject[]>;
  /** The records the caller sees through a composite action's data scope, which a key's scope may be limited to. */
  scopeRecords(input: {
    resource: string;
    action: string;
    scope: string;
    search?: string;
  }): Promise<KeyScopeObject[]>;
  create(input: CreateKeyInput): Promise<CreatedApiKey>;
  rotate(keyId: string): Promise<CreatedApiKey>;
  revoke(keyId: string): Promise<void>;
}

export function createApiKeysApi(api: ApiClient): ApiKeysApi {
  const key = (keyId: string) => `apiKeys/${encodeURIComponent(keyId)}`;
  return {
    list: () => api.request({ path: 'apiKeys' }),
    get: async (keyId) =>
      (await api.request<{ data: ApiKeyDetailView }>({ path: key(keyId) }))
        .data,
    grantable: async () =>
      (
        await api.request<{ data: GrantablePermissions }>({
          path: 'apiKeys/grantable',
        })
      ).data,
    objects: async (business, search) =>
      (
        await api.request<{ data: KeyScopeObject[] }>({
          path: `apiKeys/objects/${encodeURIComponent(business)}`,
          ...(search ? { query: { q: search } } : {}),
        })
      ).data,
    scopeRecords: async ({ resource, action, scope, search }) =>
      (
        await api.request<{ data: KeyScopeObject[] }>({
          path: 'apiKeys/scopeRecords',
          query: { resource, action, scope, ...(search ? { q: search } : {}) },
        })
      ).data,
    create: async (input) =>
      (
        await api.request<{ data: CreatedApiKey }, CreateKeyInput>({
          path: 'apiKeys',
          method: 'POST',
          json: input,
        })
      ).data,
    rotate: async (keyId) =>
      (
        await api.request<{ data: CreatedApiKey }>({
          path: `${key(keyId)}/rotate`,
          method: 'POST',
        })
      ).data,
    revoke: async (keyId) => {
      await api.request({ path: key(keyId), method: 'DELETE' });
    },
  };
}

export function useApiKeysApi(): ApiKeysApi {
  const api = useApiClient();
  return useMemo(() => createApiKeysApi(api), [api]);
}
