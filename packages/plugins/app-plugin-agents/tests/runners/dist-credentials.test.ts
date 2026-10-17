// @vitest-environment node
/**
 * Who may download the CLI and mint a download token, through the production route contribution rather than the
 * harness's stand-in guards: any API key downloads, so a machine with no browser installs the CLI with the key it
 * already has; only a person mints a download token (`install-token create`), and the token is no session.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

import { HEADERS } from '@nocobase/agent-protocol';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { every } from 'hono/combine';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { runCredentialResolver } from '../../server/cli/run-credential.js';
import { apiRoutes } from '../../server/routes/index.js';
import { agentsToken } from '../../server/tokens.js';
import { createCliApp } from '../cli-app.js';
import { claim, createHarness, type Harness } from '../harness.js';

const root = mkdtempSync(path.join(os.tmpdir(), 'agents-dist-credentials-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

/** One CLI build, `acme 0.5.0` for linux-x64, as `nocobase cli build` lays it out. */
function writeDist(dir: string): void {
  const content = 'acme 0.5.0 linux-x64';
  const name = 'acme-v0.5.0-linux-x64.tar.gz';
  mkdirSync(path.join(dir, 'stable', 'acme', '0.5.0'), { recursive: true });
  writeFileSync(path.join(dir, 'stable', 'acme', '0.5.0', name), content);
  writeFileSync(
    path.join(dir, 'stable', 'acme', 'manifest.json'),
    JSON.stringify({
      schema: 1,
      product: 'acme',
      versions: {
        '0.5.0': {
          targets: {
            'linux-x64': {
              file: `0.5.0/${name}`,
              sha256: createHash('sha256').update(content).digest('hex'),
              size: content.length,
            },
          },
        },
      },
    }),
  );
}

/** Every caller is allowed what it asks; scoping is decided by authentication here. */
function fakeAuthorization(): { middleware(): MiddlewareHandler } {
  return {
    middleware: () => async (context, next) => {
      context.set('authz', {
        identity: { principal: { type: 'user', id: 'alice' } },
        can: () => Promise.resolve(true),
      } as never);
      await next();
    },
  };
}

let h: Harness;
let api: Hono;
let router: Hono;
let authentication: Auth;

beforeEach(async () => {
  const dir = path.join(root, `dist-${Date.now()}-${Math.random()}`);
  writeDist(dir);
  h = await createHarness({ dist: { dir } });
  authentication = new Auth({
    connection: h.database.connection(),
    secret: 'agents-dist-credentials-test-secret-32-chars',
    baseURL: 'http://example.test',
  });
  // A run token is a run's credential and an API key (`x-api-key`) signs Alice in; nothing else does, a download token
  // included.
  vi.spyOn(authentication, 'getSession').mockImplementation(async (headers) => {
    const credential = await runCredentialResolver(h.services)(headers);
    if (credential)
      return { credential } as unknown as Awaited<
        ReturnType<Auth['getSession']>
      >;
    const key = headers.get('x-api-key');
    if (!key) return null;
    const now = new Date();
    return {
      user: {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.test',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: 's',
        token: key,
        userId: 'alice',
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: now,
        updatedAt: now,
      },
    };
  });
  // A key limited to a scope, or a service account's: the API keys plugin recognizes both this way.
  authentication.addScopedCredentialCheck(
    (_session, request) => request.headers.get('x-test-scoped') === 'yes',
  );
  const container = new ServiceContainer();
  container.instance(authenticationToken, authentication);
  container.instance(authorizationToken, fakeAuthorization() as never);
  container.instance(agentsToken, h.services);
  router = new Hono();
  const app: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } },
    paths: createAppPaths({ rootDir: '/tmp/agents-dist-credentials' }),
    router,
    container,
  };
  api = await apiRoutes.createRouter(app);
  router.route('/api', api);
});
afterEach(() => h.close());

const personalKey = { 'x-api-key': 'personal' };
const scopedKey = { 'x-api-key': 'scoped', 'x-test-scoped': 'yes' };
const resolveUrl =
  '/api/agents/dist/products/acme/targets/linux-x64?format=env';
const fileUrl =
  '/api/agents/dist/products/acme/versions/0.5.0/files/acme-v0.5.0-linux-x64.tar.gz';

const mint = (headers: Record<string, string>) =>
  router.request('/api/agents/dist/downloadTokens', {
    method: 'POST',
    headers,
  });

describe('downloading the CLI with an API key', () => {
  it('lets a personal key, a scoped key or a service-account key resolve and download it', async () => {
    for (const headers of [personalKey, scopedKey]) {
      const resolved = await router.request(resolveUrl, { headers });
      expect(resolved.status).toBe(200);
      expect(await resolved.text()).toContain('version=0.5.0');
      expect((await router.request(fileUrl, { headers })).status).toBe(200);
    }
    const refused = await router.request(resolveUrl);
    expect(refused.status).toBe(401);
  });
});

describe('minting a download token', () => {
  it('is for a person, and is never cached', async () => {
    const minted = await mint(personalKey);
    expect(minted.status).toBe(201);
    expect(minted.headers.get('cache-control')).toBe('no-store');
    const { data } = (await minted.json()) as {
      data: { token: string; expiresAt: string; maxDownloads: number };
    };
    expect(data.token).toMatch(/^fgdl_/u);
    expect(data.maxDownloads).toBe(3);

    const scoped = await mint(scopedKey);
    expect(scoped.status).toBe(403);
    expect(await scoped.json()).toMatchObject({
      error: { reason: 'SCOPED_KEY_FORBIDDEN' },
    });
    expect((await mint({})).status).toBe(401);
  });

  it('is refused to a run, by its token', async () => {
    const agentId = await h.createAgent();
    await h.enqueue(agentId, '7', { actorUserId: 'bob' });
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    const runToken = payload.cli.credential.content.token as string;
    expect((await mint({ [HEADERS.runToken]: runToken })).status).toBe(403);
  });

  it('gives a token that downloads the CLI and signs no one in', async () => {
    const minted = (await (await mint(personalKey)).json()) as {
      data: { token: string };
    };
    const token = { [HEADERS.downloadToken]: minted.data.token };
    expect((await router.request(resolveUrl, { headers: token })).status).toBe(
      200,
    );
    expect(
      (await router.request('/api/agents/runs', { headers: token })).status,
    ).toBe(401);
    expect((await mint(token)).status).toBe(401);
  });

  it('is the install-token create command for a person', async () => {
    const { app } = createCliApp(h.services, api, {
      authenticatePerson: every(
        authentication.required({ scopedKeys: true }),
        fakeAuthorization().middleware(),
      ),
    });
    const response = await app.request('/api/cli/manifest', {
      headers: personalKey,
    });
    expect(response.status).toBe(200);
    const manifest = (await response.json()) as {
      data: { commands: { id: string; method: string; path: string }[] };
    };
    expect(
      manifest.data.commands.find(
        (command) => command.id === 'install-token:create',
      ),
    ).toMatchObject({
      method: 'POST',
      path: '/api/agents/dist/downloadTokens',
    });
  });
});
