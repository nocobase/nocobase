/**
 * The issue page's "Now" line: what the issue waits for in each state, the project manager's "Next" line, "Start" on a
 * backlog issue and "Hand over to the project manager" when the server offers it.
 */
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { IssueProgressLine } from '../../client/issues/detail/issue-progress.js';
import {
  progressSentence,
  progressStatusLine,
} from '../../client/issues/detail/progress-text.js';
import type { IssueProgress } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  show: vi.fn(),
  editable: true,
  userId: 'alice',
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
}));
// The live run's link reads the agents plugin's runs; here it is the text alone.
vi.mock('../../client/agents/issue-runs.js', () => ({
  IssueLiveRunLink: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
}));
vi.mock('../../client/issues/markdown.js', () => ({
  IssueMarkdown: ({ content }: { content: string }) => <span>{content}</span>,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  useViewer: () => ({ userId: mocks.userId }),
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canEditIssues: () => mocks.editable,
}));

const NOW = Date.parse('2026-10-12T12:00:00Z');
const progress = (overrides: Partial<IssueProgress> = {}): IssueProgress => ({
  state: 'idle',
  agent: null,
  step: null,
  since: null,
  runner: null,
  pullRequest: null,
  question: null,
  next: null,
  handOver: false,
  ...overrides,
});
const issue = (statusKey: string) =>
  ({ id: 'i1', ownerUserId: 'alice', statusKey, revision: 1 }) as IssueDetail;

beforeEach(() => {
  mocks.editable = true;
  mocks.userId = 'alice';
  mocks.request.mockReset();
  mocks.show.mockReset();
});
afterEach(cleanup);

it.each(['en-US', 'zh-CN'] as const)(
  'explains ordered-model waiting in %s',
  async (language) => {
    await mount(
      'in_progress',
      progress({
        state: 'queued',
        waiting: {
          reason: 'ownerHasNoRunner',
          owner: { id: 'alice', name: 'Alice' },
        },
        managerWait: {
          queueEnteredAt: new Date().toISOString(),
          fallbackAfterSeconds: 120,
          sampledAt: new Date().toISOString(),
          entries: [
            {
              tool: 'claude',
              model: 'opus',
              reason: 'busy',
              compatibleCount: 1,
              runners: ['lima'],
            },
            {
              tool: 'codex',
              model: 'astra',
              reason: 'incompatible',
              compatibleCount: 0,
              runners: [],
            },
          ],
        },
      }),
      vi.fn(),
      language,
    );
    expect(await screen.findByText(/lima/u)).toHaveTextContent(
      language === 'en-US' ? 'compatible runners are busy' : '兼容执行机正忙',
    );
    expect(screen.getByText(/lima/u)).toHaveTextContent(
      language === 'en-US' ? 'upgrade required' : '需升级',
    );
  },
);

async function translator(language: 'en-US' | 'zh-CN') {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: language === 'en-US' ? enUS : zhCN,
    },
    locale: language,
  });
  return runtime;
}

it.each(['en-US', 'zh-CN'] as const)(
  'describes a draining runner in the Now line in %s',
  async (language) => {
    const t = (await translator(language)).getFixedT('studio', language);
    const text = progressSentence(
      t,
      progress({
        state: 'queued',
        waiting: {
          reason: 'ownerHasNoRunner',
          owner: { id: 'alice', name: 'Alice' },
        },
        managerWait: {
          queueEnteredAt: new Date(NOW).toISOString(),
          fallbackAfterSeconds: 120,
          sampledAt: new Date(NOW).toISOString(),
          entries: [
            {
              tool: 'codex',
              model: 'sol',
              reason: 'updatePending',
              compatibleCount: 1,
              runners: ['lima'],
              runnerLoads: [
                {
                  name: 'lima',
                  ownerUserId: 'alice',
                  reason: 'updatePending',
                  used: 0,
                  limit: 2,
                  reportedTotalFree: 0,
                },
              ],
            },
          ],
        },
      }),
      NOW,
    );
    expect(text).toContain(
      language === 'en-US'
        ? 'runner waiting for update'
        : '执行机等待升级，暂不接活',
    );
    expect(text).toContain('lima');
  },
);

async function mount(
  statusKey: string,
  answer: IssueProgress,
  onStart = vi.fn(),
  language: 'en-US' | 'zh-CN' = 'en-US',
) {
  mocks.request.mockImplementation((request: { method?: string }) =>
    Promise.resolve(
      request.method === 'POST' ? { data: { runId: 'r1' } } : { data: answer },
    ),
  );
  const runtime = await translator(language);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>
        <IssueProgressLine
          issue={issue(statusKey)}
          refresh='1'
          starting={false}
          onStart={onStart}
        />
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  return onStart;
}

describe('what an issue waits for', () => {
  const agent = { id: 'sol', name: 'Codex · GPT-6.1 Sol' };
  it.each([
    [
      progress({
        state: 'working',
        agent,
        step: 'fixing the review findings',
        since: '2026-10-12T11:48:00Z',
        runner: 'dev-2',
      }),
      'Codex · GPT-6.1 Sol is working on fixing the review findings · for 12 min · on dev-2',
      'Codex · GPT-6.1 Sol 正在fixing the review findings · 已运行 12 分钟 · 在 dev-2',
    ],
    [
      progress({ state: 'queued', agent, step: 'review' }),
      'Codex · GPT-6.1 Sol waits for a runner to take it: review',
      'Codex · GPT-6.1 Sol 在等执行机领取：review',
    ],
    [
      progress({
        state: 'checksPending',
        pullRequest: { number: 10777, url: null },
      }),
      'Waiting for the checks of PR #10777',
      '等待 PR #10777 的检查结果',
    ],
    [
      progress({ state: 'needsDecision', question: 'Keep the old API?' }),
      'The project manager asks: Keep the old API?',
      '项目经理在等你决定：Keep the old API?',
    ],
    [progress({ state: 'inReview' }), 'Waiting for acceptance', '等待验收'],
    [
      progress({ state: 'notStarted' }),
      'Not started. Start it and the project manager arranges the work.',
      '还没开始。点「开始」后由项目经理安排。',
    ],
    [progress({ state: 'finished' }), 'Finished', '已结束'],
    [progress({ state: 'idle' }), 'Nothing is running', '现在没有在运行的工作'],
  ])('words %o in both languages', async (value, english, chinese) => {
    const en = await translator('en-US');
    const zh = await translator('zh-CN');
    expect(progressSentence(en.getFixedT('studio', 'en-US'), value, NOW)).toBe(
      english,
    );
    expect(progressSentence(zh.getFixedT('studio', 'zh-CN'), value, NOW)).toBe(
      chinese,
    );
  });

  it('says Now as one short line from the progress, never the manager’s step', async () => {
    const en = (await translator('en-US')).getFixedT('studio', 'en-US');
    const zh = (await translator('zh-CN')).getFixedT('studio', 'zh-CN');
    const working = progress({
      state: 'working',
      agent: { id: 'sol', name: 'Codex · GPT-6 Astra' },
      step: '  Implement it.\n\nSee [PR #10804](https://example.com) and `abc123`.  ',
      since: new Date(NOW - 2 * 60_000).toISOString(),
      runner: 'studio-runner-lima',
    });
    expect(progressStatusLine(en, working, NOW)).toBe(
      'Codex · GPT-6 Astra working · 2 min · studio-runner-lima',
    );
    expect(progressStatusLine(zh, working, NOW)).toBe(
      'Codex · GPT-6 Astra 工作中 · 2 分钟 · studio-runner-lima',
    );
    expect(
      progressStatusLine(
        en,
        progress({ state: 'queued', agent: { id: 'sol', name: 'Sol' } }),
        NOW,
      ),
    ).toBe('Sol queued');
    // Waiting for a runner keeps its reasons (the Now line cuts them to two lines).
    expect(
      progressStatusLine(
        en,
        progress({
          state: 'queued',
          agent: { id: 'sol', name: 'Sol' },
          managerWait: {
            queueEnteredAt: new Date(NOW).toISOString(),
            fallbackAfterSeconds: 60,
            sampledAt: new Date(NOW).toISOString(),
            entries: [
              {
                tool: 'claude',
                model: 'opus',
                reason: 'busy',
                compatibleCount: 1,
                runners: ['studio-runner-lima'],
              },
            ],
          },
        }),
        NOW,
      ),
    ).toContain('compatible runners are busy');
    expect(progressStatusLine(en, progress({ state: 'idle' }), NOW)).toBe(
      'Nothing is running',
    );
    // The question is the "Needs you" card's, so Now only says a decision waits.
    expect(
      progressStatusLine(
        en,
        progress({ state: 'needsDecision', question: 'Retry after `429`?' }),
        NOW,
      ),
    ).toBe('Waiting for your decision');
  });

  it('shows the line with the project manager’s next step, and links the pull request whose checks it waits for', async () => {
    await mount(
      'in_progress',
      progress({
        state: 'checksPending',
        pullRequest: {
          number: 12,
          url: 'https://github.com/acme/shop/pull/12',
        },
        next: 'Hand it to Opus for review once the checks pass',
      }),
    );
    expect(
      await screen.findByRole('link', {
        name: 'Waiting for the checks of PR #12',
      }),
    ).toHaveAttribute('href', 'https://github.com/acme/shop/pull/12');
    expect(screen.getByTestId('issue-progress').textContent).toContain(
      'Next: Hand it to Opus for review once the checks pass',
    );
    expect(mocks.request).toHaveBeenCalledWith({ path: 'issueProgress/i1' });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers Start on a backlog issue', async () => {
    const onStart = await mount(
      'backlog',
      progress({ state: 'notStarted' }),
      vi.fn(),
      'zh-CN',
    );
    expect(
      await screen.findByText('还没开始。点「开始」后由项目经理安排。'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('hands an issue the project manager never worked on over to it', async () => {
    await mount('in_progress', progress({ state: 'idle', handOver: true }));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Hand over to the project manager',
      }),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'projectManager/issues/i1/start',
      }),
    );
    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Handed over to the project manager',
        }),
      ),
    );
  });

  it('offers nothing to a person who may not edit the issue', async () => {
    mocks.editable = false;
    await mount('backlog', progress({ state: 'notStarted', handOver: true }));
    expect(await screen.findByText(/Not started/u)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

it('hides start and hand-over from an editor who is not the owner', async () => {
  mocks.userId = 'bob';
  await mount('backlog', progress());
  expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
  cleanup();
  await mount('in_progress', progress({ handOver: true }));
  expect(
    screen.queryByRole('button', { name: 'Hand over to the project manager' }),
  ).toBeNull();
});

it.each(['en-US', 'zh-CN'] as const)(
  'keeps owner acceptance ahead of starting work in %s',
  async (language) => {
    await mount(
      'backlog',
      progress({
        waiting: {
          reason: 'waitingOwner',
          owner: { id: 'alice', name: 'Alice' },
        },
      }),
      vi.fn(),
      language,
    );
    expect(
      await screen.findByText(
        language === 'en-US'
          ? 'Waiting for Alice to take over'
          : '等待 Alice 接手',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: language === 'en-US' ? 'Start' : '开始',
        exact: true,
      }),
    ).toBeNull();
  },
);
