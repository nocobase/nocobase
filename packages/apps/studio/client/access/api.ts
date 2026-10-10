/**
 * The browser API of Studio's `/api/access` (roles, the members with theirs, the access settings) and `/api/knowledgeSearch`.
 * Responses are unwrapped from `{ data }`; failures throw `ApiClientError` (`status`, `reason`).
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import type {
  AccessCatalog,
  AccessMe,
  AccessSettings,
  MemberWithRoles,
  MembersListMeta,
  Role,
  SaveRoleRequest,
} from '../../shared/access.js';
import type {
  KnowledgeSearchConfig,
  KnowledgeSearchSettings,
} from '../../shared/knowledge.js';

type Method = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const id = (value: string) => encodeURIComponent(value);

/** Query keys: everything under `nb-studio`, the roles and members together so a change refreshes both. */
export const studioKeys = {
  all: ['studio'] as const,
  me: ['studio', 'me'] as const,
  catalog: ['studio', 'access', 'catalog'] as const,
  roles: ['studio', 'access', 'roles'] as const,
  members: ['studio', 'access', 'members'] as const,
  settings: ['studio', 'access', 'settings'] as const,
};

export class StudioApi {
  public constructor(private readonly api: ApiClient) {}

  public me(): Promise<AccessMe> {
    return this.get('access/me');
  }

  /** `GET /api/access/catalog`: what a role can hold, as the plugins registered it. */
  public catalog(): Promise<AccessCatalog> {
    return this.get('access/catalog');
  }

  public roles(): Promise<Role[]> {
    return this.get('access/roles');
  }

  public createRole(input: SaveRoleRequest): Promise<Role> {
    return this.send('access/roles', 'POST', input);
  }

  public updateRole(key: string, input: SaveRoleRequest): Promise<Role> {
    return this.send(`access/roles/${id(key)}`, 'PATCH', input);
  }

  public deleteRole(key: string): Promise<void> {
    return this.send(`access/roles/${id(key)}`, 'DELETE');
  }

  /** The listed members, and `meta.systemAdministratorCount` for the system administrators not among them. */
  public async members(): Promise<{
    readonly members: MemberWithRoles[];
    readonly meta: MembersListMeta;
  }> {
    const { data, meta } = await this.api.request<{
      readonly data: MemberWithRoles[];
      readonly meta: MembersListMeta;
    }>({ path: 'access/members' });
    return { members: data, meta };
  }

  public replaceMemberRoles(
    userId: string,
    roles: readonly string[],
  ): Promise<MemberWithRoles> {
    return this.send(`access/members/${id(userId)}`, 'PATCH', { roles });
  }

  public settings(): Promise<AccessSettings> {
    return this.get('access/settings');
  }

  public updateSettings(input: AccessSettings): Promise<AccessSettings> {
    return this.send('access/settings', 'PUT', input);
  }

  /** `GET /api/knowledgeSearch`: how the knowledge base is searched (`studio.knowledgeSearch` read). */
  public knowledgeSearch(): Promise<KnowledgeSearchConfig> {
    return this.get('knowledgeSearch');
  }

  public updateKnowledgeSearch(
    input: KnowledgeSearchSettings,
  ): Promise<KnowledgeSearchConfig> {
    return this.send('knowledgeSearch', 'PUT', input);
  }

  private async get<T>(path: string): Promise<T> {
    const { data } = await this.api.request<{ readonly data: T }>({ path });
    return data;
  }

  private async send<T = void>(
    path: string,
    method: Method,
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

export function useStudioApi(): StudioApi {
  const api = useApiClient();
  return useMemo(() => new StudioApi(api), [api]);
}
