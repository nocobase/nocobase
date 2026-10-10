import agents from '@nocobase/app-plugin-agents/client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IssueRunTranscript } from '../../client/agents/issue-runs.js';
import type { RunTranscriptEvent } from '../../client/components/agent-run-history.js';
import locales from '../../client/locales/index.js';
import { mixedRunEvents } from '../fixtures/run-transcript.js';

const state = vi.hoisted(() => ({
  userId: 'alice' as string | undefined,
  basePath: '/main',
  events: [] as RunTranscriptEvent[],
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useClientApplication: () => ({ config: { get: () => state.basePath } }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authentication/client')
  >()),
  useAuthentication: () => ({
    session: state.userId ? { user: { id: state.userId } } : null,
  }),
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-projects/client/issues')
  >()),
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-agents/client/runs')
  >()),
  useAgentNames: () => () => 'Coder',
  useRetryRun: () => ({ isPending: false, mutate: vi.fn() }),
  useStopRun: () => ({ isPending: false, mutate: vi.fn() }),
  useRunWithTranscript: () => ({
    run: {
      data: {
        id: 'run-1',
        agentId: 'coder',
        status: 'failed',
        createdAt: '2026-10-01T00:00:00.000Z',
        startedAt: null,
        finishedAt: null,
        cancelRequestedAt: null,
        failureReason: 'toolProcess',
        failureDetail: 'The command failed',
        inputs: [],
        maxAttempts: 1,
        summary: 'Run summary',
      },
    },
    events: state.events,
    failed: false,
    trigger: 'Assigned',
  }),
}));

async function setup(locale = 'en-US') {
  const plugin = agents();
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'studio', resources: locales },
    namespaces: { [plugin.packageName]: plugin.locales! },
    locale,
    strict: true,
  });
  const view = () => (
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <MemoryRouter>
        <IssueRunTranscript runId='run-1' />
      </MemoryRouter>
    </TestI18nProvider>
  );
  const result = render(view());
  return { ...result, refresh: () => result.rerender(view()), runtime };
}

beforeEach(() => {
  window.localStorage.clear();
  state.userId = 'alice';
  state.basePath = '/main';
  state.events = mixedRunEvents();
});
afterEach(cleanup);

describe('Studio issue run transcript', () => {
  it('defaults a 200-event run to messages, input and errors, and expands only the selected hidden segment', async () => {
    await setup();
    expect(screen.getByText('Recorded event 1')).toBeInTheDocument();
    expect(screen.getByText('Recorded event 2')).toBeInTheDocument();
    expect(screen.getByText('Recorded event 10')).toBeInTheDocument();
    expect(screen.queryByText('Recorded event 6')).not.toBeInTheDocument();
    expect(screen.getByText(/The command failed/)).toBeInTheDocument();
    const segments = screen
      .getAllByRole('button', { expanded: false })
      .filter((button) => button.textContent?.includes('Hidden'));
    expect(segments.length).toBe(20);
    await userEvent.click(segments[0]!);
    expect(screen.getByText('Recorded event 6')).toBeInTheDocument();
    expect(screen.queryByText('Recorded event 16')).not.toBeInTheDocument();
  });

  it('restores choices after remount and isolates users and application mounts', async () => {
    const view = await setup();
    await userEvent.click(
      screen.getByRole('button', { name: 'Thinking', exact: true }),
    );
    expect(screen.getByText('Recorded event 6')).toBeInTheDocument();
    view.unmount();
    const next = await setup();
    expect(screen.getByText('Recorded event 6')).toBeInTheDocument();
    state.userId = 'bob';
    next.refresh();
    expect(screen.queryByText('Recorded event 6')).not.toBeInTheDocument();
    state.userId = 'alice';
    next.refresh();
    expect(screen.getByText('Recorded event 6')).toBeInTheDocument();
    state.basePath = '/another-app';
    next.refresh();
    expect(screen.queryByText('Recorded event 6')).not.toBeInTheDocument();
    state.basePath = '/main';
    next.refresh();
    expect(screen.getByText('Recorded event 6')).toBeInTheDocument();
  });

  it('applies filters to appended events while keeping runner and online tool failures visible', async () => {
    const view = await setup();
    state.events = [
      ...state.events,
      {
        seq: 201,
        at: '2026-10-01T00:00:01.000Z',
        type: 'thinking',
        content: 'New hidden thought',
      },
      {
        seq: 202,
        at: '2026-10-01T00:00:01.000Z',
        type: 'toolResult',
        output: 'Runner failure',
        meta: { isError: true },
      },
      {
        seq: 203,
        at: '2026-10-01T00:00:01.000Z',
        type: 'toolResult',
        output: 'Online failure',
        meta: { ok: false },
      },
      {
        seq: 204,
        at: '2026-10-01T00:00:01.000Z',
        type: 'text',
        content: 'New agent reply',
      },
    ];
    view.refresh();
    expect(screen.queryByText('New hidden thought')).not.toBeInTheDocument();
    expect(screen.getByText('Runner failure')).toBeInTheDocument();
    expect(screen.getByText('Online failure')).toBeInTheDocument();
    expect(screen.getByText('New agent reply')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Agent', exact: true }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Input', exact: true }),
    );
    expect(screen.queryByText('New agent reply')).not.toBeInTheDocument();
    expect(screen.getByText('Runner failure')).toBeInTheDocument();
    expect(screen.getByText('Online failure')).toBeInTheDocument();
  });

  it('translates filter controls in the application locale', async () => {
    const view = await setup();
    await act(() => view.runtime.changeLanguage('zh-CN'));
    expect(
      screen.getByRole('button', { name: '思考', exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '工具', exact: true }),
    ).toBeInTheDocument();
  });
});
