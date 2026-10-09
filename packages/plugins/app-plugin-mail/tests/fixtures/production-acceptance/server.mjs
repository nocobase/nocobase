import assert from 'node:assert/strict';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL, URL, URLSearchParams } from 'node:url';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createTestAppConfig } from '../../../../../tools/app-testing/dist/src/server/app-config.js';

const { Request } = globalThis;
const repository = path.resolve(import.meta.dirname, '../../../../../..');
const deployment = path.join(
  repository,
  'packages/templates/app-template-examples/dist',
);
const load = async (name) => {
  const parts = name.split('/');
  const packageName = parts.slice(0, 2).join('/');
  const subpath = parts.length > 2 ? `./${parts.slice(2).join('/')}` : '.';
  const manifest = path.join(
    deployment,
    'node_modules',
    packageName,
    'package.json',
  );
  const metadata = JSON.parse(await readFile(manifest, 'utf8'));
  return import(
    pathToFileURL(
      path.resolve(path.dirname(manifest), metadata.exports[subpath].import),
    ).href
  );
};
const { createStandaloneServer } = await import(
  pathToFileURL(path.join(deployment, 'server/standalone.js')).href
);
const { mailProviderRegistryToken } = await load(
  '@nocobase/app-plugin-mail/server',
);
const { userAdministrationServiceToken } = await load(
  '@nocobase/app-plugin-authentication',
);
const { authorizationToken } = await load('@nocobase/app-plugin-authorization');
const { signIn } = await load('@nocobase/app-plugin-authentication/testing');
const { loggingToken } = await load('@nocobase/app-server/logging');
const port = Number(process.env.MAIL_PRODUCTION_ACCEPTANCE_PORT ?? 59118);
const origin = `http://127.0.0.1:${port}`;
const dist = path.join(repository, '.tmp/mail-issue8-production/dist');
const password = 'Local-acceptance-only-password-42!';
const capabilities = {
  receive: true,
  send: false,
  incrementalSync: false,
  pushNotifications: false,
  folders: true,
  labels: false,
  drafts: false,
  moveMessage: false,
  aliases: false,
};

async function start(basePath, developmentReturn = false) {
  const config = await createTestAppConfig({
    config: {
      app: {
        name: 'mail-production-acceptance',
        publicBasePath: basePath,
        publicOrigin: origin,
        sampleData: false,
      },
      auth: {
        secret: randomBytes(32).toString('hex'),
        trustedOrigins: [origin, 'http://localhost'],
      },
      secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
      logging: {
        level: 'warn',
        console: { enabled: false },
        file: { enabled: developmentReturn },
      },
      mail: {
        ...(developmentReturn
          ? {}
          : {
              oauthReturnUrl:
                '/mail/accounts?source=connect&mailAuthorization=old',
            }),
        automaticSyncIntervalMs: 86400000,
        providers: { local: { type: 'acceptance-local' } },
      },
      users: {
        initialAdmin: {
          username: 'acceptanceadmin',
          email: 'admin@acceptance.invalid',
          password,
        },
      },
    },
  });
  let server;
  try {
    // All runtime paths and dotenv lookup roots are owned by this fixture, never the developer's application.
    server = await createStandaloneServer({
      rootDir: config.directory,
      deploymentRootDir: config.directory,
      paths: {
        rootDir: config.directory,
        storageDir: path.join(config.directory, 'storage'),
        clientDir: dist,
      },
      configPath: config.path,
      basePath,
      viteDevUrl: false,
      env: {
        ...Object.fromEntries(
          Object.keys(process.env).map((key) => [key, undefined]),
        ),
        NODE_ENV: 'production',
        APP_STORAGE_DIR: path.join(config.directory, 'storage'),
      },
    });
    assert.equal(server.application.nodeEnv, 'production');
    assert.equal(server.application.publicBasePath, basePath);
    let completedCount = 0;
    const registry = server.application.container.resolve(
      mailProviderRegistryToken,
    );
    registry.register({
      type: 'acceptance-local',
      label: 'Local acceptance OAuth',
      capabilities,
      authorization: {
        start: async (_context, _config, input) => ({
          ok: true,
          value: {
            authorizationUrl: `${origin}${basePath}/acceptance/authorize?${new URLSearchParams({ state: input.state, redirect_uri: input.redirectUri })}`,
            state: input.state,
          },
        }),
        complete: async (context, _config, input) => {
          assert.equal(input.code, 'local-private-code');
          assert.ok(input.codeVerifier.length > 40);
          return {
            ok: true,
            value: {
              address:
                ++completedCount === 1
                  ? 'saved-account@acceptance.invalid'
                  : 'browser-saved-account@acceptance.invalid',
              displayName: 'Saved local account',
              scopes: [],
              credentialReference: await context.credentials.put({
                token: 'local-private-token',
              }),
            },
          };
        },
      },
      // No network or mailbox operations. The real engine may enqueue its initial sync; it only sees empty local data.
      createAdapter: async () => ({
        identity: { type: 'acceptance-local', name: 'local' },
        capabilities,
        listFolders: async () => ({
          ok: true,
          value: { folders: [], completeProviderFolderIds: [] },
        }),
        listMessages: async () => ({
          ok: true,
          value: { messages: [], historyReady: true },
        }),
      }),
    });
    const target = {
      fetch: (request) => server.fetch(request),
      publicBasePath: basePath,
    };
    const users = server.application.container.resolve(
      userAdministrationServiceToken,
    );
    const allowed = await users.create({
      name: 'Allowed acceptance user',
      email: 'allowed@acceptance.invalid',
      password,
    });
    await users.create({
      name: 'Denied acceptance user',
      email: 'denied@acceptance.invalid',
      password,
    });
    const authz = server.application.container.resolve(authorizationToken);
    await authz.permissionSets.create({
      key: 'acceptance-mail',
      grants: [authz.pages.grant('mail.workspace')],
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: allowed.id },
      permissionSet: 'acceptance-mail',
    });
    const allowedSession = await signIn(target, {
      email: allowed.email,
      password,
    });
    const deniedSession = await signIn(target, {
      email: 'denied@acceptance.invalid',
      password,
    });
    return {
      server,
      config,
      allowedSession,
      deniedSession,
      close: async () => {
        try {
          await server.close();
        } finally {
          await config.dispose();
        }
        assert.equal(existsSync(config.directory), false);
        const filename = config.testDatabases.connectionConfig().filename;
        if (typeof filename === 'string')
          assert.equal(existsSync(filename), false);
        await writeFile(
          path.join(
            repository,
            `.tmp/mail-issue8-production/cleanup-${basePath ? basePath.slice(1).replaceAll('/', '-') : 'root'}.json`,
          ),
          `${JSON.stringify({ ownedApplicationDirectoryRemoved: true, ownedDatabaseRemoved: true })}\n`,
        );
      },
    };
  } catch (error) {
    if (server) await server.close();
    await config.dispose();
    throw error;
  }
}
async function prove(app, basePath) {
  const anonymous = await app.server.fetch(
    new Request(`${origin}${basePath}/api/mail/accounts`),
  );
  assert.equal(anonymous.status, 401);
  const denied = await app.deniedSession.fetch('/mail/accounts');
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.reason, 'MAIL_ACCESS_DENIED');
  const started = await app.allowedSession.fetch('/mail/authorizations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({
      type: 'acceptance-local',
      name: 'local',
      initialSyncReceivedAfter: '2026-01-01T00:00:00Z',
    }),
  });
  assert.equal(started.status, 201);
  const { data } = await started.json();
  const state = new URL(data.authorizationUrl).searchParams.get('state');
  const completed = await app.server.fetch(
    new Request(
      `${origin}${basePath}/mail/oauth/callback?${new URLSearchParams({ state, code: 'local-private-code' })}`,
    ),
  );
  assert.equal(completed.status, 302);
  assert.equal(
    completed.headers.get('location'),
    `${basePath}/mail/accounts?source=connect&mailAuthorization=success`,
  );
  const failed = await app.server.fetch(
    new Request(
      `${origin}${basePath}/mail/oauth/callback?state=invalid&code=local-private-code&error=private-provider-error`,
    ),
  );
  assert.equal(
    failed.headers.get('location'),
    `${basePath}/mail/accounts?source=connect&mailAuthorization=failure`,
  );
  const accounts = await app.allowedSession.fetch('/mail/accounts');
  assert.equal(accounts.status, 200);
  const result = await accounts.json();
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].address, 'saved-account@acceptance.invalid');
  assert.ok(!JSON.stringify(result).includes('local-private'));
  return {
    basePath,
    production: true,
    anonymous: 401,
    denied: 403,
    authorized: 200,
    savedAccount: true,
    successReturn: completed.headers.get('location'),
    failureReturn: failed.headers.get('location'),
  };
}
const warningApp = await start('/warning', true);
let warningEvidence;
try {
  await warningApp.server.application.start();
  await warningApp.server.application.start();
  await warningApp.server.application.container.resolve(loggingToken).flush();
  const directory = path.join(warningApp.config.directory, 'storage/logs');
  const records = (
    await Promise.all(
      (await readdir(directory))
        .filter((name) => name.endsWith('.log'))
        .map(async (name) =>
          (await readFile(path.join(directory, name), 'utf8'))
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line)),
        ),
    )
  ).flat();
  const warnings = records.filter(
    (record) =>
      record.msg ===
      'Mail OAuth return URL points to a development-only page that is excluded from production builds. Configure mail.oauthReturnUrl to an application-owned production account page.',
  );
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].namespace, 'mail');
  warningEvidence = {
    production: true,
    fullMailEngineStarted: true,
    defaultReturnWarningCount: warnings.length,
  };
} finally {
  await warningApp.close();
}

const root = await start('');
let rootEvidence;
try {
  rootEvidence = await prove(root, '');
} finally {
  await root.close();
}
const app = await start('/main');
try {
  const evidence = {
    warning: warningEvidence,
    root: rootEvidence,
    prefixed: await prove(app, '/main'),
  };
  await writeFile(
    path.join(repository, '.tmp/mail-issue8-production/server-evidence.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
} catch (error) {
  await app.close();
  throw error;
}
const listener = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, origin);
    if (url.pathname === '/main/acceptance/authorize') {
      const callback = new URL(url.searchParams.get('redirect_uri'));
      assert.equal(callback.origin, origin);
      assert.equal(callback.pathname, '/main/mail/oauth/callback');
      callback.searchParams.set('state', url.searchParams.get('state'));
      if (url.searchParams.get('failure') === 'true')
        callback.searchParams.set('error', 'local-private-denial');
      else callback.searchParams.set('code', 'local-private-code');
      response.writeHead(302, { location: callback.href });
      response.end();
      return;
    }
    if (
      url.pathname.startsWith('/main/api/') ||
      url.pathname === '/main/mail/oauth/callback'
    ) {
      const body =
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : Buffer.concat(await Array.fromAsync(request));
      const result = await app.server.fetch(
        new Request(url, {
          method: request.method,
          headers: request.headers,
          body,
        }),
      );
      const headers = Object.fromEntries(result.headers);
      const cookies = result.headers.getSetCookie();
      if (cookies.length) headers['set-cookie'] = cookies;
      response.writeHead(result.status, headers);
      response.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    const relative = url.pathname.startsWith('/main/assets/')
      ? url.pathname.slice('/main/'.length)
      : 'index.html';
    const target = path.resolve(dist, relative);
    assert.ok(target.startsWith(`${dist}${path.sep}`));
    response.writeHead(200, {
      'content-type': target.endsWith('.js')
        ? 'text/javascript'
        : target.endsWith('.css')
          ? 'text/css'
          : 'text/html',
      'cache-control': 'no-store',
    });
    response.end(await readFile(target));
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end('Acceptance fixture failed');
  }
});
listener.listen(port, '127.0.0.1', () =>
  console.log(`Mail production acceptance ready ${origin}/main/mail/accounts`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    listener.closeAllConnections();
    listener.close(() => void app.close().then(() => process.exit(0)));
  });
