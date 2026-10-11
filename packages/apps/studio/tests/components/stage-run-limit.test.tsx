import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { Activity } from '@nocobase/app-plugin-projects/shared/issues';
import { ApiClientError } from '@nocobase/app-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import {
  RunAgentEditor,
  RunAgentSummary,
} from '../../client/agents/stage-rule-editors.js';
import {
  IssueStageRunLimit,
  StageRunActivityAction,
} from '../../client/issues/detail/stage-run-limit.js';
import { useIssueStageRunLimit } from '../../client/issues/detail/use-stage-run-limit.js';
import { ActivityRow } from '../../client/issues/detail/activity-row.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  show: vi.fn(),
  viewer: { userId: 'alice' },
  editable: true,
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  useViewer: () => mocks.viewer,
  useApiKeyActors: () => ({ get: () => undefined }),
  PmExpandableTextarea: (props: Record<string, unknown>) => (
    <textarea {...props} />
  ),
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canEditIssues: () => mocks.editable,
  useEventTitle: () => () => null,
}));
vi.mock('@nocobase/app-plugin-agents/client/kit', () => ({
  useAgentOptions: () => ({ agents: [], nameOf: () => null, failed: false }),
  AgentAvatar: () => <span />,
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useAgentNames: () => () => null,
}));
vi.mock('../../client/issues/detail/plan-links.js', () => ({
  usePlanLinkTo: () => () => '/plans/p1',
}));
vi.mock('../../client/components/agent-picker', () => ({
  AgentPicker: () => <div />,
}));

const issue = {
  id: 'i1',
  ownerUserId: 'alice',
  statusKey: 'in_progress',
  revision: 1,
} as IssueDetail;
const pending = {
  token: 'token',
  statusKey: 'in_progress',
  maxRuns: 5,
  windowHours: 12,
};
beforeEach(() => {
  mocks.viewer = { userId: 'alice' };
  mocks.editable = true;
  mocks.request.mockReset();
  mocks.show.mockReset();
});
afterEach(cleanup);

function StageRunLimitHarness({
  onContinued,
  activities = [],
}: {
  readonly onContinued?: () => void;
  readonly activities?: readonly Activity[];
}) {
  const control = useIssueStageRunLimit({ issue, onContinued });
  const words = enUS.studioAgents.stageRules;
  const t = (key: string) => key;
  return (
    <>
      <IssueStageRunLimit issue={issue} control={control} />
      {activities.map((activity) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          statuses={[]}
          t={t}
          stageRunControl={control}
          currentStatusKey={issue.statusKey}
        />
      ))}
      <span hidden>{words.continueAction}</span>
    </>
  );
}

const suppressedActivity = (id: string, token: string | null = 'token') =>
  ({
    id,
    actorType: 'system',
    actorId: null,
    actorName: 'System',
    action: 'stage_action_skipped',
    details: {
      reason: 'suppressed',
      continueToken: token,
      statusKey: 'in_progress',
    },
    via: null,
    createdAt: '2026-10-11T00:00:00.000Z',
  }) satisfies Activity;

async function mount(
  children: ReactNode,
  language: 'en-US' | 'zh-CN' = 'en-US',
  seedPending = false,
) {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: language === 'en-US' ? enUS : zhCN,
    },
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (seedPending) {
    client.setQueryData(
      ['studio', 'stageRunLimit', issue.id, issue.statusKey, issue.revision],
      pending,
    );
  }
  const view = render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </TestI18nProvider>,
  );
  return { ...view, queryClient: client };
}

describe('stage run configuration', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'edits numeric limits and removes blank optional values in %s',
    async (language) => {
      const changed = vi.fn();
      function Editor() {
        const [config, setConfig] = useState<Record<string, unknown>>({});
        return (
          <RunAgentEditor
            config={config}
            idPrefix='rule'
            onChange={(next) => {
              setConfig(next);
              changed(next);
            }}
          />
        );
      }
      await mount(<Editor />, language);
      const words = (language === 'en-US' ? enUS : zhCN).studioAgents
        .stageRules;
      const runs = screen.getByLabelText(words.maxRuns);
      const hours = screen.getByLabelText(words.windowHours);
      expect(runs).toHaveAttribute('placeholder', '3');
      expect(hours).toHaveAttribute('placeholder', '24');
      fireEvent.change(runs, { target: { value: '5' } });
      fireEvent.change(hours, { target: { value: '12' } });
      expect(changed).toHaveBeenLastCalledWith({ maxRuns: 5, windowHours: 12 });
      fireEvent.change(runs, { target: { value: '' } });
      expect(changed).toHaveBeenLastCalledWith({ windowHours: 12 });
      const session = screen.getByRole('switch', {
        name: new RegExp(words.freshSession, 'u'),
      });
      expect(session).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(session);
      expect(changed).toHaveBeenLastCalledWith({
        windowHours: 12,
        session: 'fresh',
      });
      expect(session).toHaveAttribute('aria-checked', 'true');
      fireEvent.click(session);
      expect(changed).toHaveBeenLastCalledWith({ windowHours: 12 });
    },
  );
  it('describes configured limits', async () => {
    await mount(<RunAgentSummary config={{ maxRuns: 5, windowHours: 12 }} />);
    expect(
      screen.getByText(/Up to 5 agent-driven runs in 12 hours/u),
    ).toBeInTheDocument();
  });
  it.each(['en-US', 'zh-CN'] as const)(
    'describes a fresh session in %s',
    async (language) => {
      await mount(<RunAgentSummary config={{ session: 'fresh' }} />, language);
      expect(
        screen.getByText(
          language === 'en-US' ? /New session every time/u : /每次新开会话/u,
        ),
      ).toBeInTheDocument();
    },
  );
});

describe('continuing a stage run', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'offers the matching activity action in %s and submits its token',
    async (language) => {
      const continueStageRun = vi.fn();
      const control = {
        pending,
        ready: true,
        submitting: false,
        continueStageRun,
      };
      await mount(
        <StageRunActivityAction
          reason='suppressed'
          token='token'
          statusKey='in_progress'
          currentStatusKey='in_progress'
          control={control}
        />,
        language,
      );
      const label = language === 'en-US' ? 'Continue' : '继续';
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(continueStageRun).toHaveBeenCalledWith('token');
    },
  );
  it.each([
    { reason: 'blocked', token: 'token', statusKey: 'in_progress' },
    { reason: 'suppressed', token: null, statusKey: 'in_progress' },
    { reason: 'suppressed', token: 'old-token', statusKey: 'in_progress' },
    { reason: 'suppressed', token: 'token', statusKey: 'todo' },
  ])('hides an activity action that is not current: %o', async (activity) => {
    await mount(
      <StageRunActivityAction
        {...activity}
        currentStatusKey='in_progress'
        control={{
          pending,
          ready: true,
          submitting: false,
          continueStageRun: vi.fn(),
        }}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('does not use cached pending data when its query failed', async () => {
    mocks.request.mockRejectedValue(new Error('Connection failed'));
    const { queryClient } = await mount(
      <StageRunLimitHarness activities={[suppressedActivity('current')]} />,
      'en-US',
      true,
    );
    await waitFor(() =>
      expect(
        queryClient.getQueryState([
          'studio',
          'stageRunLimit',
          issue.id,
          issue.statusKey,
          issue.revision,
        ])?.status,
      ).toBe('error'),
    );
    expect(
      queryClient.getQueryData([
        'studio',
        'stageRunLimit',
        issue.id,
        issue.statusKey,
        issue.revision,
      ]),
    ).toEqual(pending);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('submits once, disables while pending, and removes the action after success', async () => {
    let complete!: (value: unknown) => void;
    const posted = new Promise((resolve) => {
      complete = resolve;
    });
    let current: typeof pending | null = pending;
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST' ? posted : Promise.resolve({ data: current }),
    );
    const continued = vi.fn();
    await mount(<StageRunLimitHarness onContinued={continued} />);
    const button = await screen.findByRole('button', { name: 'Continue' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(
      mocks.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(1);
    expect(mocks.request).toHaveBeenLastCalledWith({
      method: 'POST',
      path: 'issueStageRuns/i1/continue',
      json: { token: 'token' },
    });
    current = null;
    complete({ data: { runId: 'r1' } });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Continue' }),
      ).not.toBeInTheDocument(),
    );
    expect(continued).toHaveBeenCalledOnce();
  });
  it('shares the submission lock and pending state between both entry points', async () => {
    let complete!: (value: unknown) => void;
    const posted = new Promise((resolve) => {
      complete = resolve;
    });
    let current: typeof pending | null = pending;
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST' ? posted : Promise.resolve({ data: current }),
    );
    await mount(
      <StageRunLimitHarness activities={[suppressedActivity('current')]} />,
    );
    const buttons = await screen.findAllByRole('button', { name: 'Continue' });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    await waitFor(() =>
      buttons.forEach((button) => expect(button).toBeDisabled()),
    );
    expect(
      mocks.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(1);
    current = null;
    complete({ data: { runId: 'r1' } });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Continue' }),
      ).not.toBeInTheDocument(),
    );
  });
  it('keeps the action after a failed request and gives localized feedback', async () => {
    let postCount = 0;
    let completeRetry!: (value: unknown) => void;
    const retry = new Promise((resolve) => {
      completeRetry = resolve;
    });
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST'
        ? ++postCount === 1
          ? Promise.reject(new Error('Connection failed'))
          : retry
        : Promise.resolve({ data: pending }),
    );
    await mount(
      <StageRunLimitHarness activities={[suppressedActivity('current')]} />,
      'zh-CN',
    );
    fireEvent.click(
      (await screen.findAllByRole('button', { name: '继续' })).at(-1)!,
    );
    await waitFor(() =>
      screen
        .getAllByRole('button', { name: '继续' })
        .forEach((button) => expect(button).not.toBeDisabled()),
    );
    expect(postCount).toBe(1);
    expect(mocks.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: zhCN.studioAgents.stageRules.continueFailed,
      }),
    );
    fireEvent.click(screen.getAllByRole('button', { name: '继续' })[0]);
    await waitFor(() => expect(postCount).toBe(2));
    expect(
      mocks.request.mock.calls
        .filter(([request]) => request.method === 'POST')
        .at(-1),
    ).toEqual([
      {
        method: 'POST',
        path: 'issueStageRuns/i1/continue',
        json: { token: 'token' },
      },
    ]);
    completeRetry({ data: { runId: 'r1' } });
  });
  it('clears both entry points and refreshes after a stale token response', async () => {
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST'
        ? Promise.reject(
            new ApiClientError('Stale token', {
              status: 409,
              reason: 'STAGE_CONTINUE_STALE',
              method: 'POST',
              url: '/issueStageRuns/i1/continue',
            }),
          )
        : Promise.resolve({
            data: mocks.request.mock.calls.some(
              ([call]) => call.method === 'POST',
            )
              ? null
              : pending,
          }),
    );
    await mount(
      <StageRunLimitHarness activities={[suppressedActivity('current')]} />,
      'en-US',
    );
    const buttons = await screen.findAllByRole('button', { name: 'Continue' });
    expect(
      mocks.request.mock.calls.filter(([request]) => request.method !== 'POST'),
    ).toHaveLength(1);
    fireEvent.click(buttons.at(-1)!);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Continue' }),
      ).not.toBeInTheDocument(),
    );
    expect(mocks.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: enUS.studioAgents.stageRules.continueStale,
      }),
    );
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.filter(
          ([request]) => request.method !== 'POST',
        ),
      ).toHaveLength(2),
    );
  });
  it('renders server activities through ActivityRow and performs one shared query', async () => {
    let finish!: (value: unknown) => void;
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.resolve({ data: pending }),
    );
    await mount(
      <StageRunLimitHarness
        activities={[
          suppressedActivity('current'),
          suppressedActivity('older', 'replaced-token'),
        ]}
      />,
    );
    const buttons = await screen.findAllByRole('button', { name: 'Continue' });
    expect(buttons).toHaveLength(2);
    expect(
      mocks.request.mock.calls.filter(([request]) => request.method !== 'POST'),
    ).toHaveLength(1);
    fireEvent.click(buttons[1]);
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.filter(
          ([request]) => request.method === 'POST',
        ),
      ).toHaveLength(1),
    );
    expect(document.querySelectorAll('button:disabled')).toHaveLength(2);
    expect(mocks.request).toHaveBeenLastCalledWith({
      method: 'POST',
      path: 'issueStageRuns/i1/continue',
      json: { token: 'token' },
    });
    finish({ data: { runId: 'r1' } });
  });
  it('hides the action from a person who may not edit issues', async () => {
    mocks.editable = false;
    await mount(<StageRunLimitHarness />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
