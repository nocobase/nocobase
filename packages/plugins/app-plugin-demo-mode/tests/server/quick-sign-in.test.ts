import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  Auth,
  authenticationToken,
  createUserAdministrationService,
} from '@nocobase/app-plugin-authentication/server';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { DemoAccountSummary } from '../../shared/data.js';
import { accountRoutes } from '../../server/routes/accounts.js';
import { demoDataToken, demoModeServiceToken } from '../../server/tokens.js';

const require = createRequire(import.meta.url);
const ORIGIN = 'http://localhost';

const listed: DemoAccountSummary[] = [
  { username: 'ann', name: 'Ann', role: 'Admin', password: 'ann-password' },
  { username: 'bob', name: 'Bob', role: 'Reviewer', password: 'bob-password' },
  // Created by the dataset, then disabled.
  { username: 'cat', name: 'Cat', role: 'Analyst', password: 'cat-password' },
  // Never created.
  { username: 'dan', name: 'Dan', role: 'Guest', password: 'dan-password' },
  // An account the dataset does not own.
  { username: 'eve', name: 'Eve', role: 'Owner', password: 'eve-password' },
];

let testDatabase: TestDatabase;
let auth: Auth;
let enabled: boolean;
let quickSignIn: boolean;
let accounts: DemoAccountSummary[];
let ids: Record<string, string>;
let administratorIds: string[];

async function routes(): Promise<Hono> {
  const services = new Map<unknown, unknown>([
    [authenticationToken, auth],
    [
      authorizationToken,
      {
        permissionSets: {
          list: async () => [{ key: 'administrators' }],
          protection: (key: string) => ({
            unrestricted: key === 'administrators',
          }),
          listAssignments: async () =>
            administratorIds.map((id) => ({
              subject: { type: 'user', id },
              permissionSet: 'administrators',
            })),
        },
      },
    ],
    [databaseManagerToken, testDatabase.database],
    [
      demoModeServiceToken,
      {
        get enabled() {
          return enabled;
        },
        allowCollections: [],
      },
    ],
    [demoDataToken, { status: async () => ({ datasetId: 'demo', accounts }) }],
  ]);
  const app = {
    container: {
      has: (token: unknown) => services.has(token),
      resolve: (token: unknown) => services.get(token),
    },
    config: {
      get: (key: string) => (key === 'demoMode' ? { quickSignIn } : undefined),
    },
  };
  const api = new Hono();
  api.on(['GET', 'POST'], '/auth/*', (context) =>
    auth.handler(context.req.raw),
  );
  api.route('/', await accountRoutes.createRouter(app as never));
  return new Hono().route('/api', api);
}

function cookieOf(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
}

async function call(
  method: 'GET' | 'POST',
  route: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  return (await routes()).fetch(
    new Request(`${ORIGIN}/api${route}`, {
      method,
      headers: method === 'POST' ? { origin: ORIGIN, ...headers } : headers,
    }),
  );
}

async function signedInUser(cookie: string): Promise<string | null> {
  const response = await call('GET', '/auth/get-session', { cookie });
  const body = (await response.json()) as { user?: { id: string } } | null;
  return body?.user?.id ?? null;
}

beforeAll(async () => {
  testDatabase = await createTestDatabase();
  const database = testDatabase.database;
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
      '@nocobase/app-plugin-demo-mode',
      fileURLToPath(new URL('../../database/migrations', import.meta.url)),
    ],
  ] as const)
    await createMigrator({ database, packageName, directory }).latest();
  auth = new Auth({
    connection: database.connection(),
    baseURL: `${ORIGIN}/api/auth`,
    secret: 'development-secret-at-least-32-characters',
    emailAndPassword: { enabled: true },
    session: { storeSessionInDatabase: true },
  });
  const users = createUserAdministrationService({
    auth,
    connection: database.connection(),
  });
  ids = {};
  for (const account of listed.filter((a) => a.username !== 'dan')) {
    const { id } = await users.create({
      name: account.name,
      email: `${account.username}@example.com`,
      password: account.password,
    });
    ids[account.username] = id;
    await database
      .query()
      .updateTable('user')
      .set({ username: account.username })
      .where('id', '=', id)
      .execute();
    if (account.username !== 'eve')
      await database
        .query()
        .insertInto('demoModeAccounts')
        .values({ userId: id, datasetId: 'demo', passwordHash: 'fixture' })
        .execute();
  }
  await users.disable(ids.cat!);
  ids.owner = (
    await users.create({
      name: 'Super Admin',
      username: 'owner',
      email: 'owner@example.com',
      password: 'private-admin-password',
    })
  ).id;
  ids.robot = (await users.createServiceAccount({ name: 'Robot' })).id;
});
afterAll(() => testDatabase.destroy());
beforeEach(() => {
  enabled = true;
  quickSignIn = true;
  accounts = listed;
  administratorIds = [ids.owner!];
});

describe('demo quick sign-in', () => {
  it('lists system accounts together, including accounts outside the dataset', async () => {
    const response = await call('GET', '/demoMode/accounts');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        { username: 'ann', name: 'Ann', role: 'Admin', current: false },
        { username: 'bob', name: 'Bob', role: 'Reviewer', current: false },
        { username: 'eve', name: 'Eve', role: 'Owner', current: false },
        { username: 'owner', name: 'Super Admin', role: '', current: false },
      ],
      meta: { total: 4 },
    });
  });

  it('signs in with an ordinary session and marks the current account', async () => {
    const response = await call('POST', '/demoMode/accounts/ann/signIn');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { username: 'ann', name: 'Ann', role: 'Admin', current: true },
    });
    const cookie = cookieOf(response);
    expect(await signedInUser(cookie)).toBe(ids.ann);
    const list = (await (
      await call('GET', '/demoMode/accounts', { cookie })
    ).json()) as { data: { username: string; current: boolean }[] };
    expect(list.data.map((a) => [a.username, a.current])).toEqual([
      ['ann', true],
      ['bob', false],
      ['eve', false],
      ['owner', false],
    ]);
  });

  it('ends the previous session when a visitor switches accounts', async () => {
    const first = cookieOf(await call('POST', '/demoMode/accounts/ann/signIn'));
    const switched = await call('POST', '/demoMode/accounts/bob/signIn', {
      cookie: first,
    });
    expect(switched.status).toBe(200);
    expect(await signedInUser(cookieOf(switched))).toBe(ids.bob);
    expect(await signedInUser(first)).toBeNull();
  });

  it('refuses accounts the list does not offer', async () => {
    for (const username of ['cat', 'dan', 'nobody', ids.robot!]) {
      const response = await call(
        'POST',
        `/demoMode/accounts/${username}/signIn`,
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        error: { reason: 'DEMO_ACCOUNT_NOT_FOUND', domain: 'demoMode' },
      });
      expect(response.headers.getSetCookie()).toEqual([]);
    }
  });

  it('signs in existing accounts without dataset metadata or known passwords', async () => {
    accounts = [];
    const response = await call('POST', '/demoMode/accounts/owner/signIn');
    expect(response.status).toBe(200);
    expect(await signedInUser(cookieOf(response))).toBe(ids.owner);
    expect(
      (await (await call('GET', '/demoMode/accounts')).json()).data,
    ).toHaveLength(4);
  });

  it('enters the existing Super Admin by permission and retains signed-in visitors', async () => {
    accounts = [];
    const response = await call('POST', '/demoMode/accounts/signInDefault');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { signedIn: true } });
    expect(await signedInUser(cookieOf(response))).toBe(ids.owner);
    const cookie = cookieOf(
      await call('POST', '/demoMode/accounts/bob/signIn'),
    );
    const returning = await call('POST', '/demoMode/accounts/signInDefault', {
      cookie,
    });
    expect(await returning.json()).toEqual({ data: { signedIn: false } });
    expect(await signedInUser(cookie)).toBe(ids.bob);
  });

  it('leaves normal entry available when no enabled Super Admin exists', async () => {
    for (const candidates of [[], [ids.cat!]]) {
      administratorIds = candidates;
      const response = await call('POST', '/demoMode/accounts/signInDefault');
      expect(await response.json()).toEqual({ data: { signedIn: false } });
    }
  });

  it('offers nothing outside demo mode or when switched off', async () => {
    for (const setup of [
      () => (enabled = false),
      () => (quickSignIn = false),
    ]) {
      enabled = true;
      quickSignIn = true;
      setup();
      expect(await (await call('GET', '/demoMode/accounts')).json()).toEqual({
        data: [],
        meta: { total: 0 },
      });
      expect(
        await (await call('POST', '/demoMode/accounts/signInDefault')).json(),
      ).toEqual({ data: { signedIn: false } });
      expect((await call('POST', '/demoMode/accounts/ann/signIn')).status).toBe(
        404,
      );
    }
  });

  it('refuses a cookie-carrying sign-in from another origin', async () => {
    const cookie = cookieOf(
      await call('POST', '/demoMode/accounts/ann/signIn'),
    );
    const response = await call('POST', '/demoMode/accounts/bob/signIn', {
      cookie,
      origin: 'https://attacker.example',
    });
    expect(response.status).toBe(403);
    expect(await signedInUser(cookie)).toBe(ids.ann);
  });
});
