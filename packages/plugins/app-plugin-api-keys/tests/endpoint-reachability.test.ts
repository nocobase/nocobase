// @vitest-environment node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Auth } from '@nocobase/app-plugin-authentication/server';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { bearer } from 'better-auth/plugins';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { apiKey } from '../server/api-keys.js';

const require = createRequire(import.meta.url);
const BASE_URL = 'http://localhost/api/auth';
const PASSWORD = 'password-at-least-8';

describe('unscoped API key endpoint reachability', () => {
  let testDatabase: TestDatabase;
  let auth: Auth;
  let sequence = 0;
  let ownerId: string;
  let cookie: string;
  let key: string;
  let keyId: string;

  const request = (
    endpoint: string,
    method: string,
    headers: Record<string, string>,
    body?: unknown,
  ) =>
    auth.handler(
      new Request(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
          ...headers,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );

  // No cookie, bearer token or Origin accompanies any request made with a key.
  const withKey = (endpoint: string, method = 'GET', body?: unknown) =>
    request(endpoint, method, { 'x-api-key': key }, body);

  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    for (const [packageName, directory] of [
      [
        '@nocobase/app-plugin-authentication',
        path.join(
          path.dirname(
            require.resolve('@nocobase/app-plugin-authentication/package.json'),
          ),
          'database/migrations',
        ),
      ],
      [
        '@nocobase/app-plugin-api-keys',
        fileURLToPath(new URL('../database/migrations', import.meta.url)),
      ],
    ] as const) {
      await createMigrator({
        database: testDatabase.database,
        packageName,
        directory,
      }).latest();
    }
    auth = new Auth({
      connection: testDatabase.database.connection(),
      baseURL: BASE_URL,
      secret: 'development-secret-at-least-32-characters',
      // Both application templates enable `bearer()` for CLI device sign-in; keep the
      // same plugin set so the suite pins what a key reaches in a default App.
      plugins: [apiKey(), bearer()],
      emailAndPassword: { enabled: true, autoSignIn: true },
      session: { storeSessionInDatabase: true },
      user: {
        deleteUser: { enabled: true },
        changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      },
    });
  });

  async function createOwner() {
    // Each case owns its user, session and key, including destructive endpoints.
    const signUp = await request(
      '/sign-up/email',
      'POST',
      {},
      {
        name: 'Owner',
        email: `owner-${++sequence}@example.com`,
        password: PASSWORD,
      },
    );
    expect(signUp.status).toBe(200);
    ownerId = ((await signUp.json()) as { user: { id: string } }).user.id;
    cookie = signUp.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
    expect(cookie).not.toBe('');

    const created = await request(
      '/api-key/create',
      'POST',
      { cookie },
      {
        name: 'unscoped',
      },
    );
    expect(created.status).toBe(200);
    const issued = (await created.json()) as { id: string; key: string };
    key = issued.key;
    keyId = issued.id;
    expect(key).toEqual(expect.any(String));
    expect(keyId).toEqual(expect.any(String));
    await expect(
      auth.getSession(new Headers({ 'x-api-key': key })),
    ).resolves.toMatchObject({ user: { id: ownerId } });
  }

  beforeEach(createOwner);

  afterAll(async () => {
    await testDatabase.destroy();
  });

  it.each([
    ['POST', '/api-key/create'],
    ['GET', '/api-key/list'],
    ['GET', '/api-key/get'],
    ['POST', '/api-key/update'],
    ['POST', '/api-key/delete'],
  ])(
    'refuses %s %s with the plugin’s sign-in-only guard',
    async (method, endpoint) => {
      const body =
        endpoint === '/api-key/create'
          ? { name: 'successor' }
          : { keyId, name: 'renamed' };
      const response = await withKey(
        endpoint === '/api-key/get' ? `${endpoint}?id=${keyId}` : endpoint,
        method,
        method === 'GET' ? undefined : body,
      );
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        code: 'API_KEY_SESSION_FORBIDDEN',
      });
      // A refused management request neither revokes the key nor its sign-in.
      await expect(
        auth.getSession(new Headers({ 'x-api-key': key })),
      ).resolves.toMatchObject({ user: { id: ownerId } });
      const listed = await request('/api-key/list', 'GET', { cookie });
      expect(listed.status).toBe(200);
      expect(await listed.json()).toMatchObject({
        apiKeys: [expect.objectContaining({ id: keyId, name: 'unscoped' })],
      });
    },
  );

  it('allows POST /update-user to change the owner’s profile', async () => {
    const response = await withKey('/update-user', 'POST', { name: 'Renamed' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: true });
    await expect(
      auth.getSession(new Headers({ cookie })),
    ).resolves.toMatchObject({
      user: { id: ownerId, name: 'Renamed' },
    });
  });

  it('allows GET /list-sessions, whose token replays as a bearer sign-in session', async () => {
    const signedIn = await auth.getSession(new Headers({ cookie }));
    expect(signedIn?.user.id).toBe(ownerId);
    const token = signedIn!.session.token;
    const response = await withKey('/list-sessions');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: signedIn!.session.id,
        userId: ownerId,
        token,
      }),
    ]);

    const tokenCookie = cookie
      .split('; ')
      .find((entry) => entry.startsWith('better-auth.session_token='))!;
    expect(
      decodeURIComponent(tokenCookie.split('=')[1]).startsWith(`${token}.`),
    ).toBe(true);
    // The disclosed token lacks the signature required by native cookie auth.
    await expect(
      auth.getSession(
        new Headers({ cookie: `better-auth.session_token=${token}` }),
      ),
    ).resolves.toBeNull();

    // `bearer()` signs an unsigned bearer token itself (`requireSignature` is
    // off by default), so the disclosed token is a full sign-in session that
    // the key-only guards no longer recognize.
    const asSession = { authorization: `Bearer ${token}` };
    await expect(
      auth.getSession(new Headers(asSession)),
    ).resolves.toMatchObject({
      user: { id: ownerId },
      session: { id: signedIn!.session.id },
    });
    const minted = await request('/api-key/create', 'POST', asSession, {
      name: 'successor',
    });
    expect(minted.status).toBe(200);
    expect(await minted.json()).toMatchObject({ key: expect.any(String) });
    const revoked = await request('/revoke-sessions', 'POST', asSession, {});
    expect(revoked.status).toBe(200);
    await expect(auth.getSession(new Headers({ cookie }))).resolves.toBeNull();
  });

  it('allows POST /sign-out without revoking the key or the owner’s sign-in', async () => {
    const response = await withKey('/sign-out', 'POST', {});
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    await expect(
      auth.getSession(new Headers({ 'x-api-key': key })),
    ).resolves.toMatchObject({ user: { id: ownerId } });
    await expect(
      auth.getSession(new Headers({ cookie })),
    ).resolves.toMatchObject({
      user: { id: ownerId },
    });
  });

  it.each([
    ['/delete-user', { password: PASSWORD }],
    ['/change-email', { newEmail: 'changed@example.com' }],
    ['/revoke-sessions', {}],
    [
      '/change-password',
      { currentPassword: PASSWORD, newPassword: 'new-password-at-least-8' },
    ],
  ])(
    'requires a stored sign-in session for POST %s',
    async (endpoint, body) => {
      const response = await withKey(endpoint, 'POST', body);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ code: 'UNAUTHORIZED' });
      await expect(
        auth.getSession(new Headers({ cookie })),
      ).resolves.toMatchObject({
        user: { id: ownerId },
      });
    },
  );

  it('validates currentPassword before authenticating POST /change-password', async () => {
    const response = await withKey('/change-password', 'POST', {
      newPassword: 'new-password-at-least-8',
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: expect.stringContaining('currentPassword'),
    });
  });
});
