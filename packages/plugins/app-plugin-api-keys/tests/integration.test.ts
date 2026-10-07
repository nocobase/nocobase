// @vitest-environment node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Auth, type AuthEnv } from '@nocobase/app-plugin-authentication/server';
import { createMigrator, type DatabaseManager } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { APIError } from 'better-auth/api';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { apiKey } from '../server/api-keys.js';

const require = createRequire(import.meta.url);
const BASE_URL = 'http://localhost/api/auth';
const OWNER = {
  name: 'Ada',
  email: 'ada@example.com',
  password: 'password-at-least-8',
};

function authenticationMigrations(): string {
  return path.join(
    path.dirname(
      require.resolve('@nocobase/app-plugin-authentication/package.json'),
    ),
    'database/migrations',
  );
}

describe('API keys', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let auth: Auth;
  let cookie = '';

  const call = (
    path: string,
    init: { headers?: Record<string, string>; body?: unknown } = {},
  ): Promise<Response> =>
    auth.handler(
      new Request(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...init.headers },
        body: JSON.stringify(init.body ?? {}),
      }),
    );

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    for (const [packageName, directory] of [
      ['@nocobase/app-plugin-authentication', authenticationMigrations()],
      [
        '@nocobase/app-plugin-api-keys',
        fileURLToPath(new URL('../database/migrations', import.meta.url)),
      ],
    ] as const) {
      await createMigrator({ database, packageName, directory }).latest();
    }

    auth = new Auth({
      connection: database.connection(),
      baseURL: BASE_URL,
      secret: 'development-secret-at-least-32-characters',
      appName: 'NocoBase3',
      plugins: [apiKey()],
      emailAndPassword: { enabled: true, autoSignIn: true },
      session: { storeSessionInDatabase: true },
    });

    const signUp = await call('/sign-up/email', { body: OWNER });
    if (signUp.status !== 200) {
      throw new Error(`Sign-up failed: ${await signUp.text()}`);
    }
    cookie = signUp.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
    if (!cookie) throw new Error('Sign-up set no session cookie.');
  });

  afterAll(async () => {
    await testDatabase.destroy();
  });

  async function issueKey(name: string): Promise<string> {
    const response = await call('/api-key/create', {
      headers: { cookie },
      body: { name },
    });
    expect(response.status).toBe(200);
    const created = (await response.json()) as { key: string };
    expect(created.key).toEqual(expect.any(String));
    return created.key;
  }

  it('resolves a key to a session for the user who owns it', async () => {
    const key = await issueKey('integration');

    const session = await auth.getSession(new Headers({ 'x-api-key': key }));

    expect(session?.user.email).toBe(OWNER.email);
  });

  it('never lets a key manage keys, scoped or not', async () => {
    // A key is its owner everywhere else, but a leaked key must not mint its own successors or revoke the evidence:
    // every `/api-key/*` endpoint takes a sign-in.
    const key = await issueKey('escalation');
    const listed = await auth.handler(
      new Request(`${BASE_URL}/api-key/list`, { headers: { cookie } }),
    );
    const { apiKeys } = (await listed.json()) as {
      apiKeys: readonly { id: string; name: string | null }[];
    };
    const target = apiKeys.find((entry) => entry.name === 'escalation')!;

    for (const [path, body] of [
      ['/api-key/create', { name: 'minted-by-a-key' }],
      ['/api-key/update', { keyId: target.id, name: 'renamed' }],
      ['/api-key/delete', { keyId: target.id }],
    ] as const) {
      const response = await call(path, {
        headers: { 'x-api-key': key },
        body,
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        code: 'API_KEY_SESSION_FORBIDDEN',
      });
    }
    const list = await auth.handler(
      new Request(`${BASE_URL}/api-key/list`, {
        headers: { 'x-api-key': key },
      }),
    );
    expect(list.status).toBe(403);
    // The key itself still works, and its owner's session still manages keys.
    await expect(
      auth.getSession(new Headers({ 'x-api-key': key })),
    ).resolves.toMatchObject({ user: { email: OWNER.email } });
    expect(
      (
        await call('/api-key/create', {
          headers: { cookie },
          body: { name: 'from-a-session' },
        })
      ).status,
    ).toBe(200);
  });

  it('stops honouring a key once it is revoked', async () => {
    const key = await issueKey('revoked');
    const listed = await auth.handler(
      new Request(`${BASE_URL}/api-key/list`, { headers: { cookie } }),
    );
    const listing = (await listed.json()) as {
      apiKeys: readonly { id: string; name: string | null; key?: string }[];
    };
    const target = listing.apiKeys.find((entry) => entry.name === 'revoked');

    expect(target).toBeDefined();
    expect(target).not.toHaveProperty('key');

    const revoked = await call('/api-key/delete', {
      headers: { cookie },
      body: { keyId: target!.id },
    });
    expect(revoked.status).toBe(200);

    await expect(
      auth.getSession(new Headers({ 'x-api-key': key })),
    ).rejects.toBeInstanceOf(APIError);

    // A guarded route tells the caller why, in Better Auth's own words.
    const router = new Hono<AuthEnv>();
    router.get('/orders', auth.required(), (context) =>
      context.json({ ok: true }),
    );
    const response = await router.request('/orders', {
      headers: { 'x-api-key': key },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'UNAUTHENTICATED',
        reason: expect.stringMatching(/^(INVALID_API_KEY|KEY_NOT_FOUND)$/),
      },
    });
  });

  it('reports an unknown key as Better Auth does', async () => {
    await expect(
      auth.getSession(
        new Headers({ 'x-api-key': 'not-a-key-that-was-issued' }),
      ),
    ).rejects.toBeInstanceOf(APIError);
  });

  it('does not cap a key at the Better Auth default of ten requests a day', async () => {
    const key = await issueKey('unthrottled');
    const headers = new Headers({ 'x-api-key': key });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await expect(auth.getSession(headers)).resolves.not.toBeNull();
    }
  });
});
