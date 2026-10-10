/**
 * Settings › Git and Account settings › Git in the browser: the connections as sources titled by their provider (an app
 * with its installations, a token), what each reaches and serves and its state; connecting GitHub by creating an app
 * from Studio's manifest (who owns it, a GitHub Enterprise Server folded away, the webhook off when GitHub cannot reach
 * Studio), an app entered by hand or a token at the bottom, an app created but not installed yet, another installation
 * that sends no credentials, editing that never shows a secret; and the person's page: each connection with one way to
 * connect first and the others under "Other ways", a connected account with its method and expiry, the device flow's
 * code, a pasted token, and without a connection that an administrator adds one first.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { ApiClientError } from '@nocobase/app-client';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  GitConnection,
  GitPersonalAuthorizations,
} from '../../shared/git';
import {
  connectionState,
  gitSources,
} from '../../client/git/connections-model';

const api = {
  connections: vi.fn<() => Promise<GitConnection[]>>(),
  reach: vi.fn(),
  uses: vi.fn(),
  saveConnection: vi.fn(),
  removeConnection: vi.fn(),
  me: vi.fn<() => Promise<GitPersonalAuthorizations>>(),
  status: vi.fn(),
  authorize: vi.fn(),
  disconnect: vi.fn(),
  startDeviceFlow: vi.fn(),
  pollDeviceFlow: vi.fn(),
  savePersonalToken: vi.fn(),
  startAppManifest: vi.fn(),
};
const can = { manage: true };

vi.mock('../../client/git/api', async (importOriginal) => {
  const { useQuery } = await import('@tanstack/react-query');
  return {
    ...(await importOriginal<typeof import('../../client/git/api')>()),
    useGitApi: () => api,
    useGitConnections: () =>
      useQuery({ queryKey: ['connections'], queryFn: () => api.connections() }),
    useGitConnectionReach: (id: string) =>
      useQuery({
        queryKey: ['reach', id],
        queryFn: () => api.reach(id) as Promise<unknown>,
        retry: false,
      }),
    useGitConnectionUses: (id: string, enabled: boolean) =>
      useQuery({
        queryKey: ['uses', id],
        queryFn: () => api.uses(id, undefined) as Promise<unknown>,
        enabled,
      }),
    useGitMe: () => useQuery({ queryKey: ['me'], queryFn: () => api.me() }),
    useGitStatus: () =>
      useQuery({
        queryKey: ['status'],
        queryFn: () => api.status() as Promise<unknown>,
      }),
  };
});
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: can.manage }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'count' in options ? `${key}(${String(options.count)})` : key,
    i18n: { language: 'en-US' },
  }),
}));
const notify = { success: vi.fn(), error: vi.fn() };
vi.mock('../../client/access/notify', () => ({
  useNotify: () => notify,
}));

const { default: GitSettingsPage } =
  await import('../../client/pages/config/git');
const { default: AccountGit } = await import('../../client/pages/account/git');

const wrap = (ui: ReactElement, path = '/') => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const AT = '2026-10-01T00:00:00.000Z';

/** "Add connection", then a provider from its menu. */
async function addConnection(provider = 'github'): Promise<void> {
  await userEvent.click(
    (await screen.findAllByRole('button', { name: /connections\.add$/u }))[0]!,
  );
  const items = await screen.findAllByRole('menuitem');
  const item = items.find(
    (element) => (element as HTMLElement).dataset.provider === provider,
  );
  expect(item).toBeTruthy();
  await userEvent.click(item!);
}

function connection(
  id: string,
  overrides: Partial<GitConnection> = {},
): GitConnection {
  return {
    id,
    provider: 'github',
    kind: 'app',
    name: 'Acme app',
    account: 'acme',
    webUrl: 'https://github.com',
    appId: '12',
    clientId: 'Iv1.abc',
    installationId: '77',
    hasPrivateKey: true,
    hasClientSecret: true,
    hasToken: false,
    hasWebhookSecret: true,
    webhookUrl: `/api/webhooks/github/connections/${id}`,
    callbackUrl: '/oauth/git/callback',
    appSlug: null,
    installUrl: null,
    appSettingsUrl: null,
    personalMethods: ['oauth', 'device', 'token'],
    allowPersonalTokens: true,
    lastDelivery: null,
    lastReceivedAt: null,
    usedBy: 0,
    missingPermissions: [],
    permissionsUrl: null,
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

const acme = connection('c1', { usedBy: 2, lastReceivedAt: AT });
const globex = connection('c2', {
  name: 'Globex',
  account: 'globex',
  installationId: '88',
  lastDelivery: {
    at: AT,
    event: 'push',
    status: 'invalidSignature',
    reason: null,
  },
});
const bot = connection('c3', {
  kind: 'token',
  name: 'Bot',
  account: 'acme-bot',
  appId: null,
  clientId: null,
  installationId: null,
  hasPrivateKey: false,
  hasClientSecret: false,
  hasToken: true,
  hasWebhookSecret: false,
  webhookUrl: null,
  callbackUrl: null,
  personalMethods: ['token'],
});

describe('the connections model', () => {
  it('groups an app’s installations into one source, beside each token', () => {
    const sources = gitSources([acme, bot, globex]);
    expect(sources.map((source) => source.kind)).toEqual(['app', 'token']);
    expect(
      sources[0]?.kind === 'app'
        ? sources[0].installations.map((item) => item.id)
        : [],
    ).toEqual(['c1', 'c2']);
    // Oldest first, whatever order they arrive in.
    expect(
      gitSources([
        { ...bot, createdAt: '2026-01-01T00:00:00Z' },
        { ...acme, createdAt: '2026-02-01T00:00:00Z' },
      ]).map((source) => source.key),
    ).toEqual(['c3', `${acme.webUrl}\n${acme.appId}`]);
    expect(
      gitSources([
        { ...acme, createdAt: '2026-02-01T00:00:00Z' },
        { ...bot, createdAt: '2026-01-01T00:00:00Z' },
      ]).map((source) => source.kind),
    ).toEqual(['token', 'app']);
    expect(connectionState(acme)).toBe('ready');
    expect(connectionState(globex)).toBe('webhookFailing');
    expect(connectionState({ ...acme, installationId: null })).toBe(
      'incomplete',
    );
    expect(connectionState({ ...acme, hasWebhookSecret: false })).toBe(
      'noWebhook',
    );
  });
});

describe('Settings › Git', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    can.manage = true;
    api.connections.mockResolvedValue([acme, bot, globex]);
    api.reach.mockImplementation((id: string) =>
      id === 'c3'
        ? Promise.reject(new Error('unreachable'))
        : Promise.resolve({ repositories: id === 'c1' ? 12 : 3, more: false }),
    );
    api.saveConnection.mockResolvedValue(acme);
    api.status.mockResolvedValue({
      enabled: true,
      connections: [],
      canManage: true,
      publicOrigin: null,
    });
  });

  it('lists an app with its installations and a token, with what each reaches, serves and how it is doing', async () => {
    render(wrap(<GitSettingsPage />));
    const card = (
      await screen.findByText('studioGit.connections.installations(2)')
    ).closest('[data-git-source]') as HTMLElement;
    expect(card.dataset.gitSource).toBe('app');
    // Titled by its provider's icon and name.
    expect(card.querySelector('[data-git-provider="github"]')).toBeTruthy();
    expect(
      within(card).getAllByText('studioGit.connections.sourceTitle').length,
    ).toBeGreaterThan(0);
    const rows = card.querySelectorAll('tr[data-git-connection]');
    expect(rows).toHaveLength(2);
    const first = rows[0] as HTMLElement;
    expect(within(first).getByText('acme')).toBeTruthy();
    expect(await within(first).findByText('12')).toBeTruthy();
    expect(
      within(first).getByRole('button', {
        name: /studioGit\.connections\.usedBy\(2\)/u,
      }),
    ).toBeTruthy();
    expect(
      within(rows[1] as HTMLElement).getByText(
        'studioGit.connections.state.webhookFailing',
      ),
    ).toBeTruthy();
    const token = document.querySelector(
      '[data-git-source="token"]',
    ) as HTMLElement;
    expect(token.dataset.gitSource).toBe('token');
    expect(
      await within(token).findByText('studioGit.connections.reposUnreachable'),
    ).toBeTruthy();
    // The app's URLs to copy, never a secret.
    const endpoint = within(card).getByText('studioGit.webhook.lastReceived');
    expect(endpoint).toHaveAttribute('data-last-received', AT);
    expect(
      within(card).getByText(
        `${window.location.origin}/api/webhooks/github/connections/c1`,
      ),
    ).toBeTruthy();
  });

  it('lists the repositories that use a connection, each linking to its project’s CI settings', async () => {
    api.uses.mockResolvedValue([
      {
        resourceId: 'r1',
        projectId: 'p1',
        projectName: 'CRM',
        repo: 'acme/crm',
      },
      {
        resourceId: 'r2',
        projectId: 'p2',
        projectName: 'Shop',
        repo: 'acme/shop',
      },
    ]);
    render(wrap(<GitSettingsPage />));
    const trigger = await screen.findByRole('button', {
      name: /studioGit\.connections\.usedBy\(2\)/u,
    });
    expect(api.uses).not.toHaveBeenCalled();
    await userEvent.click(trigger);
    const link = await screen.findByRole('link', { name: 'acme/crm' });
    expect(link.getAttribute('href')).toBe(
      '/projects/p1/settings?section=ci&repo=r1',
    );
    expect(screen.getByText('Shop')).toBeTruthy();
    expect(api.uses).toHaveBeenCalledWith('c1', undefined);
    // A connection nothing uses says so, with nothing to open.
    const token = document.querySelector(
      '[data-git-source="token"]',
    ) as HTMLElement;
    expect(
      within(token).getByText('studioGit.connections.usedByNone'),
    ).toBeTruthy();
  });

  it('says a demo connection’s repositories are not read', async () => {
    api.connections.mockResolvedValue([{ ...bot, demo: true, usedBy: 4 }]);
    render(wrap(<GitSettingsPage />));
    const token = (
      await screen.findByText('studioGit.connections.demoReach')
    ).closest('[data-git-source]') as HTMLElement;
    expect(api.reach).not.toHaveBeenCalled();
    expect(
      within(token).getByRole('button', {
        name: /studioGit\.connections\.usedBy\(4\)/u,
      }),
    ).toBeTruthy();
    // The account and host on one line; how people connect their own account in the details.
    expect(within(token).getByText('acme-bot · github.com')).toBeTruthy();
    expect(
      within(token).getByText('studioGit.connections.columns.personal'),
    ).toBeTruthy();
  });

  it('connects GitHub by creating an app from Studio’s manifest, owned by an organization', async () => {
    api.status.mockResolvedValue({
      enabled: true,
      connections: [],
      canManage: true,
      publicOrigin: 'https://studio.example.com',
    });
    api.startAppManifest.mockResolvedValue({
      action: 'https://github.com/organizations/acme/settings/apps/new?state=s',
      manifest: '{"name":"Studio studio.example.com"}',
      webhookActive: true,
    });
    const submit = vi
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => undefined);
    render(wrap(<GitSettingsPage />));
    await addConnection();
    const dialog = await screen.findByRole('dialog');
    const create = 'studioGit.providers.github.create';
    // Only who owns the app; the host and the other ways wait folded away.
    expect(
      within(dialog).queryByLabelText(`${create}.organization`),
    ).toBeNull();
    expect(
      within(dialog).queryByLabelText('studioGit.connections.fields.webUrl'),
    ).toBeNull();
    expect(
      within(dialog).queryByLabelText('studioGit.connections.fields.appId'),
    ).toBeNull();
    expect(await within(dialog).findByText(`${create}.webhookOn`)).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole('radio', {
        name: `${create}.ownerKind.organization`,
      }),
    );
    const submitButton = within(dialog).getByRole('button', {
      name: `${create}.submit`,
    });
    // The organization is required.
    fireEvent.click(submitButton);
    expect(
      within(dialog).getByText(`${create}.organizationRequired`),
    ).toBeTruthy();
    expect(api.startAppManifest).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText(`${create}.organization`), {
      target: { value: ' acme ' },
    });
    fireEvent.click(submitButton);
    await waitFor(() =>
      expect(api.startAppManifest).toHaveBeenCalledWith({
        provider: 'github',
        organization: 'acme',
        webUrl: 'https://github.com',
      }),
    );
    // The browser posts the manifest to GitHub.
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    const form = submit.mock.contexts[0] as HTMLFormElement;
    expect(form.action).toBe(
      'https://github.com/organizations/acme/settings/apps/new?state=s',
    );
    expect(form.method).toBe('post');
    expect(
      (form.elements.namedItem('manifest') as HTMLInputElement).value,
    ).toBe('{"name":"Studio studio.example.com"}');
    submit.mockRestore();
    form.remove();
  });

  it('creates on a GitHub Enterprise Server, and says the webhook starts off when GitHub cannot reach Studio', async () => {
    api.status.mockResolvedValue({
      enabled: true,
      connections: [],
      canManage: true,
      publicOrigin: null,
    });
    api.startAppManifest.mockRejectedValue(new Error('stop'));
    render(wrap(<GitSettingsPage />));
    await addConnection();
    const dialog = await screen.findByRole('dialog');
    const create = 'studioGit.providers.github.create';
    expect(
      await within(dialog).findByText(`${create}.webhookOff`),
    ).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole('button', { name: `${create}.enterprise` }),
    );
    fireEvent.change(
      await within(dialog).findByLabelText(
        'studioGit.connections.fields.webUrl',
      ),
      { target: { value: 'https://git.corp.example' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: `${create}.submit` }),
    );
    await waitFor(() =>
      expect(api.startAppManifest).toHaveBeenCalledWith({
        provider: 'github',
        organization: null,
        webUrl: 'https://git.corp.example',
      }),
    );
  });

  it('enters an existing GitHub App by hand from the bottom of the dialog, then shows what to copy', async () => {
    render(wrap(<GitSettingsPage />));
    await addConnection();
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', {
        name: 'studioGit.providers.github.create.token',
      }),
    ).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'studioGit.providers.github.create.manual',
      }),
    );
    expect(
      within(dialog).getByText('studioGit.providers.github.appSteps.create'),
    ).toBeTruthy();
    const field = (name: string) =>
      within(dialog).getByLabelText(`studioGit.connections.fields.${name}`);
    fireEvent.change(field('name'), { target: { value: 'Acme app' } });
    fireEvent.change(field('appId'), { target: { value: '12' } });
    fireEvent.change(field('privateKey'), { target: { value: 'KEY' } });
    fireEvent.change(field('account'), { target: { value: 'acme' } });
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'studioGit.connections.save',
      }),
    );
    await waitFor(() =>
      expect(api.saveConnection).toHaveBeenCalledWith(null, {
        provider: 'github',
        kind: 'app',
        name: 'Acme app',
        webUrl: 'https://github.com',
        appId: '12',
        privateKey: 'KEY',
        account: 'acme',
        allowPersonalTokens: true,
      }),
    );
    expect(
      await screen.findByText('studioGit.connections.dialog.finishTitle'),
    ).toBeTruthy();
  });

  it('shows an app created on GitHub but not installed yet, with where to install it and turn on the device flow', async () => {
    const created = connection('c9', {
      name: 'Studio studio.example.com',
      account: null,
      installationId: null,
      appSlug: 'studio-acme',
      installUrl: 'https://github.com/apps/studio-acme/installations/new',
      appSettingsUrl: 'https://github.com/settings/apps/studio-acme',
    });
    api.connections.mockResolvedValue([created]);
    render(wrap(<GitSettingsPage />));
    const row = (
      await screen.findByText('studioGit.connections.state.notInstalled')
    ).closest('tr') as HTMLElement;
    expect(
      within(row)
        .getByText('studioGit.connections.install')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://github.com/apps/studio-acme/installations/new');
    expect(
      screen
        .getByText('studioGit.providers.github.appSettings')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://github.com/settings/apps/studio-acme');
  });

  it('asks to accept the app’s new permissions where an installation lacks them, linking to where it does', async () => {
    const older = connection('c7', {
      account: 'acme',
      installationId: '77',
      missingPermissions: ['secrets:write'],
      permissionsUrl:
        'https://github.com/organizations/acme/settings/installations/77',
    });
    api.connections.mockResolvedValue([older]);
    render(wrap(<GitSettingsPage />));
    const notice = (
      await screen.findByText('studioGit.connections.missingPermissions.title')
    ).closest('[data-git-missing-permissions]') as HTMLElement;
    expect(
      within(notice)
        .getByText('studioGit.connections.missingPermissions.review')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://github.com/organizations/acme/settings/installations/77');
  });

  it('adds another installation with only its name and account', async () => {
    render(wrap(<GitSettingsPage />));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'studioGit.connections.addInstallation',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).queryByLabelText(
        'studioGit.connections.fields.privateKey',
      ),
    ).toBeNull();
    fireEvent.change(
      within(dialog).getByLabelText('studioGit.connections.fields.name'),
      { target: { value: 'Initech' } },
    );
    fireEvent.change(
      within(dialog).getByLabelText('studioGit.connections.fields.account'),
      { target: { value: 'initech' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'studioGit.connections.save',
      }),
    );
    await waitFor(() =>
      expect(api.saveConnection).toHaveBeenCalledWith(null, {
        kind: 'app',
        sameAppAs: 'c1',
        name: 'Initech',
        account: 'initech',
      }),
    );
  });

  it('edits the app’s credentials on every installation without showing them', async () => {
    render(wrap(<GitSettingsPage />));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'studioGit.connections.editApp',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    const key = within(dialog).getByLabelText(
      'studioGit.connections.fields.privateKey',
    );
    expect((key as HTMLTextAreaElement).value).toBe('');
    // Where the credentials are entered, the form says they are write-only.
    expect(
      within(dialog).getAllByText('studioGit.connections.credentialsNote'),
    ).toHaveLength(1);
    fireEvent.change(
      within(dialog).getByLabelText(
        'studioGit.connections.fields.webhookSecret',
      ),
      { target: { value: 'whsec-new-0123456789' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'studioGit.connections.save',
      }),
    );
    await waitFor(() => expect(api.saveConnection).toHaveBeenCalledTimes(2));
    expect(api.saveConnection.mock.calls.map((call) => call[0])).toEqual([
      'c1',
      'c2',
    ]);
    expect(api.saveConnection.mock.calls[0]?.[1]).toEqual({
      appId: '12',
      clientId: 'Iv1.abc',
      webhookSecret: 'whsec-new-0123456789',
      allowPersonalTokens: true,
    });
  });

  it('says how to start when there is no connection', async () => {
    api.connections.mockResolvedValue([]);
    render(wrap(<GitSettingsPage />));
    expect(
      await screen.findByText('studioGit.connections.emptyTitle'),
    ).toBeTruthy();
    expect(
      screen.getByText('studioGit.connections.emptyDescription'),
    ).toBeTruthy();
    // Only the empty state offers the provider menu while there is nothing listed.
    const adds = screen.getAllByRole('button', { name: /connections\.add$/u });
    expect(adds).toHaveLength(1);
    expect(adds[0]!.closest('[data-slot="empty"]')).toBeTruthy();
    await userEvent.click(adds[0]!);
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => (item as HTMLElement).dataset.provider)).toEqual(
      ['github'],
    );
    expect(items[0]!.textContent).toBe('GitHub');
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('says the page is read-only to someone who cannot manage connections', async () => {
    can.manage = false;
    render(wrap(<GitSettingsPage />));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'studioGit.connections.title',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain(
      'settingsPage.readOnly',
    );
    expect(
      screen.queryByRole('button', { name: /connections\.add$/u }),
    ).toBeNull();
  });

  it('asks someone who cannot manage connections to ask an administrator', async () => {
    can.manage = false;
    api.connections.mockResolvedValue([]);
    render(wrap(<GitSettingsPage />));
    expect(
      await screen.findByText('studioGit.connections.emptyDescriptionReadOnly'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /connections\.add$/u }),
    ).toBeNull();
  });
});

describe('Account settings › Git', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.status.mockResolvedValue({
      enabled: true,
      connections: [],
      canManage: false,
    });
  });

  const choice = (item: GitConnection) => ({
    id: item.id,
    provider: item.provider,
    kind: item.kind,
    name: item.name,
    account: item.account,
    webUrl: item.webUrl,
    demo: false,
    repositoryAccessUrl: null,
    createdAt: item.createdAt,
  });

  it('says personal linking is not available yet, and links an administrator to what to turn on', async () => {
    api.me.mockResolvedValue({ hosts: [] });
    api.status.mockResolvedValue({
      enabled: true,
      connections: [],
      canManage: true,
    });
    render(wrap(<AccountGit />));
    expect(
      await screen.findByText('studioGit.personal.emptyTitle'),
    ).toBeTruthy();
    expect(
      await screen.findByText('studioGit.personal.emptyDescriptionManage'),
    ).toBeTruthy();
    const link = (
      await screen.findByText('studioGit.personal.openSettings')
    ).closest('a');
    expect(link?.getAttribute('href')).toBe('/config/git');
  });

  it('shows no settings link to someone who cannot manage connections', async () => {
    api.me.mockResolvedValue({ hosts: [] });
    render(wrap(<AccountGit />));
    expect(
      await screen.findByText('studioGit.personal.emptyDescription'),
    ).toBeTruthy();
    expect(screen.queryByText('studioGit.personal.openSettings')).toBeNull();
  });

  it('lists each connection with the ways it offers, and a connected account with its method and expiry', async () => {
    const soon = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
    api.me.mockResolvedValue({
      hosts: [
        {
          connection: choice(acme),
          methods: ['oauth', 'device', 'token'],
          authorization: null,
        },
        {
          connection: choice(bot),
          methods: ['token'],
          authorization: {
            connectionId: 'c3',
            login: 'alice-gh',
            name: null,
            email: 'alice@acme.dev',
            method: 'token',
            connectedAt: AT,
            expiresAt: soon,
          },
        },
        {
          // Connected through before it stopped allowing it: listed so it can be disconnected.
          connection: choice(globex),
          methods: [],
          authorization: {
            connectionId: 'c2',
            login: 'alice-globex',
            name: null,
            email: 'alice@globex.dev',
            method: 'oauth',
            connectedAt: AT,
            expiresAt: '2000-01-01T00:00:00.000Z',
          },
        },
      ],
    });
    render(wrap(<AccountGit />));
    const row = (id: string) =>
      document.querySelector(`li[data-git-connection="${id}"]`) as HTMLElement;
    await screen.findByText('alice-gh');
    // One way first, the others under "Other ways".
    expect(
      [...row('c1').querySelectorAll('[data-git-method]')].map(
        (button) => (button as HTMLElement).dataset.gitMethod,
      ),
    ).toEqual(['oauth']);
    expect(
      within(row('c1')).getByRole('button', {
        name: 'studioGit.personal.connect',
      }),
    ).toBeTruthy();
    await userEvent.click(
      within(row('c1')).getByRole('button', {
        name: 'studioGit.personal.otherWays',
      }),
    );
    expect(
      (await screen.findAllByRole('menuitem')).map(
        (item) => (item as HTMLElement).dataset.gitMethod,
      ),
    ).toEqual(['device', 'token']);
    expect(
      row('c1').querySelector('[data-git-provider="github"]'),
    ).toBeTruthy();
    expect(
      within(row('c3')).getByText('studioGit.personal.method.token'),
    ).toBeTruthy();
    expect(
      (row('c3').querySelector('[data-expiry]') as HTMLElement).dataset.expiry,
    ).toBe('soon');
    expect(
      within(row('c3')).getByRole('button', {
        name: 'studioGit.personal.disconnect',
      }),
    ).toBeTruthy();
    // Expired, and no way left to connect again: only Disconnect.
    expect(
      within(row('c2')).getByText('studioGit.personal.unavailable'),
    ).toBeTruthy();
    expect(row('c2').querySelector('[data-git-method]')).toBeNull();
    expect(
      within(row('c2')).getByRole('button', {
        name: 'studioGit.personal.disconnect',
      }),
    ).toBeTruthy();
  });

  it('lists the connections oldest first', async () => {
    api.me.mockResolvedValue({
      hosts: [
        {
          connection: { ...choice(bot), createdAt: '2026-03-01T00:00:00Z' },
          methods: ['token'],
          authorization: null,
        },
        {
          connection: { ...choice(acme), createdAt: '2026-01-01T00:00:00Z' },
          methods: ['oauth'],
          authorization: null,
        },
      ],
    });
    render(wrap(<AccountGit />));
    await waitFor(() =>
      expect(
        [...document.querySelectorAll('li[data-git-connection]')].map(
          (item) => (item as HTMLElement).dataset.gitConnection,
        ),
      ).toEqual(['c1', 'c3']),
    );
  });

  it('connects with a code: shows it, and polls until the person entered it', async () => {
    api.me.mockResolvedValue({
      hosts: [
        {
          connection: choice(acme),
          methods: ['oauth', 'device'],
          authorization: null,
        },
      ],
    });
    api.startDeviceFlow.mockResolvedValue({
      handle: 'sealed',
      userCode: 'WDJB-MJHT',
      verificationUri: 'https://github.com/login/device',
      expiresAt: AT,
      interval: 0,
    });
    api.pollDeviceFlow
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'connected' });
    render(wrap(<AccountGit />));
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'studioGit.personal.otherWays',
      }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: 'studioGit.personal.connectDevice',
      }),
    );
    expect(await screen.findByText('WDJB-MJHT')).toBeTruthy();
    expect(api.startDeviceFlow).toHaveBeenCalledWith('c1');
    await waitFor(() => expect(api.pollDeviceFlow).toHaveBeenCalledTimes(2));
    expect(api.pollDeviceFlow).toHaveBeenCalledWith('c1', 'sealed');
    await waitFor(() => expect(screen.queryByText('WDJB-MJHT')).toBeNull());
  });

  it('connects with a code first when the app cannot be signed in to', async () => {
    api.me.mockResolvedValue({
      hosts: [
        {
          connection: choice(acme),
          methods: ['device', 'token'],
          authorization: null,
        },
      ],
    });
    api.startDeviceFlow.mockReturnValue(new Promise(() => undefined));
    render(wrap(<AccountGit />));
    const primary = await screen.findByRole('button', {
      name: 'studioGit.personal.connect',
    });
    expect(primary.dataset.gitMethod).toBe('device');
    fireEvent.click(primary);
    await waitFor(() => expect(api.startDeviceFlow).toHaveBeenCalledWith('c1'));
  });

  it('says why the host’s sign-in did not connect, and keeps the dialog open', async () => {
    api.me.mockResolvedValue({ hosts: [] });
    function Where(): ReactElement {
      return <output data-testid='where'>{useLocation().search}</output>;
    }
    const { unmount } = render(
      wrap(
        <>
          <AccountGit />
          <Where />
        </>,
        '/issues?account=git&error=GIT_AUTHORIZATION_EXPIRED',
      ),
    );
    await waitFor(() =>
      expect(notify.error).toHaveBeenCalledWith(
        null,
        'studioGit.personal.failedReason.GIT_AUTHORIZATION_EXPIRED',
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('where').textContent).toBe('?account=git'),
    );
    unmount();
    // The host's own refusal, when it says what to fix.
    render(
      wrap(
        <AccountGit />,
        '/?account=git&error=GIT_AUTHORIZATION_REFUSED&hostError=redirect_uri_mismatch',
      ),
    );
    await waitFor(() =>
      expect(notify.error).toHaveBeenLastCalledWith(
        null,
        'studioGit.personal.hostError.redirect_uri_mismatch',
      ),
    );
  });

  it('tells a failure on the server from an authorization not started here, and an ended session', async () => {
    api.me.mockResolvedValue({ hosts: [] });
    for (const code of [
      'GIT_AUTHORIZATION_FAILED',
      'GIT_AUTHORIZATION_STATE_INVALID',
      'GIT_SESSION_EXPIRED',
    ]) {
      const { unmount } = render(
        wrap(<AccountGit />, `/?account=git&error=${code}`),
      );
      await waitFor(() =>
        expect(notify.error).toHaveBeenLastCalledWith(
          null,
          `studioGit.personal.failedReason.${code}`,
        ),
      );
      unmount();
    }
  });

  it('says when the app does not have the device flow on, with a link to its settings', async () => {
    api.me.mockResolvedValue({
      hosts: [
        {
          connection: choice(acme),
          methods: ['device'],
          authorization: null,
        },
      ],
    });
    api.startDeviceFlow.mockRejectedValue(
      new ApiClientError('The app does not allow the device flow.', {
        status: 400,
        reason: 'GIT_DEVICE_FLOW_DISABLED',
        payload: {
          error: {
            reason: 'GIT_DEVICE_FLOW_DISABLED',
            metadata: {
              appSettingsUrl:
                'https://github.com/organizations/acme/settings/apps/studio-acme',
            },
          },
        },
        method: 'POST',
        url: '/api/git/authorizations/c1/startDeviceFlow',
      }),
    );
    render(wrap(<AccountGit />));
    fireEvent.click(
      await screen.findByRole('button', { name: 'studioGit.personal.connect' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('studioGit.personal.device.disabled'),
    ).toBeTruthy();
    expect(
      within(dialog)
        .getByText('studioGit.personal.device.appSettings')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://github.com/organizations/acme/settings/apps/studio-acme');
    // Said in the dialog, not as "the request failed".
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('saves a pasted token, with the permissions it needs', async () => {
    api.me.mockResolvedValue({
      hosts: [
        {
          connection: choice(bot),
          methods: ['token'],
          authorization: null,
        },
      ],
    });
    api.savePersonalToken.mockResolvedValue({});
    render(wrap(<AccountGit />));
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'studioGit.personal.useToken',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('studioGit.providers.github.personalToken'),
    ).toBeTruthy();
    expect(
      within(dialog)
        .getByText('studioGit.providers.github.personalTokenLink')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://github.com/settings/personal-access-tokens/new');
    fireEvent.change(
      within(dialog).getByLabelText('studioGit.personal.token.label'),
      { target: { value: ' github_pat_x ' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'studioGit.personal.token.save',
      }),
    );
    await waitFor(() =>
      expect(api.savePersonalToken).toHaveBeenCalledWith('c3', 'github_pat_x'),
    );
  });
});
