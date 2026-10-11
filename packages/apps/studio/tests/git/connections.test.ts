// @vitest-environment node
/**
 * The git platform adapter as a workspace uses it, against the GitHub stand-in (never GitHub): connections (an app
 * found from its account, a token) with write-only credentials; a person's own authorization; repositories linked to
 * working directories from a connection's live list or created new; `nb-studio pr open` acting as the person or the
 * connection and linking at once; branch rules naming the agents' branches and linking theirs; keys in a title only
 * suggested; commit attribution and push credentials in a run's payload; merging as the person or the connection; and
 * an app's webhook.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGitConnections } from '../../server/git/connections.js';
import { INSTALLATION_TOKENS } from '../../server/git/installation-tokens.js';
import { createGitProviders } from '../../server/git/providers.js';
import { GitApiError } from '../../server/git/platform.js';
import { createWebhookRouter } from '../../server/git/routes.js';
import { createGitSecrets } from '../../server/git/sealing.js';
import { DELIVERIES, findRepo } from '../../server/git/store.js';
import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import {
  agentCoAuthor,
  ATTRIBUTION_PREFERENCE,
  type GitConnection,
} from '../../shared/git.js';
import {
  createBridgeHarness,
  TEST_SECRETS,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { API, bindingOf, signBody, tokenConnection } from './helpers.js';

const REPO = 'acme/studio';
const WEBHOOK_SECRET = 'whsec-app-0123456789';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  const software = (await h.projects.workflows.list(h.viewer('alice'))).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(h.viewer('alice'), software.id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

/** The stand-in's app installed on `acme`, as an app connection with its OAuth client and webhook secret. */
async function appConnection(): Promise<GitConnection> {
  h.github.app.installations.set('acme', '77');
  return h.gitConnections.create('alice', {
    kind: 'app',
    name: 'Acme app',
    appId: h.github.app.appId,
    privateKey: h.github.app.privateKey,
    account: 'acme',
    clientId: h.github.app.clientId,
    clientSecret: h.github.app.clientSecret,
    webhookSecret: WEBHOOK_SECRET,
  });
}

/** A project with `REPO` linked through `connection` as its working directory, and an issue in it. */
async function projectWithRepo(connection: GitConnection, statusKey = 'todo') {
  h.github.addRepo(REPO);
  const project = await h.projects.projects.create(alice(), { name: 'Web' });
  const resource = await h.projects.projects.addResource(alice(), project.id, {
    type: 'gitRepo',
    url: `https://github.com/${REPO}.git`,
    defaultRef: 'main',
    binding: bindingOf(connection, REPO, String(h.github.repos.get(REPO)!.id)),
  });
  const issue = await h.projects.issues.create(alice(), {
    title: 'Fix login',
    projectId: project.id,
    statusKey,
    start: false,
  });
  return { project, resource, issue };
}

/** Alice authorizes the app for herself, as the account `alice-gh`. */
async function authorizeAlice(connection: GitConnection) {
  const url = new URL(
    await h.gitConnections.authorizeUrl(
      'alice',
      connection.id,
      'https://studio.example.com/oauth/git/callback',
    ),
  );
  h.github.app.codes.set('code-a', {
    id: 11,
    login: 'alice-gh',
    name: 'Alice Liddell',
    email: 'alice@acme.dev',
  });
  await h.gitConnections.completeAuthorization('alice', {
    code: 'code-a',
    state: url.searchParams.get('state'),
    redirectUri: 'https://studio.example.com/oauth/git/callback',
  });
}

describe('connections', () => {
  it('keeps an app’s installation tokens sealed, reused across processes until it is removed', async () => {
    const app = await appConnection();
    const through = { connectionId: app.id, apiBaseUrl: API };
    const first = await h.gitConnections.connectionAuth(through);
    // Another process: the token kept in the database, not a new one.
    const other = createGitConnections({
      conn: () => h.projects.tx.read(),
      providers: createGitProviders([h.github.platform]),
      secrets: createGitSecrets(TEST_SECRETS),
    });
    expect(await other.connectionAuth(through)).toEqual(first);
    const push = await h.gitConnections.pushCredential(app.id, [REPO]);
    expect(await other.pushCredential(app.id, [REPO])).toEqual(push);
    expect(h.github.app.minted).toHaveLength(2);
    const rows = await h.projects.tx
      .read()
      .query.selectFrom(INSTALLATION_TOKENS)
      .selectAll()
      .execute();
    expect(rows).toHaveLength(2);
    expect(JSON.stringify(rows)).not.toContain(first.auth.token!);

    await h.gitConnections.remove(app.id);
    expect(
      await h.projects.tx
        .read()
        .query.selectFrom(INSTALLATION_TOKENS)
        .selectAll()
        .execute(),
    ).toEqual([]);
  });

  it('adds an app found from its account and a token, keeping every credential write-only', async () => {
    const app = await appConnection();
    expect(app).toMatchObject({
      kind: 'app',
      installationId: '77',
      hasPrivateKey: true,
      hasClientSecret: true,
      hasWebhookSecret: true,
      provider: 'github',
      personalMethods: ['oauth', 'device', 'token'],
      allowPersonalTokens: true,
      webhookUrl: `/api/webhooks/github/connections/${app.id}`,
    });
    const token = await tokenConnection(h, 'ghp_secret_token');
    expect(token).toMatchObject({
      kind: 'token',
      hasToken: true,
      personalMethods: ['token'],
    });
    // An administrator turns people's own tokens off; a provider Studio does not know is refused.
    expect(
      await h.gitConnections.update(token.id, { allowPersonalTokens: false }),
    ).toMatchObject({ allowPersonalTokens: false, personalMethods: [] });
    await expect(
      h.gitConnections.create('alice', {
        provider: 'gitlab',
        kind: 'token',
        name: 'Lab',
        token: 'x',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    const listed = JSON.stringify(await h.gitConnections.list());
    for (const secret of [
      'ghp_secret_token',
      WEBHOOK_SECRET,
      h.github.app.clientSecret,
      'PRIVATE KEY',
    ])
      expect(listed).not.toContain(secret);
    // Leaving a credential out keeps it; null removes it.
    const renamed = await h.gitConnections.update(token.id, { name: 'Bot' });
    expect(renamed).toMatchObject({ name: 'Bot', hasToken: true });
    await expect(
      h.gitConnections.update(app.id, { webhookSecret: 'short' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(
      h.gitConnections.create('alice', {
        kind: 'app',
        name: 'Nowhere',
        appId: h.github.app.appId,
        privateKey: h.github.app.privateKey,
        account: 'elsewhere',
      }),
    ).rejects.toMatchObject({ details: { code: 'GITHUB_APP_NOT_INSTALLED' } });
    expect(await h.gitConnections.choices()).toHaveLength(2);
  });

  it('hides every git entry point without a connection, and the issue page shows none', async () => {
    const project = await h.projects.projects.create(alice(), { name: 'Ops' });
    await h.projects.projects.addResource(alice(), project.id, {
      type: 'gitRepo',
      url: `https://github.com/${REPO}.git`,
    });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Task',
      projectId: project.id,
      start: false,
    });
    expect(await h.gitConnections.choices()).toEqual([]);
    expect(await h.git.list(alice(), issue.id)).toMatchObject({
      applicable: false,
    });
  });

  it('lets a person authorize the app for themselves, and forget it', async () => {
    const app = await appConnection();
    await authorizeAlice(app);
    expect(await h.gitConnections.personal('alice')).toMatchObject({
      hosts: [
        {
          connection: { id: app.id, name: 'Acme app' },
          methods: ['oauth', 'device', 'token'],
          authorization: {
            connectionId: app.id,
            login: 'alice-gh',
            email: 'alice@acme.dev',
            method: 'oauth',
            // It refreshes itself until its refresh token expires.
            expiresAt: expect.any(String),
          },
        },
      ],
    });
    expect(
      JSON.stringify(await h.gitConnections.personal('alice')),
    ).not.toMatch(/ghu_|ghr_/u);
    // A state that is not Studio's, or another person's, is refused.
    await expect(
      h.gitConnections.completeAuthorization('bob', {
        code: 'x',
        state: 'forged',
        redirectUri: 'x',
      }),
    ).rejects.toMatchObject({ details: { code: 'GIT_AUTHORIZATION_FAILED' } });
    const acting = await h.gitConnections.actingAuth(
      { connectionId: app.id, apiBaseUrl: API },
      'alice',
    );
    expect(acting.as).toBe('user');
    expect(acting.auth.token).toMatch(/^ghu_/u);
    await h.gitConnections.disconnect('alice', app.id);
    expect(
      (await h.gitConnections.personal('alice')).hosts[0]?.authorization,
    ).toBeNull();
    expect(
      (
        await h.gitConnections.actingAuth(
          { connectionId: app.id, apiBaseUrl: API },
          'alice',
        )
      ).as,
    ).toBe('connection');
  });
});

describe('a person’s own authorization without the web flow', () => {
  const bobGh = {
    id: 22,
    login: 'bob-gh',
    name: 'Bob',
    email: 'bob@acme.dev',
  };

  it('connects with a code entered on the host (the device flow)', async () => {
    const app = await appConnection();
    const started = await h.gitConnections.startDeviceFlow('bob', app.id);
    expect(started).toMatchObject({
      userCode: expect.stringMatching(/^WDJB-/u),
      verificationUri: 'https://github.com/login/device',
      interval: 5,
    });
    // The handle seals the device code: neither it nor anything the host gave shows.
    expect(started.handle).not.toContain('dc_');
    expect(
      await h.gitConnections.pollDeviceFlow('bob', app.id, started.handle),
    ).toMatchObject({ status: 'pending' });
    // Another person's poll, or another connection's, is refused.
    await expect(
      h.gitConnections.pollDeviceFlow('alice', app.id, started.handle),
    ).rejects.toMatchObject({ details: { code: 'GIT_AUTHORIZATION_FAILED' } });
    h.github.enterDeviceCode(started.userCode, bobGh);
    const polled = await h.gitConnections.pollDeviceFlow(
      'bob',
      app.id,
      started.handle,
    );
    expect(polled).toMatchObject({
      status: 'connected',
      authorization: { login: 'bob-gh', method: 'device' },
    });
    expect(JSON.stringify(polled)).not.toMatch(/ghu_|ghr_/u);
    const acting = await h.gitConnections.actingAuth(
      { connectionId: app.id, apiBaseUrl: API },
      'bob',
    );
    expect(acting.as).toBe('user');
    expect(h.github.users.get(acting.auth.token!)?.login).toBe('bob-gh');
  });

  it('reports a refused code, and an app that does not allow the device flow', async () => {
    const app = await appConnection();
    const started = await h.gitConnections.startDeviceFlow('bob', app.id);
    h.github.enterDeviceCode(started.userCode, 'denied');
    expect(
      await h.gitConnections.pollDeviceFlow('bob', app.id, started.handle),
    ).toEqual({ status: 'denied' });
    h.github.app.deviceFlow = false;
    await expect(
      h.gitConnections.startDeviceFlow('bob', app.id),
    ).rejects.toMatchObject({ details: { code: 'GIT_DEVICE_FLOW_DISABLED' } });
    // A token connection has no app to authorize.
    const token = await tokenConnection(h);
    await expect(
      h.gitConnections.startDeviceFlow('bob', token.id),
    ).rejects.toMatchObject({ details: { code: 'GIT_PERSONAL_UNAVAILABLE' } });
  });

  it('uses a personal access token checked against the host, with its expiry, and acts as it', async () => {
    const connection = await tokenConnection(h);
    h.github.tokens.add('github_pat_bob');
    h.github.users.set('github_pat_bob', bobGh);
    h.github.tokenExpirations.set('github_pat_bob', '2099-01-02 03:04:05 UTC');
    const stored = await h.gitConnections.usePersonalToken(
      'bob',
      connection.id,
      ' github_pat_bob ',
    );
    expect(stored).toEqual({
      connectionId: connection.id,
      login: 'bob-gh',
      name: 'Bob',
      email: 'bob@acme.dev',
      method: 'token',
      connectedAt: expect.any(String),
      expiresAt: '2099-01-02T03:04:05.000Z',
    });
    expect(
      JSON.stringify(await h.gitConnections.personal('bob')),
    ).not.toContain('github_pat_bob');
    const acting = await h.gitConnections.actingAuth(
      { connectionId: connection.id, apiBaseUrl: API },
      'bob',
    );
    expect(acting).toMatchObject({
      as: 'user',
      auth: { token: 'github_pat_bob' },
    });
    // A token the host refuses is not stored.
    await expect(
      h.gitConnections.usePersonalToken('alice', connection.id, 'ghp_wrong'),
    ).rejects.toMatchObject({ details: { code: 'INVALID_PERSONAL_TOKEN' } });
    expect(
      (await h.gitConnections.personal('alice')).hosts[0]?.authorization,
    ).toBeNull();
  });

  it('falls back on the connection once a personal token expired, and refuses tokens when turned off', async () => {
    const connection = await tokenConnection(h);
    h.github.tokens.add('github_pat_bob');
    h.github.users.set('github_pat_bob', bobGh);
    h.github.tokenExpirations.set('github_pat_bob', '2000-01-01 00:00:00 UTC');
    await expect(
      h.gitConnections.usePersonalToken('bob', connection.id, 'github_pat_bob'),
    ).rejects.toMatchObject({ details: { code: 'INVALID_PERSONAL_TOKEN' } });
    h.github.tokenExpirations.set(
      'github_pat_bob',
      new Date(Date.now() + 30_000)
        .toISOString()
        .replace('T', ' ')
        .replace(/\.\d+Z$/u, ' UTC'),
    );
    await h.gitConnections.usePersonalToken(
      'bob',
      connection.id,
      'github_pat_bob',
    );
    // Within a minute of its expiry it no longer acts.
    expect(
      (
        await h.gitConnections.actingAuth(
          { connectionId: connection.id, apiBaseUrl: API },
          'bob',
        )
      ).as,
    ).toBe('connection');
    await h.gitConnections.update(connection.id, {
      allowPersonalTokens: false,
    });
    await expect(
      h.gitConnections.usePersonalToken('bob', connection.id, 'github_pat_bob'),
    ).rejects.toMatchObject({
      details: { code: 'GIT_PERSONAL_TOKENS_DISABLED' },
    });
  });
});

describe('what a person can link, in order', () => {
  it('lists only connections offering a way, never a demo one, and keeps one already linked', async () => {
    const connection = await tokenConnection(h);
    await h.gitConnections.createDemo('alice', {
      name: 'Demo',
      webUrl: 'https://github.com',
      apiBaseUrl: API,
      account: 'demo-org',
    });
    const closed = await h.gitConnections.create('alice', {
      kind: 'token',
      name: 'Closed',
      token: 'ghp_read',
      account: 'acme',
    });
    await h.gitConnections.update(closed.id, { allowPersonalTokens: false });
    const ids = async () =>
      (await h.gitConnections.personal('bob')).hosts.map(
        (host) => host.connection.id,
      );
    expect(await ids()).toEqual([connection.id]);
    // Linked, then no longer allowed: still listed, so it can be disconnected.
    h.github.tokens.add('github_pat_bob');
    h.github.users.set('github_pat_bob', {
      id: 22,
      login: 'bob-gh',
      name: 'Bob',
      email: 'bob@acme.dev',
    });
    await h.gitConnections.usePersonalToken(
      'bob',
      connection.id,
      'github_pat_bob',
    );
    await h.gitConnections.update(connection.id, {
      allowPersonalTokens: false,
    });
    expect((await h.gitConnections.personal('bob')).hosts).toMatchObject([
      {
        connection: { id: connection.id },
        methods: [],
        authorization: { login: 'bob-gh' },
      },
    ]);
    expect((await h.gitConnections.personal('alice')).hosts).toEqual([]);
  });

  it('lists connections oldest first, each with when it was added', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const older = await tokenConnection(h);
      vi.setSystemTime(new Date('2026-03-01T00:00:00Z'));
      const newer = await tokenConnection(h);
      expect(await h.gitConnections.choices()).toMatchObject([
        { id: older.id, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: newer.id, createdAt: '2026-03-01T00:00:00.000Z' },
      ]);
      expect(
        (await h.gitConnections.personal('bob')).hosts.map(
          (host) => host.connection.id,
        ),
      ).toEqual([older.id, newer.id]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('several installations of one app', () => {
  it('adds another installation with the app’s credentials, and counts what each reaches and serves', async () => {
    const app = await appConnection();
    h.github.app.installations.set('globex', '88');
    const globex = await h.gitConnections.create('alice', {
      kind: 'app',
      sameAppAs: app.id,
      name: 'Globex',
      account: 'globex',
    });
    expect(globex).toMatchObject({
      kind: 'app',
      appId: app.appId,
      installationId: '88',
      hasPrivateKey: true,
      hasClientSecret: true,
      hasWebhookSecret: true,
      personalMethods: ['oauth', 'device', 'token'],
      usedBy: 0,
    });
    await expect(
      h.gitConnections.create('alice', {
        kind: 'app',
        sameAppAs: app.id,
        name: 'Acme again',
        account: 'ACME',
      }),
    ).rejects.toMatchObject({ details: { code: 'GIT_INSTALLATION_EXISTS' } });
    await expect(
      h.gitConnections.create('alice', {
        kind: 'app',
        sameAppAs: app.id,
        name: 'Sneaky',
        account: 'initech',
        privateKey: 'x',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    // People authorize the app once, whichever installation they go through.
    expect(
      (await h.gitConnections.personal('alice')).hosts.map(
        (host) => host.connection.id,
      ),
    ).toEqual([app.id]);

    const { project, resource } = await projectWithRepo(globex);
    const listed = await h.gitConnections.list();
    expect(listed.map((item) => [item.name, item.usedBy])).toEqual([
      ['Acme app', 0],
      ['Globex', 1],
    ]);
    // What it counts, each working directory with its project.
    expect(await h.gitConnections.uses(globex.id)).toEqual([
      {
        resourceId: resource.id,
        projectId: project.id,
        projectName: 'Web',
        repo: REPO,
      },
    ]);
    expect(await h.gitConnections.uses(app.id)).toEqual([]);
    expect(await h.gitConnections.reach(globex.id)).toEqual({
      repositories: 1,
      more: false,
    });
  });

  it('takes the app’s webhook deliveries for every installation’s repositories', async () => {
    const app = await appConnection();
    h.github.app.installations.set('globex', '88');
    const globex = await h.gitConnections.create('alice', {
      kind: 'app',
      sameAppAs: app.id,
      name: 'Globex',
      account: 'globex',
    });
    const { issue, resource } = await projectWithRepo(globex);
    await h.git.repoSettings(alice(), resource.id);
    h.github.addPull(REPO, {
      number: 5,
      head: { ref: `agent/${issue.identifier}`, sha: 'g1' },
    });
    const body = JSON.stringify({
      action: 'opened',
      repository: { full_name: REPO },
      installation: { id: 88 },
      pull_request: {
        ...h.github.pull(REPO, 5),
        html_url: `https://github.com/${REPO}/pull/5`,
      },
    });
    const response = await createWebhookRouter(h.git.receiveWebhook).request(
      `/webhooks/github/connections/${app.id}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-github-event': 'pull_request',
          'x-github-delivery': 'g-1',
          'x-hub-signature-256': signBody(WEBHOOK_SECRET, body),
        },
        body,
      },
    );
    expect(((await response.json()) as any).data).toMatchObject({
      ignored: false,
    });
  });
});

describe('linking repositories', () => {
  it('lists a connection’s repositories live, searched by name, and creates a protected one', async () => {
    const app = await appConnection();
    for (const name of ['web', 'api', 'web-admin'])
      h.github.addRepo(`acme/${name}`);
    const all = await h.gitConnections.listRepos(app.id, {});
    expect(all.items.map((repo) => repo.fullName)).toEqual([
      'acme/web',
      'acme/api',
      'acme/web-admin',
    ]);
    const searched = await h.gitConnections.listRepos(app.id, { query: 'WEB' });
    expect(searched.items.map((repo) => repo.fullName)).toEqual([
      'acme/web',
      'acme/web-admin',
    ]);
    const created = await h.gitConnections.createRepo(app.id, {
      name: 'fresh',
      private: true,
    });
    expect(created).toMatchObject({
      protected: true,
      repo: { fullName: 'acme/fresh', defaultBranch: 'main' },
    });
    await expect(
      h.gitConnections.createRepo(app.id, { name: 'bad name', private: true }),
    ).rejects.toMatchObject({ details: { code: 'INVALID_REPO_NAME' } });
  });

  it('lists the template repositories a connection reaches and a repository’s workflows', async () => {
    const app = await appConnection();
    h.github.addRepo('acme/web');
    h.github.addRepo('acme/starter', { is_template: true });
    h.github.addWorkflow('acme/starter', {
      path: '.github/workflows/nb-studio-init.yml',
    });
    expect(
      (await h.gitConnections.templateRepos(app.id, {})).items.map(
        (repo) => repo.fullName,
      ),
    ).toEqual(['acme/starter']);
    expect(
      await h.gitConnections.workflows(app.id, 'acme/starter'),
    ).toMatchObject([{ path: '.github/workflows/nb-studio-init.yml' }]);
    await expect(
      h.gitConnections.workflows(app.id, 'not a name'),
    ).rejects.toMatchObject({ details: { code: 'INVALID_REPO' } });
  });

  it('reads the template repositories one page of the host’s at a time, searched by name', async () => {
    const app = await appConnection();
    for (let index = 0; index < 100; index += 1)
      h.github.addRepo(`acme/app-${String(index).padStart(3, '0')}`);
    h.github.addRepo('acme/starter', { is_template: true });
    h.github.addRepo('acme/kit', { is_template: true });
    const first = await h.gitConnections.templateRepos(app.id, {});
    // The first hundred hold no template: the page is empty, and says there is more to read.
    expect(first).toEqual({ items: [], hasMore: true });
    const second = await h.gitConnections.templateRepos(app.id, { page: 2 });
    expect(second.items.map((repo) => repo.fullName)).toEqual([
      'acme/starter',
      'acme/kit',
    ]);
    expect(second.hasMore).toBe(false);
    expect(
      (
        await h.gitConnections.templateRepos(app.id, { page: 2, query: 'KIT' })
      ).items.map((repo) => repo.fullName),
    ).toEqual(['acme/kit']);
  });

  it('checks a template repository it can read, a public one of another account included', async () => {
    const app = await appConnection();
    h.github.addRepo('acme/starter', { is_template: true });
    h.github.addRepo('nocobase/app-template', { is_template: true });
    h.github.addRepo('acme/web');
    h.roles.set('bob', 'none');
    const url = (repo: string) =>
      `/git/connections/${app.id}/templateRepositories/${repo}`;
    for (const repo of ['acme/starter', 'nocobase/app-template']) {
      const found = await h.request('GET', url(repo), { user: 'alice' });
      expect(found.status).toBe(200);
      expect(found.body.data).toMatchObject({
        fullName: repo,
        isTemplate: true,
      });
    }
    const plain = await h.request('GET', url('acme/web'), { user: 'alice' });
    expect(plain.status).toBe(400);
    expect(plain.body.error.reason).toBe('NOT_A_TEMPLATE_REPO');
    const missing = await h.request('GET', url('acme/gone'), {
      user: 'alice',
    });
    expect(missing.status).toBe(404);
    expect(missing.body.error.reason).toBe('TEMPLATE_REPO_NOT_FOUND');
    // Only someone who may create projects or link repositories.
    const denied = await h.request('GET', url('acme/starter'), {
      user: 'bob',
    });
    expect(denied.status).toBe(403);
  });

  it('says where the repositories a connection reaches are chosen on the host', async () => {
    const app = await appConnection();
    await tokenConnection(h);
    // The installation's page as GitHub answered it when the connection was saved; a token's settings.
    const installation =
      'https://github.com/organizations/acme/settings/installations/77';
    expect(app.repositoryAccessUrl).toBe(installation);
    expect(
      (await h.gitConnections.choices()).map((choice) => [
        choice.kind,
        choice.repositoryAccessUrl,
      ]),
    ).toEqual([
      ['app', installation],
      ['token', 'https://github.com/settings/tokens'],
    ]);
  });

  it('stores the binding on the working directory and watches the repository through its connection', async () => {
    const app = await appConnection();
    const { resource } = await projectWithRepo(app);
    expect(resource.binding).toEqual(
      bindingOf(app, REPO, String(h.github.repos.get(REPO)!.id)),
    );
    const settings = await h.git.repoSettings(alice(), resource.id);
    expect(settings).toMatchObject({
      repo: REPO,
      webUrl: `https://github.com/${REPO}`,
      connection: { id: app.id, kind: 'app' },
      branchRules: ['agent/{key}'],
    });
    expect(
      (await findRepo(h.projects.tx.read(), API, REPO))?.connectionId,
    ).toBe(app.id);
    // A directory refuses a binding.
    const project = await h.projects.projects.create(alice(), { name: 'Ops' });
    await expect(
      h.projects.projects.addResource(alice(), project.id, {
        type: 'gitRepo',
        url: `https://github.com/${REPO}.git`,
        binding: { provider: 'github' } as never,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_BINDING' });
  });
});

describe('nb-studio pr open', () => {
  async function agentRun(connection: GitConnection, beforeClaim?: () => void) {
    const agentId = await h.createAgent({
      actions: [
        'pm.issues/view',
        'pm.issues/edit',
        'pm.issues/comment',
        'studio.git/open-pr',
      ],
    });
    const { issue, resource } = await projectWithRepo(connection);
    await h.projects.issues.update(alice(), issue.id, {
      revision: (await h.projects.issueQueries.detail(alice(), issue.id))
        .revision,
      executor: { type: 'agent', id: agentId },
    });
    beforeClaim?.();
    const payload = await h.claimOne();
    return { agentId, issue, resource, payload };
  }

  it('records signing failures and never claims the run without its push credential', async () => {
    const app = await appConnection();
    const signing = vi
      .spyOn(h.gitConnections, 'pushCredential')
      .mockRejectedValue(
        new GitApiError(0, 'synthetic-secret-that-must-not-reach-the-run'),
      );
    const { issue, payload } = await agentRun(app);
    expect(payload).toBeUndefined();
    const [run] = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    expect(run).toMatchObject({
      status: 'queued',
      failureDetail: expect.stringContaining(
        'GitHub could not be reached or the request timed out.',
      ),
    });
    expect(run?.failureDetail).toContain('Check Settings > Git');
    expect(run?.failureDetail).not.toContain('synthetic-secret');
    // A retry prepares access again and may be claimed after signing recovers.
    signing.mockRestore();
    const recovered = await h.claimOne();
    expect(recovered.workspace.git.credentials[0].password).toMatch(/^ghs_/u);
  });

  it('ends the run with an actionable reason after signing is repeatedly refused', async () => {
    const app = await appConnection();
    const { issue, payload } = await agentRun(app, () => {
      h.github.outage = { status: 503, times: 3 };
    });
    expect(payload).toBeUndefined();
    expect(await h.claimOne()).toBeUndefined();
    expect(await h.claimOne()).toBeUndefined();
    const [run] = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    expect(run).toMatchObject({
      status: 'failed',
      failureDetail: expect.stringContaining(
        'GitHub refused signing (HTTP 503)',
      ),
    });
    expect(run?.failureDetail).toContain('Check Settings > Git');
  });

  it('refuses an absent preparation result after the framework catches a prepare exception', async () => {
    const app = await appConnection();
    const { issue, payload } = await agentRun(app, () => {
      vi.spyOn(h.git, 'repoOfResource').mockRejectedValue(
        new Error('synthetic-private-error'),
      );
    });
    expect(payload).toBeUndefined();
    const [run] = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    expect(run?.failureDetail).toContain('could not prepare repository access');
    expect(run?.failureDetail).not.toContain('synthetic-private-error');
    vi.restoreAllMocks();
  });

  it('explains a PR 422 only when GitHub confirms the head branch is missing', async () => {
    const app = await appConnection();
    const { payload } = await agentRun(app);
    const head = payload.workspace.dirs.find(
      (dir: { kind: string }) => dir.kind === 'repo',
    ).branch;
    h.github.failures.set(`${REPO}/pulls`, 422);
    const request = () =>
      h.request('POST', '/git/pullRequests/open', {
        runToken: payload.cli.credential.content.token as string,
        body: { title: 'Fix login' },
      });
    const missing = await request();
    expect(missing.body.error.reason).toBe('GITHUB_INVALID');
    expect(missing.body.error.message).toContain(
      `head branch ${head} is not on GitHub`,
    );
    expect(missing.body.error.message).toContain(
      'Push the branch successfully',
    );
    h.github.failures.set(`${REPO}/git/ref`, 403);
    const unreadable = await request();
    expect(unreadable.body.error.reason).toBe('GITHUB_INVALID');
    expect(unreadable.body.error.message).not.toContain('is not on GitHub');
    h.github.failures.delete(`${REPO}/git/ref`);
    h.github.pushCommits(REPO, head, 'new-head');
    const existing = await request();
    expect(existing.body.error.reason).toBe('GITHUB_INVALID');
    expect(existing.body.error.message).not.toContain('is not on GitHub');
  });

  it('fails preparation for an app without an installation instead of using machine credentials', async () => {
    const app = await appConnection();
    await h.projects.tx
      .read()
      .query.updateTable('studioGitConnections')
      .set({ installationId: null })
      .where('id', '=', app.id)
      .execute();
    const { issue, payload } = await agentRun(app);
    expect(payload).toBeUndefined();
    const [run] = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    expect(run?.failureDetail).toContain('could not issue a credential');
  });

  it('opens through the connection on the run’s branch and links the pull request at once', async () => {
    const app = await appConnection();
    const { agentId, issue, payload } = await agentRun(app);
    const opened = await h.request('POST', '/git/pullRequests/open', {
      runToken: payload.cli.credential.content.token as string,
      body: { title: `${issue.identifier}: Fix login`, body: 'Details.' },
    });
    expect(opened.status).toBe(201);
    expect(opened.body.meta.message).toContain('linked to the issue');
    expect(opened.body.data).toMatchObject({
      repo: REPO,
      number: 1,
      headRef: `agent/${issue.identifier}`,
      state: 'open',
    });
    // Alice has no authorization of her own: the app's installation token opened it.
    const create = h.github.requests.find(
      (request) =>
        request.method === 'POST' && request.path === `/repos/${REPO}/pulls`,
    )!;
    expect(create.token).toMatch(/^ghs_/u);
    expect(create.body).toMatchObject({ base: 'main', body: 'Details.' });
    expect((await h.git.list(alice(), issue.id)).data).toMatchObject([
      { number: 1, linkedBy: { type: 'agent', id: agentId } },
    ]);
  });

  it('opens as the person who woke the agent when they authorized the app', async () => {
    const app = await appConnection();
    await authorizeAlice(app);
    const { issue, payload } = await agentRun(app);
    const opened = await h.request('POST', '/git/pullRequests/open', {
      runToken: payload.cli.credential.content.token as string,
      body: { title: `${issue.identifier}: Fix login`, draft: true },
    });
    expect(opened.status).toBe(201);
    const create = h.github.requests.find(
      (request) =>
        request.method === 'POST' && request.path === `/repos/${REPO}/pulls`,
    )!;
    expect(create.token).toMatch(/^ghu_/u);
    expect(h.github.pull(REPO, 1).user.login).toBe('alice-gh');
  });

  it('refuses without a linked repository', async () => {
    const agentId = await h.createAgent({
      actions: ['pm.issues/view', 'pm.issues/edit', 'studio.git/open-pr'],
    });
    await h.projects.issues.create(alice(), {
      title: 'Loose',
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    const refused = await h.request('POST', '/git/pullRequests/open', {
      runToken: payload.cli.credential.content.token as string,
      body: { title: 'x' },
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error.reason).toBe('NO_REPOSITORY');
  });

  it('gives the run its branch by the first rule, the person as author with the agent as co-author, and a push credential', async () => {
    const app = await appConnection();
    await authorizeAlice(app);
    const { resource } = await projectWithRepo(app);
    await h.git.updateRepoSettings(alice(), resource.id, {
      branchRules: ['work/{key}', 'agent/{key}'],
    });
    const { payload, agentId } = await agentRun(app);
    const repoDir = payload.workspace.dirs.find(
      (dir: { kind: string }) => dir.kind === 'repo',
    );
    expect(repoDir.branch).toMatch(/^work\/[A-Z]+-\d+$/u);
    const agent = await h.agents.agents.get(agentId);
    expect(payload.workspace.git).toMatchObject({
      author: { name: 'Alice Liddell', email: 'alice@acme.dev' },
      trailers: [agentCoAuthor(agent)],
      credentials: [
        {
          url: `https://github.com/${REPO}.git`,
          username: 'x-access-token',
          password: expect.stringMatching(/^ghs_/u),
        },
      ],
    });
    expect(h.github.app.minted.at(-1)?.repositories).toEqual(['studio']);
  });

  it('names the person alone when they choose so, and the project’s default otherwise', async () => {
    const connection = await tokenConnection(h);
    const { project } = await projectWithRepo(connection);
    await h.git.setProjectSettings(alice(), project.id, {
      attribution: 'meOnly',
    });
    const agentId = await h.createAgent({ actions: ['pm.issues/view'] });
    await h.projects.issues.create(alice(), {
      title: 'Second',
      projectId: project.id,
      executor: { type: 'agent', id: agentId },
    });
    const payload = await h.claimOne();
    // No authorization of her own: her profile; a token connection gives no push credential.
    expect(payload.workspace.git).toEqual({
      author: { name: 'alice', email: expect.any(String) },
    });
    h.preferences.set(`alice:${ATTRIBUTION_PREFERENCE}`, 'withAgent');
    await h.projects.issues.create(alice(), {
      title: 'Third',
      projectId: project.id,
      executor: { type: 'agent', id: agentId },
    });
    const next = await h.claimOne();
    expect(next.workspace.git.trailers).toHaveLength(1);
  });
});

describe('branch rules and suggestions', () => {
  it('links a pull request on a rule’s branch, and only suggests one that names the key', async () => {
    const connection = await tokenConnection(h);
    const { resource, issue } = await projectWithRepo(connection);
    await h.git.updateRepoSettings(alice(), resource.id, {
      branchRules: ['feature/{key}-work'],
    });
    h.github.addPull(REPO, {
      number: 1,
      head: { ref: `feature/${issue.identifier}-work`, sha: 'a1' },
    });
    h.github.addPull(REPO, {
      number: 2,
      title: `${issue.identifier}: related`,
      head: { ref: 'random', sha: 'b1' },
    });
    const repo = (await findRepo(h.projects.tx.read(), API, REPO))!;
    await h.git.pollRepo(repo);
    const list = await h.git.list(alice(), issue.id);
    expect(list.data.map((pr) => pr.number)).toEqual([1]);
    expect(list.suggestions).toMatchObject([{ number: 2, repo: REPO }]);
    // Confirming links it; dismissing the other keeps it from coming back.
    await h.git.link(alice(), issue.id, list.suggestions[0]!.url, {
      type: 'user',
      id: 'alice',
    });
    const after = await h.git.list(alice(), issue.id);
    expect(after.data.map((pr) => pr.number)).toEqual([1, 2]);
    expect(after.suggestions).toEqual([]);
    h.github.addPull(REPO, {
      number: 3,
      title: `see ${issue.identifier}`,
      head: { ref: 'other', sha: 'c1' },
    });
    await h.git.pollRepo((await findRepo(h.projects.tx.read(), API, REPO))!);
    const third = (await h.git.list(alice(), issue.id)).suggestions[0]!;
    await h.git.dismissSuggestion(alice(), issue.id, third.pullRequestId);
    h.github.pull(REPO, 3).title = `again ${issue.identifier}`;
    await h.git.pollRepo((await findRepo(h.projects.tx.read(), API, REPO))!);
    expect((await h.git.list(alice(), issue.id)).suggestions).toEqual([]);
  });
});

describe('merge identity', () => {
  async function readyPull(connection: GitConnection) {
    const { issue } = await projectWithRepo(connection);
    h.github.addPull(REPO, { number: 9, head: { ref: 'x', sha: 'm1' } });
    h.github.setStatus(REPO, 'm1', 'success');
    const { pullRequest } = await h.git.link(
      alice(),
      issue.id,
      `https://github.com/${REPO}/pull/9`,
      { type: 'user', id: 'alice' },
    );
    return { issue, pullRequest };
  }

  const mergeToken = () =>
    h.github.requests.findLast((request) => request.path.endsWith('/merge'))
      ?.token;

  it('merges as the connection when the person has no authorization of their own', async () => {
    const app = await appConnection();
    const { issue, pullRequest } = await readyPull(app);
    const merged = await h.git.merge(alice(), issue.id, pullRequest.id, 'm1');
    expect(merged.state).toBe('merged');
    expect(mergeToken()).toMatch(/^ghs_/u);
    expect(h.github.pull(REPO, 9).merged_by?.login).toBe('studio-app[bot]');
  });

  it('merges as the person when they authorized the app', async () => {
    const app = await appConnection();
    await authorizeAlice(app);
    const { issue, pullRequest } = await readyPull(app);
    await h.git.merge(alice(), issue.id, pullRequest.id, 'm1');
    expect(mergeToken()).toMatch(/^ghu_/u);
    expect(h.github.pull(REPO, 9).merged_by?.login).toBe('alice-gh');
  });
});

describe('an app’s webhook', () => {
  it('verifies with the connection’s secret and finds the repository it names', async () => {
    const app = await appConnection();
    const { issue } = await projectWithRepo(app);
    await h.git.repoSettings(
      alice(),
      (await h.projects.projects.get(alice(), issue.projectId!)).resources[0]!
        .id,
    );
    h.github.addPull(REPO, {
      number: 4,
      head: { ref: `agent/${issue.identifier}`, sha: 'w1' },
    });
    const router = createWebhookRouter(h.git.receiveWebhook);
    const send = async (
      payload: unknown,
      secret = WEBHOOK_SECRET,
      id = 'd-1',
    ) => {
      const body = JSON.stringify(payload);
      const response = await router.request(
        `/webhooks/github/connections/${app.id}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-github-event': 'pull_request',
            'x-github-delivery': id,
            'x-hub-signature-256': signBody(secret, body),
          },
          body,
        },
      );
      return { status: response.status, body: (await response.json()) as any };
    };
    const pull = h.github.pull(REPO, 4);
    const payload = {
      action: 'opened',
      repository: { full_name: REPO },
      installation: { id: 77 },
      pull_request: { ...pull, html_url: `https://github.com/${REPO}/pull/4` },
    };
    expect((await send(payload, 'not-the-secret')).status).toBe(401);
    expect((await send(payload)).body.data).toMatchObject({
      event: 'pull_request',
      ignored: false,
    });
    expect((await h.git.list(alice(), issue.id)).data).toMatchObject([
      { number: 4, linkedBy: { type: 'system' } },
    ]);
    expect(
      (
        await send(
          { ...payload, repository: { full_name: 'acme/unknown' } },
          WEBHOOK_SECRET,
          'd-2',
        )
      ).body.data,
    ).toMatchObject({ ignored: true, reason: 'otherRepository' });
    // Another repository's delivery does not overwrite the last delivery Studio acted on.
    expect((await h.gitConnections.get(app.id)).lastDelivery).toMatchObject({
      event: 'pull_request',
      status: 'processed',
    });
    expect(
      await h.projects.tx
        .read()
        .query.selectFrom(DELIVERIES)
        .select('deliveryId')
        .where('repoId', '=', app.id)
        .execute(),
    ).toEqual([{ deliveryId: 'd-1' }]);
  });
});
