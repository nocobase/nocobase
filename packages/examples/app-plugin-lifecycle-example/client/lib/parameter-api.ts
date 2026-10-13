import type { ApiClient } from '@nocobase/app-client';
import type { JsonObject } from '@nocobase/lifecycle';
import type {
  ParameterGroupView,
  ParameterHistoryView,
  ReviewerOptions,
} from '../../shared/parameter-configuration.js';
import { LIFECYCLE_ROUTES } from '../../shared/routes.js';

export interface ParameterApi {
  list(): Promise<readonly ParameterGroupView[]>;
  read(key: string): Promise<ParameterGroupView>;
  save(
    key: string,
    values: JsonObject,
    expectedRevision: number,
    requestId: string,
  ): Promise<ParameterGroupView>;
  options(): Promise<ReviewerOptions>;
  candidates(
    values: JsonObject,
    applicantId: string,
  ): Promise<readonly string[]>;
  history(lifecycle: string, recordId: string): Promise<ParameterHistoryView>;
}
export function parameterApi(client: ApiClient, actor: string): ParameterApi {
  const get = async <T>(path: string): Promise<T> =>
    (
      await client.request<{ data: T }>({
        path: `${LIFECYCLE_ROUTES}/${path}`,
        query: { actAs: actor },
      })
    ).data;
  const post = async <T>(
    path: string,
    body: unknown,
    method: 'PUT' | 'POST' = 'POST',
  ): Promise<T> =>
    (
      await client.request<{ data: T }>({
        method,
        path: `${LIFECYCLE_ROUTES}/${path}`,
        query: { actAs: actor },
        json: body,
      })
    ).data;
  return {
    list: () => get('parameterGroups'),
    read: (key) => get(`parameterGroups/${encodeURIComponent(key)}`),
    save: (key, values, expectedRevision, requestId) =>
      post(
        `parameterGroups/${encodeURIComponent(key)}`,
        { values, expectedRevision, requestId },
        'PUT',
      ),
    options: () => get('parameterGroups/financeReviewers/options'),
    candidates: (values, applicantId) =>
      post('parameterGroups/financeReviewers/previewCandidates', {
        values,
        applicantId,
      }),
    history: (name, id) =>
      get(
        `parameterHistory/${encodeURIComponent(name)}/${encodeURIComponent(id)}`,
      ),
  };
}
