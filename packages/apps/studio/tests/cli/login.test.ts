// @vitest-environment node
/**
 * `nb-studio login` through the browser, in the whole application: Better Auth's device authorization
 * (`server/config/auth.ts`). The CLI starts a sign-in, the person approves its code on `/device` where they are signed
 * in, the CLI receives a session token once and acts with it as `Authorization: Bearer`, and `nb-studio logout` signs that
 * session out. An unknown client, a declined code and an API key approving get nothing.
 */
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

process.env.AUTH_SECRET ??= 'test-auth-secret-at-least-32-characters';

describe('nb-studio login through the browser', () => {
  let server: StandaloneServer;
  let config: TestAppConfig;
  let directory: string;
  let api: string;
  let session: Record<string, string>;

  const request = async (
    method: string,
    route: string,
    options: { body?: unknown; headers?: Record<string, string> } = {},
  ) => {
    const response = await server.fetch(
      new Request(`${api}${route}`, {
        method,
        headers: {
          ...(options.body === undefined
            ? {}
            : { 'content-type': 'application/json' }),
          ...options.headers,
        },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      }),
    );
    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : undefined) as Record<string, unknown> & {
        data?: Record<string, unknown>;
      },
    };
  };

  const base = () => server.application.publicBasePath.replace(/\/$/u, '');

  const start = async (clientId = 'nb-studio') =>
    request('POST', '/auth/device/code', { body: { client_id: clientId } });

  const poll = async (deviceCode: string) => {
    // The CLI waits `interval` between polls; the test clears the last poll instead of waiting.
    await server.application.container
      .resolve(databaseManagerToken)
      .connection()
      .query.updateTable('deviceCode')
      .set({ lastPolledAt: null })
      .where('deviceCode', '=', deviceCode)
      .execute();
    return request('POST', '/auth/device/token', {
      body: {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode,
        client_id: 'nb-studio',
      },
    });
  };

  const review = (userCode: string, headers: Record<string, string>) =>
    request('GET', `/auth/device?user_code=${encodeURIComponent(userCode)}`, {
      headers,
    });

  beforeAll(async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'nb-studio-cli-login-'));
    config = await createTestAppConfig({
      install: true,
      config: {
        auth: {
          secret: 'test-auth-secret-at-least-32-characters',
          trustedOrigins: ['http://localhost'],
        },
        secrets: {
          keys: [{ version: 1, key: randomBytes(32).toString('hex') }],
        },
        hub: { host: { enabled: false } },
        logging: { level: 'error', file: { enabled: false } },
      },
    });
    const sourceRoot = path.resolve(import.meta.dirname, '../..');
    server = await createStandaloneServer({
      viteDevUrl: false,
      env: {
        DB_MIGRATIONS_AUTO_RUN: 'true',
        DB_SEEDS_AUTO_RUN: 'true',
        APP_CONFIG_FILE: config.path,
        APP_STORAGE_DIR: path.join(directory, 'storage'),
      },
      paths: {
        rootDir: sourceRoot,
        serverDir: path.join(sourceRoot, 'server'),
        databaseDir: path.join(sourceRoot, 'database'),
        clientDir: path.join(sourceRoot, 'dist/client'),
        storageDir: path.join(directory, 'storage'),
      },
    });
    api = `http://localhost${server.application.publicBasePath.replace(/\/$/u, '')}/api`;
    const signIn = await server.fetch(
      new Request(`${api}/auth/sign-in/username`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'nocobase', password: 'admin123' }),
      }),
    );
    session = {
      cookie: signIn.headers
        .getSetCookie()
        .map((header) => header.split(';')[0])
        .join('; '),
      // A cookie-authenticated write comes from the application's own pages.
      origin: 'http://localhost',
    };
  }, 180_000);

  afterAll(async () => {
    await server?.close();
    await config?.dispose();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('issues a session token once the person approves, which acts as Bearer until logout', async () => {
    const started = (await start()).body as {
      device_code: string;
      user_code: string;
      verification_uri_complete: string;
    };
    expect(started.verification_uri_complete).toBe(
      `http://localhost${base()}/device?user_code=${started.user_code}`,
    );
    expect((await poll(started.device_code)).body.error).toBe(
      'authorization_pending',
    );

    expect((await review(started.user_code, session)).body).toMatchObject({
      status: 'pending',
      client_id: 'nb-studio',
    });
    expect(
      (
        await request('POST', '/auth/device/approve', {
          headers: session,
          body: { userCode: started.user_code },
        })
      ).status,
    ).toBe(200);

    const issued = await poll(started.device_code);
    expect(issued.status).toBe(200);
    expect(issued.body.token_type).toBe('Bearer');
    const headers = {
      authorization: `Bearer ${String(issued.body.access_token)}`,
    };
    // Redeemed once.
    expect((await poll(started.device_code)).body.error).toBe('invalid_grant');

    const manifest = await request('GET', '/cli/manifest', { headers });
    expect(manifest.status).toBe(200);
    expect(manifest.body.data).toMatchObject({
      identity: { kind: 'person' },
    });

    expect(
      (await request('POST', '/auth/sign-out', { headers, body: {} })).status,
    ).toBe(200);
    expect((await request('GET', '/cli/manifest', { headers })).status).toBe(
      401,
    );
  });

  it('documents the device endpoints and the bearer token', async () => {
    const document = (await request('GET', '/swagger', { headers: session }))
      .body as unknown as {
      paths: Record<string, Record<string, { security?: unknown }>>;
      security: unknown;
      components: { securitySchemes: Record<string, unknown> };
    };
    expect(document.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(document.security).toEqual(
      expect.arrayContaining([{ cookieAuth: [] }, { bearerAuth: [] }]),
    );
    expect(document.paths['/api/auth/device/code']?.post?.security).toEqual([]);
    expect(document.paths['/api/auth/device/token']?.post?.security).toEqual(
      [],
    );
    expect(document.paths['/api/auth/device/approve']?.post).toBeDefined();
  });

  it('gives nothing to an unknown client, a declined code, or an API key approving', async () => {
    const unknown = await start('someone-else');
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toBe('invalid_client');

    const started = (await start()).body as {
      device_code: string;
      user_code: string;
    };
    // A key the person created may act, but not approve a sign-in.
    const own = await request('POST', '/apiKeys', {
      headers: session,
      body: { name: 'mine', expiresInDays: null, scope: null },
    });
    const keyHeaders = {
      'x-api-key': (own.body.data as { secret: string }).secret,
    };
    expect(
      (await request('GET', '/cli/manifest', { headers: keyHeaders })).status,
    ).toBe(200);
    expect((await review(started.user_code, keyHeaders)).status).toBe(403);
    const byKey = await request('POST', '/auth/device/approve', {
      headers: keyHeaders,
      body: { userCode: started.user_code },
    });
    expect(byKey.status).toBe(403);
    expect(byKey.body.code).toBe('API_KEY_SESSION_FORBIDDEN');

    await review(started.user_code, session);
    expect(
      (
        await request('POST', '/auth/device/deny', {
          headers: session,
          body: { userCode: started.user_code },
        })
      ).status,
    ).toBe(200);
    expect((await poll(started.device_code)).body.error).toBe('access_denied');
  });
});
