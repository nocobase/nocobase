import type { ApiClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import {
  fetchUsageBreakdown,
  fetchUsageFilterOptions,
  fetchUsageSeries,
  fetchUsageSummary,
  type UsageQuery,
} from '../client/usage-statistics-service.js';

// What the routes answer: every time an RFC 3339 string.
const WIRE_BODY = {
  range: {
    start: '1970-01-01T00:00:01.000Z',
    end: '1970-01-01T00:00:02.000Z',
    timezoneOffsetHours: 8,
  },
  previousRange: {
    start: '1970-01-01T00:00:00.000Z',
    end: '1970-01-01T00:00:00.999Z',
  },
  buckets: [{ start: '1970-01-01T00:00:01.000Z', totalTokens: 3 }],
};

function createApi(): {
  api: ApiClient;
  request: ReturnType<typeof vi.fn>;
} {
  const request = vi.fn().mockResolvedValue({ data: WIRE_BODY });
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
          path: `aiEmployee/usage/${action}`,
          method: 'GET',
          query: {
            start: '1970-01-01T00:00:01.000Z',
            end: '1970-01-01T00:00:02.000Z',
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
      start: '1970-01-01T00:00:00.001Z',
      end: '1970-01-01T00:00:00.002Z',
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

  it('sends the dimension and the number of top rows of a breakdown', async () => {
    const { api, request } = createApi();
    await fetchUsageBreakdown(api, { ...query, dimension: 'userId', top: 5 });
    expect(request.mock.calls[0]?.[0].query).toMatchObject({
      dimension: 'userId',
      top: 5,
    });
  });

  it('reads the times of an answer back as epoch milliseconds', async () => {
    const summary = await fetchUsageSummary(createApi().api, query);
    expect(summary.range).toEqual({
      start: 1_000,
      end: 2_000,
      timezoneOffsetHours: 8,
    });
    expect(summary.previousRange).toEqual({ start: 0, end: 999 });
    const series = await fetchUsageSeries(createApi().api, query);
    expect(series.buckets).toEqual([{ start: 1_000, totalTokens: 3 }]);
  });

  it('asks for filter options over the whole range, unfiltered', async () => {
    const { api, request } = createApi();
    await fetchUsageFilterOptions(api, query);
    expect(request.mock.calls[0]?.[0].query).toEqual({
      start: '1970-01-01T00:00:01.000Z',
      end: '1970-01-01T00:00:02.000Z',
      timezoneOffset: 480,
    });
  });
});
