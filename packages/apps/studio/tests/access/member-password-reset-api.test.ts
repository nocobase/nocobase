// @vitest-environment node
/**
 * The member password reset endpoint through a real, running application: an administrator resets a member's
 * password, the member can no longer use the old one, the member's prior session is revoked, a caller without the
 * `reset-password` permission is refused, and an anonymous caller is refused.
 */
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path, { join as joinPath } from 'node:path';

import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import {
  SnowflakeIdGenerator,
  type SnowflakeIdGeneratorConfig,
} from '@nocobase/snowflake';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 120_000 });

import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

const configs: TestAppConfig[] = [];
const tempDirs: string[] = [];
const servers: StandaloneServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(configs.splice(0).map((config) => config.dispose()));
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function startApp(
  shared?: TestAppConfig,
  maintenance = false,
): Promise<StandaloneServer> {
  const directory = mkdtempSync(
    path.join(tmpdir(), 'studio-member-password-reset-'),
  );
  tempDirs.push(directory);
  const config =
    shared ??
    (await createTestAppConfig({
      config: {
        auth: {
          secret: 'test-auth-secret-at-least-32-characters',
          trustedOrigins: ['http://localhost'],
        },
        releases: { host: { enabled: false } },
        studio: { accessUpgrade: { maintenance } },
        logging: { level: 'error', file: { enabled: false } },
      },
    }));
  if (!shared) configs.push(config);
  const sourceRoot = path.resolve(import.meta.dirname, '../..');
  const server = await createStandaloneServer({
    viteDevUrl: false,
    env: {
      APP_CONFIG_FILE: config.path,
      APP_STORAGE_DIR: path.join(directory, 'storage'),
      // Concurrent instances sharing a database must own different Snowflake worker IDs.
      SNOWFLAKE_WORKER_ID: String(servers.length),
    },
    paths: {
      rootDir: sourceRoot,
      serverDir: path.join(sourceRoot, 'server'),
      databaseDir: path.join(sourceRoot, 'database'),
      clientDir: path.join(sourceRoot, 'dist/client'),
      storageDir: path.join(directory, 'storage'),
    },
  });
  servers.push(server);
  return server;
}

async function apiRequest(
  server: StandaloneServer,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // A cookie-authenticated write is checked against a trusted origin; the test configuration trusts
  // `http://localhost`, which is also where every request below is addressed.
  const headers = new Headers(init?.headers);
  headers.set('origin', 'http://localhost');
  const { databaseManagerToken } = await import('@nocobase/db');
  const connection = server.application.container
    .resolve(databaseManagerToken)
    .connection();
  const client = await connection.client<import('knex').Knex>();
  const counts = {
    reads: 0,
    writes: 0,
    lockingReads: 0,
    begins: 0,
    commits: 0,
    rollbacks: 0,
  };
  const listener = ({ sql }: { sql: string }) => {
    if (/^select/i.test(sql)) counts.reads++;
    if (/^(insert|update|delete)/i.test(sql)) counts.writes++;
    if (/for update/i.test(sql)) counts.lockingReads++;
    if (/^begin/i.test(sql)) counts.begins++;
    if (/^commit/i.test(sql)) counts.commits++;
    if (/^rollback/i.test(sql)) counts.rollbacks++;
  };
  client.on('query', listener);
  try {
    const response = await server.fetch(
      new Request(
        `http://localhost${server.application.publicBasePath}/api${path}`,
        {
          ...init,
          headers,
        },
      ),
    );
    const route = path
      .split('?')[0]!
      .replace(/(\/users\/)(?!options|invitations|me)[^/]+/, '$1:id');
    appendFileSync(
      joinPath(tmpdir(), 'pm358-http-costs.jsonl'),
      JSON.stringify({
        dialect: connection.dialect,
        method: init?.method ?? 'GET',
        route,
        status: response.status,
        ...counts,
      }) + '\n',
    );
    return response;
  } finally {
    client.off('query', listener);
  }
}

function cookieOf(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
}

async function signInAsAdmin(server: StandaloneServer): Promise<string> {
  const response = await apiRequest(server, '/auth/sign-in/username', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'nocobase', password: 'admin123' }),
  });
  expect(response.status).toBe(200);
  return cookieOf(response);
}

async function createMember(
  server: StandaloneServer,
  adminCookie: string,
): Promise<{ readonly userId: string; readonly email: string }> {
  const email = `member-${Math.random().toString(36).slice(2)}@example.com`;
  const response = await apiRequest(server, '/users', {
    method: 'POST',
    headers: { cookie: adminCookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Member',
      email,
      password: 'OldPassword123!',
    }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { id: string } };
  return { userId: body.data.id, email };
}

describe('member management permission boundaries', () => {
  it('refuses role creation by anonymous and unpermitted callers', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { email } = await createMember(server, adminCookie);
    const signedIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(signedIn.status).toBe(200);
    for (const [cookie, status] of [
      ['', 401],
      [cookieOf(signedIn), 403],
    ] as const) {
      const response = await apiRequest(server, '/access/roles', {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Synthetic copy' }),
      });
      expect(response.status).toBe(status);
    }
  });
});

describe('resetting a member’s password through the real application', () => {
  it('lets an authorized administrator reset a member’s password, revoking the member’s session and the old password', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { userId, email } = await createMember(server, adminCookie);

    const memberSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(memberSignIn.status).toBe(200);
    const memberCookie = cookieOf(memberSignIn);

    const beforeReset = await apiRequest(server, '/users/me/preferences', {
      headers: { cookie: memberCookie },
    });
    expect(beforeReset.status).toBe(200);

    const { scopedApiKeysToken } =
      await import('@nocobase/app-plugin-api-keys/server');
    const keys = server.application.container.resolve(scopedApiKeysToken);
    const personalKey = await keys.create(
      userId,
      { name: 'Synthetic retained key', expiresInDays: 1, scope: null },
      await keys.identityOf(userId),
    );
    const keyRequest = () =>
      apiRequest(server, '/users/me/preferences', {
        headers: { 'x-api-key': personalKey.secret },
      });
    expect((await keyRequest()).status).toBe(200);

    const reset = await apiRequest(server, `/users/${userId}/resetPassword`, {
      method: 'POST',
      headers: { cookie: adminCookie, 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'NewPassword456!' }),
    });
    expect(reset.status).toBe(204);

    const afterReset = await apiRequest(server, '/users/me/preferences', {
      headers: { cookie: memberCookie },
    });
    expect(afterReset.status).toBe(401);

    const oldPasswordSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(oldPasswordSignIn.status).toBe(401);

    const newPasswordSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'NewPassword456!' }),
    });
    expect(newPasswordSignIn.status).toBe(200);
    const signedInUser = (await newPasswordSignIn.json()) as {
      user: { id: string };
    };
    expect(signedInUser.user.id).toBe(userId);
    expect((await keyRequest()).status).toBe(200);
    expect((await keys.get(userId, personalKey.key.id)).id).toBe(
      personalKey.key.id,
    );
    const disabled = await apiRequest(server, `/users/${userId}/disable`, {
      method: 'POST',
      headers: { cookie: adminCookie },
    });
    expect(disabled.status).toBe(200);
    const inactive = await keyRequest();
    expect(inactive.status).toBeGreaterThanOrEqual(400);
    expect(inactive.status).toBeLessThan(500);
    const enabled = await apiRequest(server, `/users/${userId}/enable`, {
      method: 'POST',
      headers: { cookie: adminCookie },
    });
    expect(enabled.status).toBe(200);
    expect((await keyRequest()).status).toBe(200);
    expect((await keys.get(userId, personalKey.key.id)).id).toBe(
      personalKey.key.id,
    );
  });

  it('refuses a caller without the reset-password permission', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { userId, email } = await createMember(server, adminCookie);
    const memberSignIn = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    const memberCookie = cookieOf(memberSignIn);

    const response = await apiRequest(
      server,
      `/users/${userId}/resetPassword`,
      {
        method: 'POST',
        headers: { cookie: memberCookie, 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword456!' }),
      },
    );

    expect(response.status).toBe(403);
    const signInStillWorks = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'OldPassword123!' }),
    });
    expect(signInStillWorks.status).toBe(200);
  });

  it('refuses an anonymous caller', async () => {
    const server = await startApp();
    const adminCookie = await signInAsAdmin(server);
    const { userId } = await createMember(server, adminCookie);

    const response = await apiRequest(
      server,
      `/users/${userId}/resetPassword`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword456!' }),
      },
    );

    expect(response.status).toBe(401);
  });
});

describe('ordinary user management through the actual HTTP boundary', () => {
  it('uses independent user actions, filters system accounts, supports disabled users, and denies revocation and old routes', async () => {
    const server = await startApp();
    const cookie = await signInAsAdmin(server);
    const manager = await createMember(server, cookie),
      target = await createMember(server, cookie);
    const send = (
      path: string,
      method: string,
      body: unknown,
      session = cookie,
    ) =>
      apiRequest(server, path, {
        method,
        headers: { cookie: session, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const settings = Object.fromEntries(
      [
        'read',
        'update',
        'disable',
        'enable',
        'reset-password',
        'assign-role',
      ].map((action) => [`user/${action}`, true]),
    );
    const created = await send('/access/roles', 'POST', {
      title: 'Account manager',
      settings,
    });
    expect(created.status).toBe(201);
    const role = ((await created.json()) as { data: { key: string } }).data.key;
    expect(
      (
        await send(`/users/${manager.userId}/roleScopes/studio`, 'PUT', {
          value: [role],
        })
      ).status,
    ).toBe(200);
    const signed = await apiRequest(server, '/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: manager.email,
        password: 'OldPassword123!',
      }),
    });
    expect(signed.status).toBe(200);
    const managerCookie = cookieOf(signed);
    const listing = await apiRequest(server, '/users', {
      headers: { cookie: managerCookie },
    });
    expect(listing.status).toBe(200);
    const users = (await listing.json()) as {
      data: { id: string }[];
      meta: { total: number; systemAdministratorCount: number };
    };
    expect(users.meta.total).toBe(2);
    expect(users.meta.systemAdministratorCount).toBe(1);
    expect(
      (
        await apiRequest(server, '/users/options', {
          headers: { cookie: managerCookie },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await apiRequest(server, '/access/roles', {
          headers: { cookie: managerCookie },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await send(
          `/users/${target.userId}/roleScopes/studio`,
          'PUT',
          { value: ['contributor'] },
          managerCookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await send(
          `/users/${target.userId}/roleScopes/studio`,
          'PUT',
          { value: ['owner'] },
          managerCookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await send(
          `/users/${target.userId}`,
          'PATCH',
          { name: 'Updated member', username: 'member358' },
          managerCookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await send(
          `/users/${target.userId}`,
          'PATCH',
          { email: manager.email },
          managerCookie,
        )
      ).status,
    ).toBe(409);
    expect(
      (await send(`/users/${target.userId}/disable`, 'POST', {}, managerCookie))
        .status,
    ).toBe(200);
    const disabled = await apiRequest(server, '/users?status=disabled', {
      headers: { cookie: managerCookie },
    });
    expect(disabled.status).toBe(200);
    expect(
      ((await disabled.json()) as { data: { id: string }[] }).data.map(
        (user) => user.id,
      ),
    ).toEqual([target.userId]);
    expect(
      (await send(`/users/${target.userId}/enable`, 'POST', {}, managerCookie))
        .status,
    ).toBe(200);
    const forgedOrigin = await server.fetch(
      new Request(
        `http://localhost${server.application.publicBasePath}/api/users/${target.userId}`,
        {
          method: 'PATCH',
          headers: {
            cookie: managerCookie,
            origin: 'https://untrusted.example.test',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ name: 'Forbidden' }),
        },
      ),
    );
    expect(forgedOrigin.status).toBe(403);
    settings['user/update'] = false;
    expect(
      (await send(`/access/roles/${role}`, 'PATCH', { settings })).status,
    ).toBe(200);
    expect(
      (
        await send(
          `/users/${target.userId}`,
          'PATCH',
          { name: 'Forbidden' },
          managerCookie,
        )
      ).status,
    ).toBe(403);
    const additional = await send('/access/roles', 'POST', {
      title: 'Profile editor',
      settings: { 'user/update': true },
    });
    const additionalKey = (
      (await additional.json()) as { data: { key: string } }
    ).data.key;
    expect(
      (
        await send(`/users/${manager.userId}/roleScopes/studio`, 'PUT', {
          value: [role, additionalKey],
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await send(
          `/users/${target.userId}`,
          'PATCH',
          { name: 'Allowed by second role' },
          managerCookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await send(
          `/access/members/${target.userId}`,
          'PATCH',
          { roles: [] },
          managerCookie,
        )
      ).status,
    ).toBe(404);
    const concurrent = await Promise.all([
      send(`/users/${target.userId}/disable`, 'POST', {}),
      send(`/users/${target.userId}/roleScopes/studio`, 'PUT', {
        value: ['contributor', 'admin'],
      }),
    ]);
    expect(concurrent[0]!.status).toBe(200);
    expect([200, 400]).toContain(concurrent[1]!.status);
    const stopped = await apiRequest(server, '/users?status=disabled', {
      headers: { cookie },
    });
    const final = (
      (await stopped.json()) as {
        data: { id: string; roleScopes: { studio: string[] } }[];
      }
    ).data.find((user) => user.id === target.userId)!;
    expect([...final.roleScopes.studio].sort()).toEqual(
      concurrent[1]!.status === 200
        ? ['admin', 'contributor']
        : ['contributor'],
    );
    expect(
      (await send(`/users/${target.userId}/enable`, 'POST', {})).status,
    ).toBe(200);
    const actorRace = await Promise.all([
      send(`/users/${manager.userId}/disable`, 'POST', {}),
      send(
        `/users/${target.userId}/roleScopes/studio`,
        'PUT',
        { value: ['contributor', additionalKey] },
        managerCookie,
      ),
    ]);
    expect(actorRace[0]!.status).toBe(200);
    expect([200, 401, 403]).toContain(actorRace[1]!.status);
    const afterActorRace = await apiRequest(server, '/users', {
      headers: { cookie },
    });
    const result = (
      (await afterActorRace.json()) as {
        data: { id: string; roleScopes: { studio: string[] } }[];
      }
    ).data.find((user) => user.id === target.userId)!;
    expect([...result.roleScopes.studio].sort()).toEqual(
      actorRace[1]!.status === 200
        ? ['contributor', additionalKey].sort()
        : [...final.roleScopes.studio].sort(),
    );
  }, 120_000);
  it('establishes distinct sessions on shared-database instances in the same second', async () => {
    const first = await startApp();
    const second = await startApp(configs.at(-1));
    // Freeze only ID generation after startup, beyond the seed IDs. Authentication and expiry use real time.
    const now = Date.now() + 1_000;
    for (const server of [first, second]) {
      const config =
        server.application.config.get<SnowflakeIdGeneratorConfig>('snowflake')!;
      const ids = new SnowflakeIdGenerator({ ...config, clock: () => now });
      vi.spyOn(
        server.application.container.resolve(idGeneratorToken),
        'generateString',
      ).mockImplementation(() => ids.generateString());
    }
    const firstCookie = await signInAsAdmin(first);
    const secondCookie = await signInAsAdmin(second);
    expect(Boolean(firstCookie) && Boolean(secondCookie)).toBe(true);
    expect(firstCookie === secondCookie).toBe(false);
    for (const server of [first, second]) {
      for (const cookie of [firstCookie, secondCookie]) {
        expect(
          (await apiRequest(server, '/users', { headers: { cookie } })).status,
        ).toBe(200);
      }
    }
  });
  it('rejects account writes from ordinary and scoped keys, fails closed for unknown legacy permissions and observes revocation in a second instance', async () => {
    const first = await startApp();
    const second = await startApp(configs.at(-1));
    const cookie = await signInAsAdmin(first);
    const member = await createMember(first, cookie);
    const { scopedApiKeysToken } =
      await import('@nocobase/app-plugin-api-keys/server');
    const keys = first.application.container.resolve(scopedApiKeysToken);
    const signed = await apiRequest(first, '/auth/get-session', {
      headers: { cookie },
    });
    const principal = (await signed.json()) as { user: { id: string } };
    const identity = await keys.identityOf(principal.user.id);
    for (const scope of [
      null,
      { groups: { 'studio.members': { level: 'admin' } } },
      'legacy-wildcard',
    ]) {
      const created = await keys.create(
        principal.user.id,
        {
          name: 'Synthetic key',
          expiresInDays: 1,
          scope: typeof scope === 'string' ? null : scope,
        },
        identity,
      );
      if (scope === 'legacy-wildcard') {
        const { databaseManagerToken } = await import('@nocobase/db');
        await first.application.container
          .resolve(databaseManagerToken)
          .connection()
          .query.updateTable('apikey')
          .set({ permissions: JSON.stringify({ '*': ['*'] }) })
          .where('id', '=', created.key.id)
          .execute();
      }
      for (const [suffix, method, body] of [
        ['', 'PATCH', { name: 'Denied' }],
        ['/disable', 'POST', {}],
        ['/enable', 'POST', {}],
        ['/resetPassword', 'POST', { password: 'SyntheticNewPassword123!' }],
      ] as const) {
        const response = await apiRequest(
          second,
          `/users/${member.userId}${suffix}`,
          {
            method,
            headers: {
              'x-api-key': created.secret,
              'content-type': 'application/json',
            },
            body: JSON.stringify(body),
          },
        );
        expect(response.status).toBe(403);
      }
      const keyRead = await apiRequest(second, '/users', {
        headers: { 'x-api-key': created.secret },
      });
      expect(keyRead.status).toBe(scope === 'legacy-wildcard' ? 403 : 200);
    }
    const org = await apiRequest(first, '/organizationKeys', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Synthetic service wildcard',
        scope: { groups: { 'studio.members': { level: 'admin' } } },
        expiresInDays: 1,
      }),
    });
    expect(org.status).toBe(201);
    const service = (
      (await org.json()) as {
        data: { secret: string; key: { id: string; keyId: string } };
      }
    ).data;
    const { databaseManagerToken } = await import('@nocobase/db');
    await first.application.container
      .resolve(databaseManagerToken)
      .connection()
      .query.updateTable('apikey')
      .set({ permissions: null })
      .where('id', '=', service.key.keyId)
      .execute();
    expect(
      (
        await apiRequest(second, '/users', {
          headers: { 'x-api-key': service.secret },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await apiRequest(second, `/users/${member.userId}`, {
          method: 'PATCH',
          headers: {
            'x-api-key': service.secret,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ name: 'Denied' }),
        })
      ).status,
    ).toBe(403);
    const send = (
      server: StandaloneServer,
      route: string,
      method: string,
      body: unknown,
      session = cookie,
    ) =>
      apiRequest(server, route, {
        method,
        headers: { cookie: session, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const roleResponse = await send(first, '/access/roles', 'POST', {
      title: 'Shared reader',
      settings: { 'user/read': true },
    });
    const role = ((await roleResponse.json()) as { data: { key: string } }).data
      .key;
    expect(
      (
        await send(first, `/users/${member.userId}/roleScopes/studio`, 'PUT', {
          value: [role],
        })
      ).status,
    ).toBe(200);
    const login = await send(
      second,
      '/auth/sign-in/email',
      'POST',
      { email: member.email, password: 'OldPassword123!' },
      '',
    );
    expect(login.status).toBe(200);
    const memberCookie = cookieOf(login);
    expect(
      (
        await apiRequest(second, '/users', {
          headers: { cookie: memberCookie },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await send(first, `/access/roles/${role}`, 'PATCH', {
          settings: { 'user/read': false },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await apiRequest(second, '/users', {
          headers: { cookie: memberCookie },
        })
      ).status,
    ).toBe(403);
    expect(
      (await send(first, `/users/${member.userId}/disable`, 'POST', {})).status,
    ).toBe(200);
    expect(
      (
        await apiRequest(second, '/users/me/preferences', {
          headers: { cookie: memberCookie },
        })
      ).status,
    ).toBe(401);
  }, 120_000);
  it('keeps ordinary, scoped and service key identities through offline equivalence application and recovery', async () => {
    const server = await startApp();
    const cookie = await signInAsAdmin(server);
    const { databaseManagerToken } = await import('@nocobase/db');
    const database = server.application.container.resolve(databaseManagerToken);
    const connection = database.connection();
    const { scopedApiKeysToken } =
      await import('@nocobase/app-plugin-api-keys/server');
    const keys = server.application.container.resolve(scopedApiKeysToken);
    const { authorizationToken } =
      await import('@nocobase/app-plugin-authorization');
    const authorization =
      server.application.container.resolve(authorizationToken);
    const personal: { id: string; secret: string }[] = [];
    for (const scope of [
      null,
      { groups: { 'projects.projects': { level: 'read' as const } } },
    ]) {
      const member = await createMember(server, cookie);
      const role = 'synthetic-business-' + member.userId;
      await authorization.permissionSets.create({
        key: role,
        grants: [
          {
            resource: { type: 'pm', id: 'pm.projects' },
            actions: [{ action: 'view.all' }],
          },
        ],
      });
      const replacement = await apiRequest(
        server,
        `/users/${member.userId}/roleScopes/studio`,
        {
          method: 'PUT',
          headers: { cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ value: [role] }),
        },
      );
      expect(replacement.status).toBe(200);
      expect(
        (
          await authorization.permissionSets.getEffective(
            await keys.identityOf(member.userId),
          )
        )
          .map((set) => set.key)
          .sort(),
      ).toEqual([role, 'member'].sort());
      const created = await keys.create(
        member.userId,
        { name: 'Synthetic equivalent key', scope, expiresInDays: 1 },
        await keys.identityOf(member.userId),
      );
      personal.push({ id: created.key.id, secret: created.secret });
      expect(
        (
          await apiRequest(server, '/projects', {
            headers: { 'x-api-key': created.secret },
          })
        ).status,
      ).toBe(200);
      // Projects performs first admission once. Replace its default role after that existing chain ran.
      expect(
        (
          await apiRequest(
            server,
            `/users/${member.userId}/roleScopes/studio`,
            {
              method: 'PUT',
              headers: { cookie, 'content-type': 'application/json' },
              body: JSON.stringify({ value: [role] }),
            },
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await apiRequest(server, '/users', {
            headers: { 'x-api-key': created.secret },
          })
        ).status,
      ).toBe(403);
    }
    const org = await apiRequest(server, '/organizationKeys', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Synthetic equivalent role key',
        scope: { groups: { 'studio.members': { level: 'admin' } } },
        expiresInDays: 1,
      }),
    });
    expect(org.status).toBe(201);
    const service = (
      (await org.json()) as {
        data: { secret: string; key: { id: string; keyId: string } };
      }
    ).data;
    const privateKey = 'api-key-' + service.key.id;
    const beforePrivate = [
      {
        resource: { type: 'settings', id: 'pm.members' },
        actions: [{ action: 'define-roles' }],
      },
    ];
    await connection.repository('authorizationPermissionSets').updateOne({
      filter: { key: privateKey },
      values: { grants: beforePrivate },
    });
    expect(
      await authorization.for(await keys.identityOf(service.key.id)).can({
        resource: { type: 'settings', id: 'pm.members' },
        action: 'define-roles',
      }),
    ).toBe(true);
    const client = await connection.client<import('knex').Knex>();
    // Synthesize a legacy installation ledger; never modify an external instance.
    await client('__nocobase_seeds')
      .whereIn('name', [
        '202610010021z_studio_account_defaults',
        '202610250020_studio_access_v2',
      ])
      .delete();
    await connection
      .repository('studioAccessUpgradeChanges')
      .deleteMany({ filter: { version: 'pm358-v1' } });
    const identitiesBefore = await connection.query
      .selectFrom('apikey')
      .select(['id', 'referenceId', 'permissions', 'createdAt'])
      .orderBy('id')
      .execute();
    const { prepareStudioAccessUpgrade } =
      await import('../../server/access/upgrade-preflight.js');
    const { studioAccessToken } = await import('../../server/access/token.js');
    const inventory = await prepareStudioAccessUpgrade(
      connection,
      server.application.container.resolve(studioAccessToken),
    );
    expect(inventory.keyReviewRequired).toBe(0);
    const file = path.join(
      configs.at(-1)!.directory,
      'equivalent-inventory.json',
    );
    const { writeFileSync } = await import('node:fs');
    writeFileSync(file, JSON.stringify({ result: inventory }));
    const config = configs.at(-1)!;
    await server.close();
    servers.splice(servers.indexOf(server), 1);
    // Recreate only this test's known configuration; no credential file is read or copied.
    const values = {
      database: {
        connections: {
          main: {
            ...Object.fromEntries(
              Object.entries(config.testDatabases.connectionConfig()).filter(
                ([key, value]) =>
                  key !== 'databaseDriver' && typeof value !== 'function',
              ),
            ),
            migrations: { autoRun: false },
            seeds: { autoRun: false },
          },
        },
      },
      auth: {
        secret: 'test-auth-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
      },
      studio: { accessUpgrade: { maintenance: true } },
      releases: { host: { enabled: false } },
      logging: { level: 'error', file: { enabled: false } },
    };
    writeFileSync(config.path, JSON.stringify(values));
    const { bindTestAppCommand, runAppCommand } =
      await import('@nocobase/app-testing/cli');
    const { default: Apply } =
      await import('../../cli/commands/access-upgrade/apply.js');
    const boundApply = () =>
      bindTestAppCommand(Apply, {
        rootDir: path.resolve(import.meta.dirname, '../..'),
        config,
        id: 'app:access-upgrade:apply',
      });
    const dry = await runAppCommand(boundApply(), [
      '--file',
      file,
      '--dry-run',
      '--json',
    ]);
    expect(dry.json()).toMatchObject({ ok: true, status: 'success-noop' });
    const staleFile = path.join(config.directory, 'stale-inventory.json');
    writeFileSync(staleFile, JSON.stringify({ keyInventoryHash: 'stale' }));
    const stale = await runAppCommand(boundApply(), [
      '--file',
      staleFile,
      '--json',
    ]);
    expect(stale.json()).toMatchObject({
      ok: false,
      error: { code: 'STUDIO_KEY_INVENTORY_CONFLICT' },
    });
    const applied = await runAppCommand(
      bindTestAppCommand(Apply, {
        rootDir: path.resolve(import.meta.dirname, '../..'),
        config,
        id: 'app:access-upgrade:apply',
      }),
      ['--file', file, '--json'],
    );
    expect(applied.json()).toMatchObject({ ok: true });
    if (connection.dialect === 'mysql')
      expect(applied.stderr).toContain(
        '.returning() is not supported by mysql',
      );
    values.studio.accessUpgrade.maintenance = false;
    writeFileSync(config.path, JSON.stringify(values));
    const after = await startApp(config);
    const afterDatabase =
      after.application.container.resolve(databaseManagerToken);
    expect(
      await afterDatabase
        .connection()
        .query.selectFrom('apikey')
        .select(['id', 'referenceId', 'permissions', 'createdAt'])
        .orderBy('id')
        .execute(),
    ).toEqual(identitiesBefore);
    for (const key of personal) {
      expect(
        (
          await apiRequest(after, '/projects', {
            headers: { 'x-api-key': key.secret },
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await apiRequest(after, '/users', {
            headers: { 'x-api-key': key.secret },
          })
        ).status,
      ).toBe(403);
    }
    const allowed = await apiRequest(after, '/access/roles', {
      method: 'POST',
      headers: {
        'x-api-key': service.secret,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Synthetic role from equivalent key' }),
    });
    expect(allowed.status).toBe(201);
    expect(
      (
        await apiRequest(after, '/users', {
          headers: { 'x-api-key': service.secret },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await apiRequest(after, '/users/irrelevant/resetPassword', {
          method: 'POST',
          headers: {
            'x-api-key': service.secret,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ password: 'SyntheticPassword123!' }),
        })
      ).status,
    ).toBe(403);
    await after.close();
    servers.splice(servers.indexOf(after), 1);
    values.studio.accessUpgrade.maintenance = true;
    writeFileSync(config.path, JSON.stringify(values));
    const recovery = await startApp(config);
    const recoveryDatabase =
      recovery.application.container.resolve(databaseManagerToken);
    const { restoreStudioAccess } =
      await import('../../server/access/upgrade-recovery.js');
    expect(
      await restoreStudioAccess(
        recoveryDatabase,
        recovery.application.container.resolve(authorizationToken),
      ),
    ).toBe(1);
    expect(
      (await recoveryDatabase
        .connection()
        .repository<{ grants: unknown }>('authorizationPermissionSets')
        .findOne({ filter: { key: privateKey } }))!.grants,
    ).toEqual(beforePrivate);
    expect(
      await restoreStudioAccess(
        recoveryDatabase,
        recovery.application.container.resolve(authorizationToken),
      ),
    ).toBe(0);
  });
  it('fences role and account writes during maintenance while exposing an authorized read-only preflight', async () => {
    const server = await startApp(undefined, true);
    const cookie = await signInAsAdmin(server);
    const preview = await apiRequest(server, '/access/upgrades/pm358/prepare', {
      headers: { cookie },
    });
    expect(preview.status).toBe(200);
    const { bindTestAppCommand, runAppCommand } =
      await import('@nocobase/app-testing/cli');
    const { default: Prepare } =
      await import('../../cli/commands/access-upgrade/prepare.js');
    const { databaseManagerToken } = await import('@nocobase/db');
    const database = server.application.container.resolve(databaseManagerToken);
    const client = await database.connection().client<import('knex').Knex>();
    const ledgerBefore = await client('__nocobase_seeds')
      .select('*')
      .orderBy('id');
    const offline = await runAppCommand(
      bindTestAppCommand(Prepare, {
        rootDir: path.resolve(import.meta.dirname, '../..'),
        config: configs.at(-1)!,
        id: 'app:access-upgrade:prepare',
      }),
      ['--json'],
    );
    expect(offline.error).toBeUndefined();
    expect(offline.json()).toMatchObject({
      ok: true,
      result: { version: 'pm358-v1' },
    });
    expect(await client('__nocobase_seeds').select('*').orderBy('id')).toEqual(
      ledgerBefore,
    );

    for (const route of ['/access/roles/admin', '/users/synthetic']) {
      const response = await apiRequest(server, route, {
        method: 'PATCH',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({
          settings: { 'pm.members/read': true },
          name: 'Blocked',
        }),
      });
      expect(response.status).toBe(503);
    }
    expect(
      (await apiRequest(server, '/access/upgrades/pm358/prepare')).status,
    ).toBe(401);
  }, 120_000);
});

it('keeps Projects invitations role-scope free and admits the configured Studio default', async () => {
  const server = await startApp();
  const cookie = await signInAsAdmin(server);
  const response = await apiRequest(server, '/projects/invitations', {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ emails: ['default-admission@example.test'] }),
  });
  expect(response.status).toBe(201);
  const invitation = (await response.json()) as {
    data: { results: { inviteUrl: string }[] };
  };
  const token = new URL(invitation.data.results[0]!.inviteUrl).pathname
    .split('/')
    .at(-1)!;
  const { databaseManagerToken } = await import('@nocobase/db');
  const connection = server.application.container
    .resolve(databaseManagerToken)
    .connection();
  const pending = await connection
    .repository<{ roleScopes: unknown }>('userInvitations')
    .findMany();
  expect(pending).toHaveLength(1);
  const scopes = pending[0]!.roleScopes;
  expect(typeof scopes === 'string' ? JSON.parse(scopes) : scopes).toEqual({});
  const accepted = await apiRequest(server, '/users/invitations/accept', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token,
      name: 'Default admission',
      password: 'SyntheticPassword123!',
    }),
  });
  expect(accepted.status).toBe(200);
  expect(await accepted.json()).toMatchObject({
    data: { email: 'default-admission@example.test', existingAccount: false },
  });
  const admitted = await connection
    .repository<{ id: string }>('user')
    .findOne({ filter: { email: 'default-admission@example.test' } });
  expect(admitted).not.toBeNull();
  const { authorizationToken } =
    await import('@nocobase/app-plugin-authorization');
  const assignments = await server.application.container
    .resolve(authorizationToken)
    .permissionSets.listAssignments('contributor');
  expect(
    assignments.filter((entry) => entry.subject.id === admitted!.id),
  ).toHaveLength(1);
});
