import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';
import type {
  AuthorizationRecordOption,
  RecordSelection,
} from '@nocobase/app-plugin-authorization/client/management';
export interface DefaultAccessRule {
  key: string;
  resource: { type: string; id: string };
  actions: readonly {
    action: string;
    scopeKey?: string;
    selection: RecordSelection;
  }[];
}
/**
 * The records a picker offers: the first page at the largest size the endpoint allows. The endpoint pages, and
 * `meta.total` says how many there are in all.
 */
const RECORD_PAGE = { pageSize: 100 } as const;

class DefaultAccessClient {
  constructor(private readonly api: ApiClient) {}
  listDefaultAccess(): Promise<readonly DefaultAccessRule[]> {
    return this.get<readonly DefaultAccessRule[]>(
      'authorization/defaultAccess',
    );
  }
  createDefaultAccess(rule: DefaultAccessRule): Promise<DefaultAccessRule> {
    return this.send<DefaultAccessRule>(
      'authorization/defaultAccess',
      'POST',
      rule,
    );
  }
  updateDefaultAccess(
    key: string,
    rule: DefaultAccessRule,
  ): Promise<DefaultAccessRule> {
    return this.send<DefaultAccessRule>(
      `authorization/defaultAccess/${encodeURIComponent(key)}`,
      'PATCH',
      rule,
    );
  }
  async deleteDefaultAccess(key: string): Promise<void> {
    await this.api.request({
      path: `authorization/defaultAccess/${encodeURIComponent(key)}`,
      method: 'DELETE',
    });
  }
  listDefaultAccessRecords(
    collection: string,
  ): Promise<readonly AuthorizationRecordOption[]> {
    return this.get<readonly AuthorizationRecordOption[]>(
      `authorization/defaultAccess/records/${encodeURIComponent(collection)}`,
      RECORD_PAGE,
    );
  }
  private get<T>(
    path: string,
    query?: Readonly<Record<string, string | number>>,
  ): Promise<T> {
    return this.api
      .request<{ data: T }>({ path, ...(query ? { query } : {}) })
      .then((response) => response.data);
  }
  private send<T>(
    path: string,
    method: 'POST' | 'PATCH',
    json: unknown,
  ): Promise<T> {
    return this.api
      .request<{ data: T }>({ path, method, json })
      .then((response) => response.data);
  }
}
export function useDefaultAccessClient(): DefaultAccessClient {
  const api = useApiClient();
  return useMemo(() => new DefaultAccessClient(api), [api]);
}
