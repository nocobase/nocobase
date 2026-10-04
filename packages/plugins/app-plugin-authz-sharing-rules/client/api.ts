import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';
import type {
  AuthorizationSubject,
  AuthorizationRecordOption,
  RecordSelection,
} from '@nocobase/app-plugin-authorization/client/management';
export interface SharingRule {
  key: string;
  title?: string | { key: string; ns: string };
  resource: { type: string; id: string };
  actions: readonly {
    action: string;
    scopeKey?: string;
    /** Never `all`: sharing adds specific records. */
    selection: RecordSelection;
  }[];
  subjects: readonly AuthorizationSubject[];
  reason?: string;
}
/**
 * The records a picker offers: the first page at the largest size the endpoint allows. The endpoint pages, and
 * `meta.total` says how many there are in all.
 */
const RECORD_PAGE = { pageSize: 100 } as const;

class SharingRulesClient {
  constructor(private readonly api: ApiClient) {}
  listSharingRules(): Promise<readonly SharingRule[]> {
    return this.get<readonly SharingRule[]>('authorization/sharingRules');
  }
  listSharingRecords(
    collection: string,
  ): Promise<readonly AuthorizationRecordOption[]> {
    return this.get<readonly AuthorizationRecordOption[]>(
      `authorization/sharingRules/records/${encodeURIComponent(collection)}`,
      RECORD_PAGE,
    );
  }
  createSharingRule(rule: SharingRule): Promise<SharingRule> {
    return this.send<SharingRule>('authorization/sharingRules', 'POST', rule);
  }
  updateSharingRule(key: string, rule: SharingRule): Promise<SharingRule> {
    return this.send<SharingRule>(
      `authorization/sharingRules/${encodeURIComponent(key)}`,
      'PATCH',
      rule,
    );
  }
  async deleteSharingRule(key: string): Promise<void> {
    await this.api.request({
      path: `authorization/sharingRules/${encodeURIComponent(key)}`,
      method: 'DELETE',
    });
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
export function useSharingRulesClient(): SharingRulesClient {
  const api = useApiClient();
  return useMemo(() => new SharingRulesClient(api), [api]);
}
