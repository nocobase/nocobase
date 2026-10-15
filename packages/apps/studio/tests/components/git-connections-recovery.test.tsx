import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import projectsLocales from '../../../../plugins/app-plugin-projects/client/locales/index.js';
import { ACCESS_NAMESPACE } from '../../../../plugins/app-plugin-projects/shared/access.js';
import { gitKeys } from '../../client/git/api.js';
import appLocales from '../../client/locales/index.js';
import GitSettingsPage from '../../client/pages/config/git.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import type { GitConnection } from '../../shared/git.js';

const api = {
  connections: vi.fn<() => Promise<GitConnection[]>>(),
  removeConnection: vi.fn(),
  reach: vi.fn(),
  uses: vi.fn(),
  status: vi.fn(),
};
const can = { manage: true };
const notify = { success: vi.fn(), error: vi.fn() };

vi.mock('../../client/git/api.js', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../../client/git/api.js')>();
  const { useQuery } = await import('@tanstack/react-query');
  return {
    ...original,
    useGitApi: () => api,
    useGitConnections: () =>
      useQuery({
        queryKey: original.gitKeys.connections,
        queryFn: () => api.connections(),
      }),
    useGitConnectionReach: (id: string) =>
      useQuery({
        queryKey: original.gitKeys.reach(id),
        queryFn: () => api.reach(id) as Promise<unknown>,
      }),
    useGitConnectionUses: (id: string, enabled: boolean) =>
      useQuery({
        queryKey: original.gitKeys.uses(id),
        queryFn: () => api.uses(id) as Promise<unknown>,
        enabled,
      }),
    useGitStatus: () =>
      useQuery({
        queryKey: original.gitKeys.status,
        queryFn: () => api.status() as Promise<unknown>,
      }),
  };
});
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: can.manage }),
}));
vi.mock('../../client/access/notify.js', () => ({ useNotify: () => notify }));

const demo: GitConnection = {
  id: 'demo-token',
  provider: 'github',
  kind: 'token',
  name: 'Demo token',
  account: 'demo',
  webUrl: 'https://github.com',
  appId: null,
  clientId: null,
  installationId: null,
  hasPrivateKey: false,
  hasClientSecret: false,
  hasToken: true,
  hasWebhookSecret: false,
  webhookUrl: null,
  callbackUrl: null,
  appSlug: null,
  installUrl: null,
  appSettingsUrl: null,
  personalMethods: ['token'],
  allowPersonalTokens: true,
  lastDelivery: null,
  lastReceivedAt: null,
  usedBy: 0,
  missingPermissions: [],
  permissionsUrl: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  demo: true,
};

async function mount(locale = 'en-US', cached?: GitConnection[]) {
  const runtime = await createTestI18nRuntime({
    application: { namespace: packageMetadata.name, resources: appLocales },
    namespaces: { [ACCESS_NAMESPACE]: projectsLocales },
    locale,
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (cached) client.setQueryData(gitKeys.connections, cached);
  render(
    <TestI18nProvider runtime={runtime} namespace={packageMetadata.name}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <GitSettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  can.manage = true;
  api.connections.mockRejectedValue(
    new ApiClientError('Internal connection failure', { status: 503 }),
  );
  api.status.mockResolvedValue({
    enabled: true,
    connections: [],
    canManage: true,
    publicOrigin: null,
  });
  api.uses.mockResolvedValue([]);
});

it.each([
  ['en-US', 'Could not load code host connections.', 'Retry'],
  ['zh-CN', '无法读取代码托管平台连接。', '重试'],
])(
  'explains a failed read and restores saved connections on retry in %s',
  async (locale, title, retry) => {
    await mount(locale);
    expect(await screen.findByRole('alert')).toHaveTextContent(title);
    expect(screen.queryByText('Internal connection failure')).toBeNull();
    expect(document.querySelector('[data-slot="empty"]')).toBeNull();
    api.connections.mockResolvedValue([demo]);
    await userEvent.click(
      screen.getByRole('button', { name: retry, exact: true }),
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-git-connection="demo-token"]'),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(api.connections).toHaveBeenCalledTimes(2);
  },
);

it('allows a reader to retry and see a successful empty list without management actions', async () => {
  can.manage = false;
  await mount();
  await screen.findByRole('alert');
  api.connections.mockResolvedValue([]);
  await userEvent.click(
    screen.getByRole('button', { name: 'Retry', exact: true }),
  );
  expect(await screen.findByText('No code host connected yet')).toBeTruthy();
  expect(
    screen.getByText(
      'Ask an administrator to connect a code host so projects can link repositories.',
    ),
  ).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Add connection', exact: true }),
  ).toBeNull();
});

it.each(['empty', 'populated'])(
  'shows a failed refresh when the cached list is %s',
  async (state) => {
    await mount('en-US', state === 'empty' ? [] : [demo]);
    await screen.findByRole('alert');
    expect(document.querySelector('[data-slot="empty"]')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Add connection', exact: true }),
    ).toBeNull();
    expect(document.querySelector('[data-git-connection]')).toBeNull();
  },
);

it('explains a forbidden read without retry or an empty conclusion', async () => {
  api.connections.mockRejectedValue(
    new ApiClientError('Forbidden', { status: 403 }),
  );
  await mount();
  await screen.findByRole('alert');
  expect(
    screen.queryByRole('button', { name: 'Retry', exact: true }),
  ).toBeNull();
  expect(document.querySelector('[data-slot="empty"]')).toBeNull();
});
