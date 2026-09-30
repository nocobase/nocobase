/** @vitest-environment jsdom */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UsageStatisticsSettingsPage from '../client/pages/usage-statistics-settings-page.js';
import { usageAxisMax } from '../client/pages/usage/trend-chart.js';
import type {
  UsageBreakdown,
  UsageSeries,
  UsageSummary,
  UsageTotals,
} from '../client/usage-statistics-service.js';

const mocks = vi.hoisted(() => ({
  summary: vi.fn(),
  series: vi.fn(),
  breakdown: vi.fn(),
  filterOptions: vi.fn(),
}));

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ i18n: { resolvedLanguage: 'en-US' } }),
}));
vi.mock('../client/locales/index.js', () => ({
  useT: () => (key: string) => key,
}));
vi.mock('../client/ai-employee-client.js', () => {
  const client = {
    fetchUsageSummary: mocks.summary,
    fetchUsageSeries: mocks.series,
    fetchUsageBreakdown: mocks.breakdown,
    fetchUsageFilterOptions: mocks.filterOptions,
  };
  return { useAIEmployeeClient: () => client };
});

const range = { start: 1, end: 2, timezoneOffsetHours: 8 };

function totals(overrides: Partial<UsageTotals> = {}): UsageTotals {
  return {
    eventCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cachedTokens: 0,
    reasoningTokens: 0,
    toolCallCount: 0,
    autoToolCallCount: 0,
    ...overrides,
  };
}

const summary: UsageSummary = {
  range,
  totals: totals({
    eventCount: 12,
    inputTokens: 9000,
    outputTokens: 1000,
    totalTokens: 10_000,
  }),
  previous: totals({ eventCount: 6, totalTokens: 8000 }),
  previousRange: { start: 0, end: 1 },
};

const series: UsageSeries = {
  range,
  granularity: 'day',
  buckets: [
    {
      start: Date.parse('2026-09-20T00:00:00Z'),
      ...totals({ inputTokens: 4000, outputTokens: 400, cachedTokens: 1200 }),
    },
    {
      start: Date.parse('2026-09-21T00:00:00Z'),
      ...totals({ inputTokens: 5000, outputTokens: 600, cachedTokens: 2500 }),
    },
  ],
};

const breakdown: UsageBreakdown = {
  range,
  dimension: 'model',
  rows: [
    {
      key: 'gpt-5.2',
      label: 'gpt-5.2',
      ...totals({
        totalTokens: 7500,
        inputTokens: 7000,
        outputTokens: 500,
        cachedTokens: 3100,
        eventCount: 8,
      }),
    },
    {
      key: 'claude-opus-5',
      label: 'claude-opus-5',
      ...totals({
        totalTokens: 2500,
        inputTokens: 2000,
        outputTokens: 500,
        cachedTokens: 600,
        eventCount: 4,
      }),
    },
  ],
  totals: summary.totals,
};

function renderPage(search = '') {
  const router = createMemoryRouter(
    [{ path: '/settings/ai/usage', element: <UsageStatisticsSettingsPage /> }],
    { initialEntries: [`/settings/ai/usage${search}`] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.summary.mockResolvedValue(summary);
  mocks.series.mockResolvedValue(series);
  mocks.breakdown.mockResolvedValue(breakdown);
  mocks.filterOptions.mockResolvedValue({
    range,
    models: [{ value: 'gpt-5.2', label: 'gpt-5.2' }],
    aiEmployees: [{ value: 'nathan', label: 'Nathan' }],
  });
});

describe('usage statistics page', () => {
  it('shows the range totals, the trend and the breakdown', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Usage statistics' }),
    ).toBeInTheDocument();
    const metrics = within(
      await screen.findByRole('region', { name: 'usage.summary' }),
    );
    expect(metrics.getByText('10,000')).toBeInTheDocument();
    expect(metrics.getByText('9,000')).toBeInTheDocument();
    // 10,000 against a previous period of 8,000.
    expect(metrics.getByText('+25%')).toBeInTheDocument();
    expect(
      metrics.getAllByText('usage.vsPreviousPeriod').length,
    ).toBeGreaterThan(0);
    // Counters the previous period never recorded have nothing to compare to.
    expect(metrics.getAllByText('usage.noComparison').length).toBeGreaterThan(
      0,
    );

    // Cached tokens are part of the input tokens, so the input stack carries
    // the uncached remainder plus the cached part and still totals the input.
    const trend = await screen.findByRole('table', { name: 'usage.trend' });
    expect(
      within(trend)
        .getAllByRole('row')
        .slice(1)
        .map((row) =>
          within(row)
            .getAllByRole('cell')
            .map((cell) => cell.textContent),
        ),
    ).toEqual([
      ['2,800', '1,200', '400'],
      ['2,500', '2,500', '600'],
    ]);

    const table = await screen.findByRole('table', { name: 'usage.breakdown' });
    const rows = within(table).getAllByRole('row');
    expect(
      within(rows[0] as HTMLElement)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual([
      'usage.model',
      'usage.totalTokens',
      'usage.share',
      'usage.inputTokens',
      'usage.cachedTokens',
      'usage.outputTokens',
      'usage.llmCalls',
    ]);
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['gpt-5.2', '7,500', '75%', '7,000', '3,100', '500', '8']);
  });

  it('labels every filter and offers the dimensions as tabs', async () => {
    renderPage();

    const filters = within(
      screen.getByRole('search', { name: 'usage.filters' }),
    );
    expect(filters.getByLabelText('usage.range')).toHaveTextContent(
      'usage.last7Days',
    );
    expect(filters.getByLabelText('usage.aiEmployee')).toHaveAttribute(
      'placeholder',
      'usage.allAiEmployees',
    );
    expect(filters.getByLabelText('usage.model')).toHaveAttribute(
      'placeholder',
      'usage.allModels',
    );
    const tabs = within(
      await screen.findByRole('tablist', { name: 'usage.breakdownBy' }),
    );
    expect(tabs.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'usage.model',
      'usage.aiEmployee',
      'usage.user',
    ]);
    expect(tabs.getByRole('tab', { name: 'usage.model' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('reads the range and dimension from the URL and passes filters to the API', async () => {
    renderPage('?range=30d&by=userId&model=gpt-5.2&employee=nathan');

    await waitFor(() => expect(mocks.breakdown).toHaveBeenCalled());
    expect(mocks.summary.mock.calls.at(-1)?.[0]).toMatchObject({
      model: 'gpt-5.2',
      aiEmployeeUsername: 'nathan',
      // The 30-day preset compares against the 30 days before it.
      compareShiftHours: 30 * 24,
    });
    expect(mocks.breakdown.mock.calls.at(-1)?.[0]).toMatchObject({
      dimension: 'userId',
    });
    expect(await screen.findByDisplayValue('Nathan')).toBeInTheDocument();
  });

  it('compares today against the same hours yesterday', async () => {
    renderPage('?range=today');
    await waitFor(() => expect(mocks.summary).toHaveBeenCalled());
    expect(mocks.summary.mock.calls.at(-1)?.[0]).toMatchObject({
      compareShiftHours: 24,
    });
  });

  it('switches the breakdown dimension through the URL', async () => {
    const router = renderPage();
    await waitFor(() => expect(mocks.breakdown).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByRole('tab', { name: 'usage.user' }));

    await waitFor(() => expect(mocks.breakdown).toHaveBeenCalledTimes(2));
    expect(mocks.breakdown.mock.calls.at(-1)?.[0]).toMatchObject({
      dimension: 'userId',
    });
    expect(router.state.location.search).toBe('?by=userId');
  });

  it('reports an empty range instead of an empty chart', async () => {
    mocks.summary.mockResolvedValue({
      ...summary,
      totals: totals(),
      previous: totals(),
    });
    mocks.breakdown.mockResolvedValue({ ...breakdown, rows: [] });
    renderPage();

    expect(await screen.findByRole('status')).toHaveTextContent('usage.empty');
    expect(
      screen.queryByRole('table', { name: 'usage.trend' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'usage.breakdown' }),
    ).not.toBeInTheDocument();
  });

  it('surfaces a failed load and retries it', async () => {
    mocks.summary.mockRejectedValueOnce(new Error('Boom'));
    renderPage();

    const alert = await screen.findByText('usage.error');
    expect(mocks.summary).toHaveBeenCalledTimes(1);
    fireEvent.click(
      within(alert.parentElement as HTMLElement).getByRole('button', {
        name: 'Retry',
      }),
    );

    await waitFor(() => expect(mocks.summary).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole('region', { name: 'usage.summary' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('usage.error')).not.toBeInTheDocument();
  });
});

describe('usageAxisMax', () => {
  it.each([
    [0, 4],
    [3, 4],
    [9000, 10_000],
    [10_001, 20_000],
    [4100, 8000],
    [123_456, 200_000],
  ])('rounds %d up to %d', (value, expected) => {
    expect(usageAxisMax(value)).toBe(expected);
  });
});
