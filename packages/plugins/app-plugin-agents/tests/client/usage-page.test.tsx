// @vitest-environment jsdom
/** The Usage page: one toolbar with the grouping as a select, and the daily chart above the table. */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UsageReport, UsageRow } from '../../shared/reports.js';
import { callsTo, clientMocks, resetApi } from './fake-client.js';
import { renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

globalThis.ResizeObserver ??= class {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
} as unknown as typeof ResizeObserver;

const { default: UsagePage } =
  await import('../../client/pages/usage/index.js');
const { presetRange } = await import('../../client/pages/usage/model.js');

const DAY = '2026-10-01';

function row(key: string, extra: Partial<UsageRow> = {}): UsageRow {
  return {
    key,
    name: key.toUpperCase(),
    runs: 1,
    durationMs: 1000,
    inputTokens: 100,
    outputTokens: 10,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    cost: { USD: 1 },
    pricedRuns: 1,
    ...extra,
  };
}

function report(groupBy: UsageReport['groupBy']): UsageReport {
  return {
    from: DAY,
    to: DAY,
    groupBy,
    rows: [row('a1')],
    totals: row('total'),
    daily: [
      {
        day: DAY,
        inputTokens: 100,
        outputTokens: 10,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        cost: { USD: 1 },
      },
    ],
    unpricedModels: [],
  };
}

const usageCalls = () =>
  callsTo('GET', 'agents/usage').filter(
    (call) => call.query.groupBy !== 'group',
  );

describe('Agent team › Usage', () => {
  beforeEach(() => {
    resetApi({
      'agents/usage': (request) =>
        report(request.query.groupBy as UsageReport['groupBy']),
      'agents/usage/models': () => ({ from: DAY, to: DAY, rows: [] }),
      'agents/vocabulary': () => ({ subjects: [], sources: [], scopes: [] }),
      agents: () => [],
      'agents/users': () => [],
    });
  });

  it('sums by agent by default, with the day by agent for the chart', async () => {
    renderRoute(<UsagePage />, '/usage', '/usage');
    expect(await screen.findByText('usage.chart.title')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'A1' })).toBeVisible();
    expect(usageCalls()[0]?.query).toMatchObject({
      groupBy: 'agent',
      series: true,
    });
    expect(
      screen.getByRole('combobox', { name: 'usage.groupBy' }),
    ).toHaveTextContent('usage.groupByValue(group=usage.groups.agent)');
    expect(
      screen.queryByRole('tab', { name: 'usage.groups.model' }),
    ).toBeNull();
  });

  it('reads the report again on Refresh', async () => {
    renderRoute(<UsagePage />, '/usage', '/usage');
    expect(await screen.findByRole('link', { name: 'A1' })).toBeVisible();
    const before = usageCalls().length;
    await userEvent.click(
      screen.getByRole('button', { name: 'common.refresh' }),
    );
    await waitFor(() => expect(usageCalls().length).toBeGreaterThan(before));
  });

  it('picks the range from a calendar with presets, keeping it in the URL', async () => {
    renderRoute(
      <UsagePage />,
      '/usage',
      '/usage?from=2026-09-06&to=2026-10-05',
    );
    const trigger = await screen.findByRole('button', {
      name: 'usage.filters.range',
    });
    expect(trigger).toHaveTextContent('Sep 6, 2026 – Oct 5');
    expect(document.querySelector('input[type="date"]')).toBeNull();
    await userEvent.click(trigger);
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'usage.presets.last7' }),
    );
    const week = presetRange('last7');
    await waitFor(() => expect(usageCalls().at(-1)?.query).toMatchObject(week));
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('takes a range from two days picked in either order', async () => {
    renderRoute(
      <UsagePage />,
      '/usage',
      '/usage?from=2026-09-06&to=2026-10-05',
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'usage.filters.range' }),
    );
    await screen.findByRole('grid');
    const day = (label: string) =>
      document.querySelector<HTMLElement>(`[data-day="${label}"]`)!;
    await userEvent.click(day('10/3/2026'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await userEvent.click(day('10/1/2026'));
    await waitFor(() =>
      expect(usageCalls().at(-1)?.query).toMatchObject({
        from: '2026-10-01',
        to: '2026-10-03',
      }),
    );
  });

  it('shows "—" for a duration with none', async () => {
    resetApi({
      'agents/usage': () => ({
        ...report('agent'),
        totals: row('total', { durationMs: 0 }),
      }),
      'agents/usage/models': () => ({ from: DAY, to: DAY, rows: [] }),
      'agents/vocabulary': () => ({ subjects: [], sources: [], scopes: [] }),
      agents: () => [],
      'agents/users': () => [],
    });
    renderRoute(<UsagePage />, '/usage', '/usage');
    const total = await screen.findByText('usage.total');
    const cells = total.closest('tr')!.querySelectorAll('td');
    expect(cells[2]).toHaveTextContent('—');
  });

  it('changes the grouping from the select, keeping it in the URL', async () => {
    renderRoute(<UsagePage />, '/usage', '/usage');
    await userEvent.click(
      await screen.findByRole('combobox', { name: 'usage.groupBy' }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'usage.groups.person' }),
    );
    await waitFor(() =>
      expect(usageCalls().at(-1)?.query).toMatchObject({ groupBy: 'person' }),
    );
    // Only agents and models are stacked; the other groupings chart the day's total.
    expect(usageCalls().at(-1)?.query).not.toHaveProperty('series');
  });
});
