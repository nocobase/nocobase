// @vitest-environment node
/**
 * Creating a GitHub App from Studio's manifest, against the GitHub stand-in (never GitHub): the form the browser posts
 * (to a person's or an organization's settings, with the permissions and events Studio needs, the webhook off when
 * GitHub cannot reach Studio), the sealed state GitHub hands back, the code converted into the app's credentials, and
 * the return from installing it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createGitConnections } from '../../server/git/connections.js';
import { createGitProviders } from '../../server/git/providers.js';
import { createGitSecrets } from '../../server/git/sealing.js';
import { webhooksReachable } from '../../shared/git.js';
import {
  createBridgeHarness,
  TEST_SECRETS,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

const STUDIO = 'https://studio.example.com';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const urls = (publicOrigin: string | null = STUDIO) => {
  const origin = publicOrigin ?? 'http://localhost:13000';
  return {
    homepage: `${origin}/`,
    redirect: `${origin}/oauth/git/manifest`,
    callback: `${origin}/oauth/git/callback`,
    setup: `${origin}/oauth/git/setup`,
    webhook: (id: string) => `${origin}/api/webhooks/github/connections/${id}`,
    publicOrigin,
  };
};

/** Starts the manifest flow, then GitHub creates the app and sends the browser back with a code and the state. */
async function createApp(
  input: Record<string, unknown> = {},
  publicOrigin: string | null = STUDIO,
) {
  const form = await h.gitConnections.startAppManifest(
    'alice',
    input,
    urls(publicOrigin),
  );
  const state = new URL(form.action).searchParams.get('state')!;
  h.github.app.manifestCodes.set('mc-1', {
    slug: 'studio-acme',
    owner:
      typeof input.organization === 'string' ? input.organization : 'alice-gh',
    organization: typeof input.organization === 'string',
    webhookSecret: 'whsec-from-github-0123',
  });
  return { form, state };
}

describe('the manifest', () => {
  it('asks GitHub for an app with Studio’s permissions, events and URLs', async () => {
    const { form, state } = await createApp();
    const action = new URL(form.action);
    expect(`${action.origin}${action.pathname}`).toBe(
      'https://github.com/settings/apps/new',
    );
    expect(state).toBeTruthy();
    expect(form.webhookActive).toBe(true);
    const manifest = JSON.parse(form.manifest) as Record<string, unknown>;
    expect(manifest).toMatchObject({
      name: 'Studio studio.example.com',
      url: `${STUDIO}/`,
      redirect_url: `${STUDIO}/oauth/git/manifest`,
      callback_urls: [`${STUDIO}/oauth/git/callback`],
      setup_url: `${STUDIO}/oauth/git/setup`,
      setup_on_update: true,
      request_oauth_on_install: false,
      public: false,
      default_permissions: {
        contents: 'write',
        pull_requests: 'write',
        checks: 'read',
        statuses: 'read',
        metadata: 'read',
        actions: 'write',
        administration: 'write',
        workflows: 'write',
      },
      default_events: [
        'pull_request',
        'check_suite',
        'check_run',
        'status',
        'push',
        'workflow_run',
      ],
    });
    const hook = manifest.hook_attributes as { url: string; active: boolean };
    expect(hook.active).toBe(true);
    expect(hook.url).toMatch(
      /^https:\/\/studio\.example\.com\/api\/webhooks\/github\/connections\/[\w-]+$/u,
    );
    // Nothing secret travels in the form.
    expect(form.manifest).not.toContain('PRIVATE KEY');
  });

  it('goes to an organization’s settings, and to a GitHub Enterprise Server', async () => {
    const org = await h.gitConnections.startAppManifest(
      'alice',
      { organization: 'acme' },
      urls(),
    );
    expect(new URL(org.action).pathname).toBe(
      '/organizations/acme/settings/apps/new',
    );
    const enterprise = await h.gitConnections.startAppManifest(
      'alice',
      { webUrl: 'https://git.corp.example/' },
      urls(),
    );
    expect(new URL(enterprise.action).origin).toBe('https://git.corp.example');
    await expect(
      h.gitConnections.startAppManifest(
        'alice',
        { organization: 'not an org' },
        urls(),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });

  it('turns the webhook off when GitHub cannot reach Studio, which then polls', async () => {
    for (const origin of [null, 'http://localhost:13000', 'http://10.0.0.5']) {
      const form = await h.gitConnections.startAppManifest(
        'alice',
        {},
        urls(origin),
      );
      expect(form.webhookActive).toBe(false);
      expect(
        (JSON.parse(form.manifest) as { hook_attributes: { active: boolean } })
          .hook_attributes.active,
      ).toBe(false);
    }
    // A self-hosted server on the same network reaches a private address.
    expect(
      webhooksReachable(
        'http://10.0.0.5',
        'https://git.corp.example',
        'https://github.com',
      ),
    ).toBe(true);
    expect(
      webhooksReachable(
        'http://localhost:13000',
        'https://git.corp.example',
        'https://github.com',
      ),
    ).toBe(false);
  });
});

describe('the code GitHub sends back', () => {
  it('becomes an app connection awaiting its installation, then the install page', async () => {
    const { state } = await createApp();
    const created = await h.gitConnections.completeAppManifest('alice', {
      code: 'mc-1',
      state,
    });
    const install = new URL(created.installUrl);
    expect(`${install.origin}${install.pathname}`).toBe(
      'https://github.com/apps/studio-acme/installations/new',
    );
    expect(install.searchParams.get('state')).toBeTruthy();
    const connection = await h.gitConnections.get(created.connectionId);
    expect(connection).toMatchObject({
      kind: 'app',
      name: 'Studio studio-acme',
      appId: h.github.app.appId,
      clientId: h.github.app.clientId,
      installationId: null,
      hasPrivateKey: true,
      hasClientSecret: true,
      hasWebhookSecret: true,
      appSlug: 'studio-acme',
      installUrl: 'https://github.com/apps/studio-acme/installations/new',
      appSettingsUrl: 'https://github.com/settings/apps/studio-acme',
      personalMethods: ['oauth', 'device', 'token'],
    });
    // Not installed anywhere: nothing about git shows yet, and nobody connects through it.
    expect(await h.gitConnections.choices()).toEqual([]);
    expect((await h.gitConnections.personal('alice')).hosts).toEqual([]);
    const listed = JSON.stringify(await h.gitConnections.list());
    for (const secret of [
      h.github.app.clientSecret,
      'whsec-from-github-0123',
      'PRIVATE KEY',
    ])
      expect(listed).not.toContain(secret);
    // A reload of the return finds the app stored already.
    expect(
      (
        await h.gitConnections.completeAppManifest('alice', {
          code: 'mc-1',
          state,
        })
      ).connectionId,
    ).toBe(created.connectionId);
  });

  it('keeps no webhook secret when the webhook starts off', async () => {
    const { state } = await createApp({}, null);
    const created = await h.gitConnections.completeAppManifest('alice', {
      code: 'mc-1',
      state,
    });
    expect(await h.gitConnections.get(created.connectionId)).toMatchObject({
      hasWebhookSecret: false,
    });
  });

  it('names an organization’s app settings', async () => {
    const { state } = await createApp({ organization: 'acme' });
    const created = await h.gitConnections.completeAppManifest('alice', {
      code: 'mc-1',
      state,
    });
    expect(
      (await h.gitConnections.get(created.connectionId)).appSettingsUrl,
    ).toBe('https://github.com/organizations/acme/settings/apps/studio-acme');
  });

  it('refuses a state Studio did not seal, another person’s, an expired one, and an OAuth state', async () => {
    const { state } = await createApp();
    const refused = { details: { code: 'GIT_APP_MANIFEST_FAILED' } };
    await expect(
      h.gitConnections.completeAppManifest('alice', {
        code: 'mc-1',
        state: 'forged',
      }),
    ).rejects.toMatchObject(refused);
    await expect(
      h.gitConnections.completeAppManifest('bob', { code: 'mc-1', state }),
    ).rejects.toMatchObject(refused);
    const later = createGitConnections({
      conn: () => h.projects.tx.read(),
      providers: createGitProviders([h.github.platform]),
      secrets: createGitSecrets(TEST_SECRETS),
      now: () => new Date(Date.now() + 2 * 3600 * 1000),
    });
    await expect(
      later.completeAppManifest('alice', { code: 'mc-1', state }),
    ).rejects.toMatchObject(refused);
    // The manifest's state completes no person's authorization.
    await expect(
      h.gitConnections.completeAuthorization('alice', {
        code: 'mc-1',
        state,
        redirectUri: `${STUDIO}/oauth/git/callback`,
      }),
    ).rejects.toMatchObject({
      details: { code: 'GIT_AUTHORIZATION_STATE_INVALID' },
    });
    // A code GitHub does not know.
    h.github.app.manifestCodes.clear();
    await expect(
      h.gitConnections.completeAppManifest('alice', { code: 'mc-1', state }),
    ).rejects.toMatchObject({ details: { code: 'GITHUB_NOT_FOUND' } });
    expect(await h.gitConnections.list()).toEqual([]);
  });
});

describe('the return from installing the app', () => {
  async function created() {
    const { state } = await createApp();
    const app = await h.gitConnections.completeAppManifest('alice', {
      code: 'mc-1',
      state,
    });
    return {
      id: app.connectionId,
      installState: new URL(app.installUrl).searchParams.get('state'),
    };
  }

  it('records the installation and its account, checked with the app’s own credentials', async () => {
    const app = await created();
    h.github.app.installations.set('acme', '77');
    const installed = await h.gitConnections.completeInstallation('alice', {
      installationId: '77',
      state: app.installState,
    });
    expect(installed).toMatchObject({
      id: app.id,
      account: 'acme',
      installationId: '77',
    });
    expect(await h.gitConnections.choices()).toHaveLength(1);
    // GitHub sends people back after a change to the installation too: nothing new.
    expect(
      (
        await h.gitConnections.completeInstallation('alice', {
          installationId: '77',
          state: null,
        })
      ).id,
    ).toBe(app.id);
    expect(await h.gitConnections.list()).toHaveLength(1);
  });

  it('adds another account’s installation as a connection of the app, found without Studio’s state', async () => {
    const app = await created();
    h.github.app.installations.set('acme', '77');
    await h.gitConnections.completeInstallation('alice', {
      installationId: '77',
      state: app.installState,
    });
    h.github.app.installations.set('globex', '88');
    const other = await h.gitConnections.completeInstallation('alice', {
      installationId: '88',
      state: undefined,
    });
    expect(other).toMatchObject({
      account: 'globex',
      installationId: '88',
      appId: h.github.app.appId,
      appSlug: 'studio-acme',
      hasPrivateKey: true,
    });
    expect(other.id).not.toBe(app.id);
    expect(await h.gitConnections.choices()).toHaveLength(2);
  });

  it('refuses an installation that is not the app’s', async () => {
    const app = await created();
    await expect(
      h.gitConnections.completeInstallation('alice', {
        installationId: '999',
        state: app.installState,
      }),
    ).rejects.toMatchObject({
      details: { code: 'GIT_INSTALLATION_NOT_FOUND' },
    });
    await expect(
      h.gitConnections.completeInstallation('alice', {
        installationId: 'abc',
        state: app.installState,
      }),
    ).rejects.toMatchObject({
      details: { code: 'GIT_INSTALLATION_NOT_FOUND' },
    });
    expect((await h.gitConnections.get(app.id)).installationId).toBeNull();
  });
});
