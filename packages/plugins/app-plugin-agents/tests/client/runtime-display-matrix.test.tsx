// @vitest-environment jsdom
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { runner } from './fixtures.js';
import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
const { RunnerStatusCell, RunnerVersionCell } =
  await import('../../client/pages/runtimes/runner-cells.js');
const { RunnerOverview } =
  await import('../../client/pages/runtimes/runner-overview.js');
afterEach(cleanup);

for (const locale of ['en-US', 'zh-CN']) {
  it(`runtime-display-matrix: configured capacity and detail differences (${locale})`, async () => {
    const namespace = '@nocobase/app-plugin-agents';
    const runtime = await createTestI18nRuntime({
      namespaces: { [namespace]: locales },
    });
    await runtime.changeLanguage(locale);
    const data = runner('configured', {
      slots: 2,
      reportedSlots: 10,
      activeRuns: 1,
      activeJobs: 1,
      toolSlots: { claude: 5 },
      activeByTool: { claude: 1 },
      tools: [
        { kind: 'claude', authenticated: true },
        { kind: 'codex', authenticated: true },
      ],
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrap = (children: React.ReactNode) => (
      <TestI18nProvider runtime={runtime} namespace={namespace}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </TestI18nProvider>
    );
    const view = render(
      wrap(
        <>
          <section aria-label='list'>
            <RunnerStatusCell runner={data} />
            <RunnerVersionCell
              runner={{ ...data, updateVersion: 'test-newer' }}
            />
          </section>
          <section aria-label='detail'>
            <RunnerOverview
              runner={data}
              editable={false}
              now={Date.now()}
              onSave={vi.fn()}
            />
          </section>
        </>,
      ),
    );
    const list = screen.getByRole('region', { name: 'list' });
    expect(
      within(list).getByText(locale === 'en-US' ? 'Online 2/2' : '在线 2/2'),
    ).toBeVisible();
    expect(within(list).getByText('Claude Code 1/2')).toBeVisible();
    expect(within(list).queryByText(/Codex.*\d\/\d/u)).toBeNull();
    expect(within(list).getByRole('button')).toBeVisible();
    // The owner accepted deferring this difference: detail edits the raw configured limit, rather than the effective list cap.
    const detail = screen.getByRole('region', { name: 'detail' });
    expect(detail.querySelector('#ag-runner-tool-slots-claude')).toHaveValue(
      '5',
    );
    expect(detail.querySelector('#ag-runner-tool-slots-codex')).toHaveValue('');
    view.rerender(
      wrap(
        <RunnerStatusCell
          runner={{
            ...data,
            status: 'offline',
            lastSeenAt: new Date(Date.now() - 60_000).toISOString(),
          }}
        />,
      ),
    );
    expect(
      screen.getByText(locale === 'en-US' ? /Offline ·/u : /离线 ·/u),
    ).toBeVisible();
    view.rerender(
      wrap(
        <RunnerStatusCell
          runner={{ ...data, toolSlots: null, activeRuns: 0, activeJobs: 0 }}
        />,
      ),
    );
    expect(
      screen.getByText(locale === 'en-US' ? 'Online 0/2' : '在线 0/2'),
    ).toBeVisible();
    expect(screen.queryByRole('list')).toBeNull();
    client.clear();
  });
}
