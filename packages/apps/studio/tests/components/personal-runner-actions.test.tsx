import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { PersonalRunnerActions } from '../../client/issues/detail/personal-runner-actions.js';
import type { PersonalRunnerRequest } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({ request: vi.fn(), show: vi.fn() }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.show }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
async function mount(language: 'en-US' | 'zh-CN', requester = false) {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: language === 'en-US' ? enUS : zhCN,
    },
    locale: language,
  });
  const request: PersonalRunnerRequest = {
    id: 'request-1',
    status: requester ? 'rejected' : 'pending',
    requestedBy: { id: 'bob', name: 'Bob' },
    commentId: 'comment-1',
    commentText: 'Please continue.',
    canDecide: !requester,
    canRunAsMe: requester,
  };
  mocks.request.mockResolvedValue({ data: {} });
  render(
    <TestI18nProvider runtime={runtime}>
      <QueryClientProvider client={new QueryClient()}>
        <PersonalRunnerActions request={request} />
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}
it.each(['en-US', 'zh-CN'] as const)(
  'uses the existing confirm and reject APIs in %s',
  async (language) => {
    await mount(language);
    fireEvent.click(
      screen.getByRole('button', {
        name: language === 'en-US' ? 'Confirm' : '确认',
      }),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'agents/runRequests/request-1/confirm',
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: language === 'en-US' ? 'Reject' : '拒绝',
        }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: language === 'en-US' ? 'Reject' : '拒绝',
      }),
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'agents/runRequests/request-1/reject',
        json: {},
      }),
    );
  },
);
it('offers only Run as me to the original requester after rejection', async () => {
  await mount('en-US', true);
  expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Run as me' }));
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      path: 'agents/runRequests/request-1/runAsMe',
    }),
  );
});
