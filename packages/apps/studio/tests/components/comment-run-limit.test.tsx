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
import { IssueCommentRunLimit } from '../../client/issues/detail/comment-run-limit.js';

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
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canEditIssues: () => mocks.editable,
}));

const issue = {
  id: 'i1',
  ownerUserId: 'alice',
  statusKey: 'in_progress',
  revision: 1,
} as IssueDetail;
const held = { token: 'held', maxRuns: 20, windowHours: 24 };

beforeEach(() => {
  mocks.viewer = { userId: 'alice' };
  mocks.editable = true;
  mocks.request.mockReset();
  mocks.show.mockReset();
});
afterEach(cleanup);

async function mount(
  children: ReactNode,
  language: 'en-US' | 'zh-CN' = 'en-US',
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
  return render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </TestI18nProvider>,
  );
}

describe('continuing an agent comment', () => {
  it('continues the held comment once through its route, then removes the action', async () => {
    let complete!: (value: unknown) => void;
    const posted = new Promise((resolve) => {
      complete = resolve;
    });
    let current: typeof held | null = held;
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST' ? posted : Promise.resolve({ data: current }),
    );
    const continued = vi.fn();
    await mount(<IssueCommentRunLimit issue={issue} onContinued={continued} />);
    expect(
      await screen.findByText(enUS.issueLive.summary.needsYou),
    ).toBeInTheDocument();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'issueCommentRuns/i1' }),
    );
    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(
      mocks.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(1);
    expect(mocks.request).toHaveBeenLastCalledWith({
      method: 'POST',
      path: 'issueCommentRuns/i1/continue',
      json: { token: 'held' },
    });
    current = null;
    complete({ data: { runIds: ['r1'] } });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Continue' }),
      ).not.toBeInTheDocument(),
    );
    expect(continued).toHaveBeenCalledOnce();
  });

  it('keeps the action after a failed request and gives localized feedback', async () => {
    mocks.request.mockImplementation((request: { method?: string }) =>
      request.method === 'POST'
        ? Promise.reject(new Error('Connection failed'))
        : Promise.resolve({ data: held }),
    );
    await mount(<IssueCommentRunLimit issue={issue} />, 'zh-CN');
    fireEvent.click(await screen.findByRole('button', { name: '继续' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '继续' })).not.toBeDisabled(),
    );
    expect(mocks.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: zhCN.studioAgents.commentRuns.continueFailed,
      }),
    );
  });

  it('hides the action from a person who may not edit issues', async () => {
    mocks.editable = false;
    await mount(<IssueCommentRunLimit issue={issue} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('hides continuation from an editor who is not the owner', async () => {
    mocks.viewer = { userId: 'bob' };
    await mount(<IssueCommentRunLimit issue={issue} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });
});
