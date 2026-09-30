import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import {
  fetchUsageBreakdown,
  fetchUsageFilterOptions,
  fetchUsageSeries,
  fetchUsageSummary,
  type UsageQuery,
} from '../client/usage-statistics-service.js';

function createApi(): {
  api: ApiClient;
  request: ReturnType<typeof vi.fn>;
} {
  const request = vi.fn().mockResolvedValue({});
  return { api: { request } as unknown as ApiClient, request };
}

const query: UsageQuery = {
  start: 1_000,
  end: 2_000,
  timezoneOffset: 480,
  model: 'gpt-5.2',
  aiEmployeeUsername: 'nathan',
};

describe('usage statistics client requests', () => {
  it('sends the range, timezone and filters to each aggregate action', async () => {
    for (const [fetcher, action] of [
      [fetchUsageSummary, 'summary'],
      [fetchUsageSeries, 'series'],
    ] as const) {
      const { api, request } = createApi();
      await fetcher(api, query);
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: `ai/aiUsage:${action}`,
          method: 'GET',
          query: {
            start: 1_000,
            end: 2_000,
            timezoneOffset: 480,
            model: 'gpt-5.2',
            aiEmployeeUsername: 'nathan',
          },
        }),
      );
    }
  });

  it('omits filters that are not selected', async () => {
    const { api, request } = createApi();
    await fetchUsageSummary(api, { start: 1, end: 2, timezoneOffset: 0 });
    expect(request.mock.calls[0]?.[0].query).toEqual({
      start: 1,
      end: 2,
      timezoneOffset: 0,
    });
  });

  it('forwards a comparison shift only when one is given', async () => {
    const withShift = createApi();
    await fetchUsageSummary(withShift.api, {
      ...query,
      compareShiftHours: 168,
    });
    expect(withShift.request.mock.calls[0]?.[0].query).toMatchObject({
      compareShiftHours: 168,
    });

    const withoutShift = createApi();
    await fetchUsageSummary(withoutShift.api, query);
    expect(withoutShift.request.mock.calls[0]?.[0].query).not.toHaveProperty(
      'compareShiftHours',
    );
  });

  it('sends the dimension and limit of a breakdown', async () => {
    const { api, request } = createApi();
    await fetchUsageBreakdown(api, { ...query, dimension: 'userId', limit: 5 });
    expect(request.mock.calls[0]?.[0].query).toMatchObject({
      dimension: 'userId',
      limit: 5,
    });
  });

  it('asks for filter options over the whole range, unfiltered', async () => {
    const { api, request } = createApi();
    await fetchUsageFilterOptions(api, query);
    expect(request.mock.calls[0]?.[0].query).toEqual({
      start: 1_000,
      end: 2_000,
      timezoneOffset: 480,
    });
  });
});
