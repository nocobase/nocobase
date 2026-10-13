/**
 * The browser API of API keys: a person's own keys (`/api/apiKeys`, the API keys plugin's) and the organization's
 * (`/api/organizationKeys`, Studio's). Both are scoped by the same permission groups, so one scope editor serves both. Responses
 * are unwrapped from `{ data }`; failures throw `ApiClientError`.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import type {
  ApiKeyView,
  CreateApiKeyRequest,
  CreatedApiKey,
  KeyScopeInput,
  KeyScopeObject,
  KeyScopeOptions,
} from '@nocobase/app-plugin-api-keys/shared/scopes';
import { useMemo } from 'react';

import type {
  CreatedOrgApiKey,
  CreateOrgApiKeyRequest,
  OrgApiKey,
  OrgApiKeyEvent,
  UpdateOrgApiKeyRequest,
} from '../../shared/access.js';

const id = (value: string) => encodeURIComponent(value);

export const keyQueryKeys = {
  own: ['studio', 'keys', 'own'] as const,
  ownOptions: ['studio', 'keys', 'own', 'options'] as const,
  org: ['studio', 'api-keys'] as const,
  orgOptions: ['studio', 'api-keys', 'options'] as const,
  orgEvents: (keyId: string) =>
    ['studio', 'api-keys', keyId, 'events'] as const,
  objects: (group: string) => ['studio', 'keys', 'objects', group] as const,
};

/** The signed-in person's own keys. */
export interface KeyOwnerApi {
  options(): Promise<KeyScopeOptions>;
  objects(group: string): Promise<KeyScopeObject[]>;
  list(): Promise<ApiKeyView[]>;
  create(input: CreateApiKeyRequest): Promise<CreatedApiKey>;
  rotate(keyId: string): Promise<CreatedApiKey>;
  revoke(keyId: string): Promise<void>;
}

class Requests {
  public constructor(private readonly api: ApiClient) {}

  public async get<T>(path: string): Promise<T> {
    const { data } = await this.api.request<{ readonly data: T }>({ path });
    return data;
  }

  public async send<T = void>(
    path: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    json?: unknown,
  ): Promise<T> {
    const body = await this.api.request<{ readonly data: T } | undefined>({
      path,
      method,
      ...(json === undefined ? {} : { json }),
    });
    return body?.data as T;
  }
}

export function ownKeysApi(api: ApiClient): KeyOwnerApi {
  const requests = new Requests(api);
  return {
    options: () => requests.get('apiKeys/scopeOptions'),
    objects: (group) => requests.get(`apiKeys/scopeObjects/${id(group)}`),
    list: () => requests.get('apiKeys'),
    create: (input) => requests.send('apiKeys', 'POST', input),
    rotate: (keyId) => requests.send(`apiKeys/${id(keyId)}/rotate`, 'POST'),
    revoke: (keyId) => requests.send(`apiKeys/${id(keyId)}`, 'DELETE'),
  };
}

/** The organization's API keys: one row per key, each acting as a hidden identity of its own. */
export class OrgKeysApi {
  private readonly requests: Requests;

  public constructor(api: ApiClient) {
    this.requests = new Requests(api);
  }

  public list(): Promise<OrgApiKey[]> {
    return this.requests.get('organizationKeys');
  }

  /** The groups and presets, with what the viewer holds: what they may give a key. */
  public options(): Promise<KeyScopeOptions> {
    return this.requests.get('organizationKeys/scopeOptions');
  }

  /** The records the viewer may limit a group to, as for their own keys. */
  public objects(group: string): Promise<KeyScopeObject[]> {
    return this.requests.get(`apiKeys/scopeObjects/${id(group)}`);
  }

  public create(input: CreateOrgApiKeyRequest): Promise<CreatedOrgApiKey> {
    return this.requests.send('organizationKeys', 'POST', input);
  }

  public update(
    keyId: string,
    input: UpdateOrgApiKeyRequest,
  ): Promise<OrgApiKey> {
    return this.requests.send(`organizationKeys/${id(keyId)}`, 'PATCH', input);
  }

  public setScope(keyId: string, scope: KeyScopeInput): Promise<OrgApiKey> {
    return this.requests.send(`organizationKeys/${id(keyId)}/scope`, 'PUT', {
      scope,
    });
  }

  public rotate(keyId: string): Promise<CreatedOrgApiKey> {
    return this.requests.send(`organizationKeys/${id(keyId)}/rotate`, 'POST');
  }

  public disable(keyId: string): Promise<OrgApiKey> {
    return this.requests.send(`organizationKeys/${id(keyId)}/disable`, 'POST');
  }

  public enable(keyId: string): Promise<OrgApiKey> {
    return this.requests.send(`organizationKeys/${id(keyId)}/enable`, 'POST');
  }

  public remove(keyId: string): Promise<void> {
    return this.requests.send(`organizationKeys/${id(keyId)}`, 'DELETE');
  }

  public events(keyId: string): Promise<OrgApiKeyEvent[]> {
    return this.requests.get(`organizationKeys/${id(keyId)}/events`);
  }
}

export function useOwnKeysApi(): KeyOwnerApi {
  const api = useApiClient();
  return useMemo(() => ownKeysApi(api), [api]);
}

export function useOrgKeysApi(): OrgKeysApi {
  const api = useApiClient();
  return useMemo(() => new OrgKeysApi(api), [api]);
}
