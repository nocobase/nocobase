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
import { OwnerHandoffActions } from '../../client/issues/detail/owner-handoff.js';

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
async function mount(
  canDecide = true,
  expected?: string,
  language: 'en-US' | 'zh-CN' = 'zh-CN',
  rejected = false,
) {
  mocks.request.mockResolvedValue({
    data: {
      canDecide,
      canClaim: canDecide || rejected,
      handoff: {
        waiting: true,
        notificationKey: 'current',
        rejectedAt: rejected ? '2026-10-12T00:00:00Z' : null,
        ownerUserId: 'bob',
      },
    },
  });
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: language === 'en-US' ? enUS : zhCN,
    },
    locale: language,
  });
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <QueryClientProvider client={query}>
        <OwnerHandoffActions issueId='i1' notificationKey={expected} />
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}
it.each(['en-US', 'zh-CN'] as const)(
  'submits the current decision and renders both actions in %s',
  async (language) => {
    await mount(true, undefined, language);
    const accept = await screen.findByRole('button', {
      name: language === 'en-US' ? 'Take over' : '接手',
    });
    expect(
      screen.getByRole('button', {
        name: language === 'en-US' ? 'Reject' : '拒绝',
      }),
    ).toBeDefined();
    fireEvent.click(accept);
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith({
        method: 'POST',
        path: 'issueOwnerHandoffs/i1/accept',
        json: { notificationKey: 'current' },
      }),
    );
  },
);
it('hides decisions for an unauthorized viewer and explains a stale inbox item', async () => {
  await mount(false);
  await waitFor(() => expect(mocks.request).toHaveBeenCalled());
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  await mount(true, 'old');
  expect(
    await screen.findByText('此接手请求已失效，请刷新任务。'),
  ).toBeDefined();
  expect(screen.queryByRole('button')).toBeNull();
});
it('submits rejection without removing the waiting marker locally', async () => {
  await mount();
  fireEvent.click(await screen.findByRole('button', { name: '拒绝' }));
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'POST',
      path: 'issueOwnerHandoffs/i1/reject',
      json: { notificationKey: 'current' },
    }),
  );
});

it('lets the owner explicitly claim a rejected handoff using the issue revision', async () => {
  await mount(false, undefined, 'zh-CN', true);
  const claim = await screen.findByRole('button', { name: '认领' });
  mocks.request.mockImplementation(
    (request: { method?: string; path: string }) =>
      Promise.resolve({
        data:
          request.path === 'projects/issues/i1'
            ? { revision: 4 }
            : { canDecide: false, handoff: null },
      }),
  );
  fireEvent.click(claim);
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: 'projects/issues/i1',
      json: { revision: 4, ownerUserId: 'bob' },
    }),
  );
});
