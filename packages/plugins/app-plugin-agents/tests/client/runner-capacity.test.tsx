// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import {
  RunnerStatusCell,
  RunnerToolsCell,
  RunnerVersionCell,
} from '../../client/pages/runtimes/runner-cells.js';
import type { RunnerSummary } from '../../shared/runners.js';
import { runner } from './fixtures.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe.each([
  {
    locale: 'en-US',
    online: 'Online',
    offline: 'Offline',
    ago: '2 days ago',
    upgrade: 'Upgradable',
    runs: 'Runs',
  },
  {
    locale: 'zh-CN',
    online: '在线',
    offline: '离线',
    ago: '前天',
    upgrade: '可升级',
    runs: '并发',
  },
])(
  '$locale runtime status',
  ({ locale, online, offline, ago, upgrade, runs }) => {
    async function show(
      overrides: Partial<RunnerSummary>,
      withVersion = false,
    ) {
      const runtime = await createTestI18nRuntime({
        locale,
        namespaces: { '@nocobase/app-plugin-agents': locales },
      });
      const value = runner('capacity', {
        tools: [
          { kind: 'claude', authenticated: true },
          { kind: 'codex', authenticated: true },
        ],
        ...overrides,
      });
      return render(
        <TestI18nProvider
          runtime={runtime}
          namespace='@nocobase/app-plugin-agents'
        >
          <div data-testid='status'>
            <RunnerStatusCell runner={value} />
          </div>
          <div data-testid='tools'>
            <RunnerToolsCell runner={value} />
          </div>
          {withVersion ? <RunnerVersionCell runner={value} /> : null}
        </TestI18nProvider>,
      );
    }

    it('shows only online concurrency without configured tool limits, even with tool activity', async () => {
      await show({
        slots: 10,
        reportedSlots: 6,
        activeRuns: 1,
        activeJobs: 1,
        activeByTool: { codex: 1 },
      });
      expect(screen.getByTestId('status').textContent).toBe(`${online} 2/10`);
      expect(screen.queryByTestId(/^tool-concurrency-/u)).toBeNull();
    });

    it('uses configured total and per-tool limits instead of heartbeat capacity, each limit beside its tool', async () => {
      await show({
        slots: 10,
        reportedSlots: 6,
        activeRuns: 3,
        activeByTool: { codex: 1, claude: 2 },
        toolSlots: { codex: 10, claude: 2 },
        toolLoad: {
          codex: { slots: 4, free: 3 },
          claude: { slots: 6, free: 4 },
        },
      });
      expect(screen.getByTestId('status').textContent).toBe(`${online} 3/10`);
      expect(
        within(screen.getByTestId('tools'))
          .getAllByTestId(/^tool-concurrency-/u)
          .map((item) => item.textContent),
      ).toEqual([`${runs} 2/2`, `${runs} 1/10`]);
    });

    it('shows only configured tools and clips their limits to total concurrency', async () => {
      await show({
        slots: 8,
        toolSlots: { codex: 20 },
        activeByTool: { claude: 1 },
      });
      expect(
        within(screen.getByTestId('tools'))
          .getAllByTestId(/^tool-concurrency-/u)
          .map((item) => [item.dataset.testid, item.textContent]),
      ).toEqual([['tool-concurrency-codex', `${runs} 0/8`]]);
    });

    it('keeps a full runtime online', async () => {
      await show({ slots: 2, activeRuns: 1, activeJobs: 1 });
      expect(screen.getByTestId('status').textContent).toBe(`${online} 2/2`);
    });

    it.each([undefined, 'legacyLocal'] as const)(
      'keeps an old runner upgrade hint in the version cell only (%s)',
      async (capacitySource) => {
        await show(
          {
            slots: 10,
            reportedSlots: undefined,
            capacitySource,
            toolLoad: undefined,
            toolSlots: { codex: 10 },
            activeRuns: 1,
            activeByTool: { codex: 1 },
            updateVersion: '0.2.0',
          },
          true,
        );
        expect(screen.getByTestId('status').textContent).toBe(`${online} 1/10`);
        expect(screen.getByTestId('tool-concurrency-codex').textContent).toBe(
          `${runs} 1/10`,
        );
        expect(screen.getByText(upgrade)).toBeInTheDocument();
      },
    );

    it('shows offline time without capacity diagnostics', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-24T01:00:00.000Z'));
      await show({
        status: 'offline',
        slots: 10,
        reportedSlots: 6,
        capacityReportedAt: '2026-10-22T00:00:00.000Z',
        lastSeenAt: '2026-10-22T01:00:00.000Z',
      });
      expect(screen.getByTestId('status').textContent).toBe(
        `${offline} · ${ago}`,
      );
    });

    it('shows offline without a placeholder when it has never connected', async () => {
      await show({ status: 'offline', lastSeenAt: null });
      expect(screen.getByTestId('status').textContent).toBe(offline);
    });
  },
);
