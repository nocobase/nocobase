// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import { RunnerStatusCell } from '../../client/pages/runtimes/runner-cells.js';
import type { RunnerSummary } from '../../shared/runners.js';
import { runner } from './fixtures.js';

async function show(overrides: Partial<RunnerSummary>) {
  const runtime = await createTestI18nRuntime({
    namespaces: { '@nocobase/app-plugin-agents': enUS },
  });
  return render(
    <TestI18nProvider runtime={runtime} namespace='@nocobase/app-plugin-agents'>
      <RunnerStatusCell runner={runner('capacity', overrides)} />
    </TestI18nProvider>,
  );
}

it('shows the reported total and tool limits while an online edit awaits confirmation', async () => {
  await show({
    slots: 8,
    reportedSlots: 6,
    activeRuns: 6,
    activeByTool: { claude: 6 },
    toolSlots: { claude: 8 },
    toolLoad: { claude: { slots: 6, free: 0 } },
  });
  expect(screen.getByText('Busy 6/6')).toBeInTheDocument();
  expect(screen.getByText('Claude Code 6/6')).toBeInTheDocument();
  expect(
    screen.getByText('Waiting for runner to sync online settings'),
  ).toBeInTheDocument();
});

it('compares clipped online tool limits with the applied report', async () => {
  await show({
    slots: 8,
    reportedSlots: 8,
    toolSlots: { claude: 20 },
    toolLoad: { claude: { slots: 8, free: 8 } },
  });
  expect(screen.getByText('Claude Code 0/8')).toBeInTheDocument();
  expect(
    screen.getByText('Effective slots · online settings'),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('Waiting for runner to sync online settings'),
  ).toBeNull();
});

it('identifies a legacy local allowance', async () => {
  await show({ slots: 8, reportedSlots: 6, capacitySource: 'legacyLocal' });
  expect(screen.getByText('Online 0/6')).toBeInTheDocument();
  expect(
    screen.getByText('Legacy local slots · upgrade the application server'),
  ).toBeInTheDocument();
});

it('keeps unreported capacity unknown', async () => {
  await show({ slots: 8, reportedSlots: undefined, capacitySource: undefined });
  expect(screen.getByText('Online 0/?')).toBeInTheDocument();
  expect(
    screen.getByText('Sync status unavailable · upgrade the runner'),
  ).toBeInTheDocument();
});

it('labels offline capacity with the actual heartbeat timestamp', async () => {
  await show({
    status: 'offline',
    slots: 8,
    reportedSlots: 6,
    capacityReportedAt: '2026-10-22T00:00:00.000Z',
    lastSeenAt: '2026-10-22T01:00:00.000Z',
  });
  expect(screen.getByText('Last effective slots: 6')).toBeInTheDocument();
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  expect(screen.getByText(/^Last reported:/)).toHaveTextContent(
    date.format(new Date('2026-10-22T00:00:00.000Z')),
  );
  expect(screen.getByText(/^Last reported:/)).not.toHaveTextContent(
    date.format(new Date('2026-10-22T01:00:00.000Z')),
  );
});
