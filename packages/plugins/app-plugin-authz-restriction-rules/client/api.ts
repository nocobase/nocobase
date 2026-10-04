import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';
import type {
  AuthorizationSubject,
  AuthorizationRecordOption,
  RecordSelection,
} from '@nocobase/app-plugin-authorization/client/management';
export interface RestrictionRule {
  key: string;
  title?: string | { key: string; ns: string };
  resource: { type: string; id: string };
  actions: readonly {
    action: string;
    scopeKey?: string;
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

class RestrictionRulesClient {
  constructor(private readonly api: ApiClient) {}
  listRestrictionRules(): Promise<readonly RestrictionRule[]> {
    return this.get<readonly RestrictionRule[]>(
      'authorization/restrictionRules',
    );
  }
  listRestrictionRecords(
    collection: string,
  ): Promise<readonly AuthorizationRecordOption[]> {
    return this.get<readonly AuthorizationRecordOption[]>(
      `authorization/restrictionRules/records/${encodeURIComponent(collection)}`,
      RECORD_PAGE,
    );
  }
  createRestrictionRule(rule: RestrictionRule): Promise<RestrictionRule> {
    return this.send<RestrictionRule>(
      'authorization/restrictionRules',
      'POST',
      rule,
    );
  }
  updateRestrictionRule(
    key: string,
    rule: RestrictionRule,
  ): Promise<RestrictionRule> {
    return this.send<RestrictionRule>(
      `authorization/restrictionRules/${encodeURIComponent(key)}`,
      'PATCH',
      rule,
    );
  }
  async deleteRestrictionRule(key: string): Promise<void> {
    await this.api.request({
      path: `authorization/restrictionRules/${encodeURIComponent(key)}`,
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
export function useRestrictionRulesClient(): RestrictionRulesClient {
  const api = useApiClient();
  return useMemo(() => new RestrictionRulesClient(api), [api]);
}
