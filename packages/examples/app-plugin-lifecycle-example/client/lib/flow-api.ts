import type { ApiClient } from '@nocobase/app-client';

import type { DurableFlow } from '../../shared/flows.js';
import { LIFECYCLE_ROUTES } from '../../shared/routes.js';
import type { Plain, RecordList } from './api.js';

/** Lists show at most this many records; the routes page by it. */
const PAGE_SIZE = 100;

/**
 * The durable flows' lists and forms. They name no persona: a person's step
 * in these flows is the signed-in user's, and who a record is for is a
 * field of it.
 */
export function flowApi(client: ApiClient): {
  list(flow: DurableFlow): Promise<RecordList>;
  create(flow: DurableFlow, values: Plain): Promise<Plain>;
} {
  return {
    list: async (flow) => {
      const { data, meta } = await client.request<{
        readonly data: readonly Plain[];
        readonly meta: {
          readonly parameters: Readonly<Record<string, unknown>>;
        };
      }>({
        path: `${LIFECYCLE_ROUTES}/${flow}`,
        query: { pageSize: String(PAGE_SIZE) },
      });
      return { records: data, parameters: meta.parameters };
    },
    create: async (flow, values) =>
      (
        await client.request<{ readonly data: Plain }>({
          method: 'POST',
          path: `${LIFECYCLE_ROUTES}/${flow}`,
          json: values,
        })
      ).data,
  };
}
