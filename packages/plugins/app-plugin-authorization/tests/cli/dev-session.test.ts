import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  Auth,
  createUserAdministrationService,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DevSession, { type DevSessionResult } from '../../cli/dev-session.js';
import { createAppAuthorization } from '../../server/authorization.js';
import { authorizationToken } from '../../server/tokens.js';
import { migratePlugins } from '../helpers/database-fixture.js';

const cleanups: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function fixture(nodeEnv = 'development', deployment = false) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dev-session-'));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'test-app',
      nocobase: deployment ? { buildTarget: 'node' } : { templateKind: 'app' },
    }),
  );
  const container = new ServiceContainer();
  const registerProviders = vi.fn();
  const app = {
    nodeEnv,
    publicBasePath: '/main',
    paths: { storage: (value: string) => path.join(root, 'storage', value) },
    container,
    registerProviders,
    shutdown: vi.fn(),
  };
  const Command = bindAppCommand(DevSession, {
    id: 'authorization:dev-session',
    rootDir: root,
    loadRuntime: async () =>
      ({ env: { NODE_ENV: nodeEnv }, scope: { destroy: vi.fn() } }) as never,
    createApp: () => app as never,
  });
  const run = (...args: string[]) =>
    runAppCommand<DevSessionResult>(Command, [
      ...args,
      '--base',
      'http://localhost/main/',
      '--json',
    ]);
  return {
    root,
    app,
    run,
    state: path.join(root, 'storage/ui-workflow/auth.json'),
  };
}

async function databaseFixture() {
  const current = await fixture();
  const database = await createTestDatabase();
  cleanups.push(() => database.destroy());
  await migratePlugins(
    database.database,
    'app-plugin-authentication',
    'app-plugin-authorization',
  );
  const connection = database.database.connection();
  const auth = new Auth({
    connection,
    baseURL: 'http://localhost/main/api/auth',
    secret: 'development-session-test-secret-32-characters',
    session: { storeSessionInDatabase: true },
  });
  cleanups.push(() => auth.close());
  const users = createUserAdministrationService({ auth, connection });
  const authz = createAppAuthorization({ connection });
  await authz.permissionSets.create({ key: 'root', grants: [] });
  await authz.permissionSets.create({ key: 'member', grants: [] });
  const admin = await users.create({
    name: 'Administrator',
    email: 'admin@example.test',
    username: 'admin',
    password: 'administrator-test-password',
  });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: admin.id },
    permissionSet: 'root',
  });
  current.app.container.instance(databaseManagerToken, database.database);
  current.app.container.instance(userAdministrationServiceToken, users);
  current.app.container.instance(authorizationToken, authz);
  const passwords: string[] = [];
  const originalCreate = users.create.bind(users);
  vi.spyOn(users, 'create').mockImplementation((input) => {
    passwords.push(input.password);
    return originalCreate(input);
  });
  const originalReset = users.resetPassword.bind(users);
  vi.spyOn(users, 'resetPassword').mockImplementation((id, password) => {
    passwords.push(password);
    return originalReset(id, password);
  });
  vi.stubGlobal(
    'fetch',
    vi.fn((url: URL, init: RequestInit) =>
      auth.handler(new Request(url, init)),
    ),
  );
  const session = async () => {
    const saved = JSON.parse(await readFile(current.state, 'utf8'));
    const cookie = saved.cookies
      .map(
        (item: { name: string; value: string }) => `${item.name}=${item.value}`,
      )
      .join('; ');
    return {
      cookie,
      response: await auth.handler(
        new Request('http://localhost/main/api/auth/get-session', {
          headers: { Cookie: cookie },
        }),
      ),
    };
  };
  return { ...current, users, auth, authz, passwords, session };
}

describe('development browser sessions', () => {
  it.each([
    ['production', false],
    ['development', true],
  ] as const)(
    'refuses %s / deployment=%s before resolving services',
    async (nodeEnv, deployment) => {
      const { run, app } = await fixture(nodeEnv, deployment);
      const result = await run();
      expect(result.json()).toMatchObject({
        ok: false,
        error: { code: 'DEVELOPMENT_ONLY' },
      });
      expect(app.registerProviders).not.toHaveBeenCalled();
    },
  );

  it('reuses an account, replaces root with member, revokes the session and re-enables the account', async () => {
    const { run, state, session, auth, authz, users, passwords } =
      await databaseFixture();
    const first = await run();
    expect(first.json()).toMatchObject({
      ok: true,
      result: { role: 'root', revoked: false },
    });
    const userId = first.result!.userId!;
    const initial = await session();
    expect(await initial.response.json()).toMatchObject({
      user: { id: userId },
    });
    expect((await stat(state)).mode & 0o777).toBe(0o600);
    const second = await run('--role', 'member');
    expect(second.json()).toMatchObject({
      ok: true,
      result: { userId, role: 'member' },
    });
    expect(
      (await authz.permissionSets.listAssignments())
        .filter((item) => item.subject.id === userId)
        .map((item) => item.permissionSet),
    ).toEqual(['member']);
    const old = await auth.handler(
      new Request('http://localhost/main/api/auth/get-session', {
        headers: { Cookie: initial.cookie },
      }),
    );
    expect(await old.json()).toBeNull();
    const active = await session();
    expect(await active.response.json()).toMatchObject({
      user: { id: userId },
    });
    const stateText = await readFile(state, 'utf8');
    const revoked = await run('--revoke');
    expect(revoked.json()).toMatchObject({
      ok: true,
      result: { revoked: true, userId },
    });
    expect((await users.get(userId))!.disabledAt).not.toBeNull();
    await expect(stat(state)).rejects.toMatchObject({ code: 'ENOENT' });
    const expired = await auth.handler(
      new Request('http://localhost/main/api/auth/get-session', {
        headers: { Cookie: active.cookie },
      }),
    );
    expect(await expired.json()).toBeNull();
    const restored = await run();
    expect(restored.json()).toMatchObject({
      ok: true,
      result: { userId, role: 'root' },
    });
    expect((await users.get(userId))!.disabledAt).toBeNull();
    expect(passwords.length).toBe(3);
    expect(new Set(passwords).size).toBe(3);
    for (const password of passwords)
      expect(
        [
          first.stdout,
          first.stderr,
          second.stdout,
          second.stderr,
          revoked.stdout,
          revoked.stderr,
          restored.stdout,
          restored.stderr,
          stateText,
        ].join('\n'),
      ).not.toContain(password);
  });

  it('rejects missing roles and conflicting accounts without creating a session', async () => {
    const { run, users, state } = await databaseFixture();
    expect((await run('--role', 'unknown')).json()).toMatchObject({
      ok: false,
      error: { code: 'ROLE_NOT_FOUND' },
    });
    await users.create({
      name: 'Existing person',
      username: 'ui_check',
      email: 'person@example.test',
      password: 'existing-person-password',
    });
    expect((await run()).json()).toMatchObject({
      ok: false,
      error: { code: 'DEV_ACCOUNT_CONFLICT' },
    });
    await expect(stat(state)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
