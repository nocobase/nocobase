import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { DemoModels } from '../../server/data/models.js';
import { DefaultDemoDataService } from '../../server/data/service.js';
import type { DemoDataset } from '../../shared/data.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
let calls: string[];
let disabled: Set<string>;
let revokedSessions: string[];

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
});
afterAll(() => app.close());
beforeEach(async () => {
  next = 1;
  calls = [];
  disabled = new Set();
  revokedSessions = [];
  await app.connection.query.deleteFrom('user').allowAllRows().execute();
  await app.connection.query
    .deleteFrom('demoModeAccounts')
    .allowAllRows()
    .execute();
});

/** The users plugin as far as demo accounts use it: accounts are rows of the fixture `user` table. */
let next = 1;
function users(): UserManagementService {
  const user = (id: string) => ({ id }) as never;
  return {
    async create(input: {
      username: string;
      email: string;
      roleScopes?: Record<string, unknown>;
    }) {
      const id = `u${next++}`;
      calls.push(
        `create ${input.username} ${JSON.stringify(input.roleScopes ?? null)}`,
      );
      await app.connection.query
        .insertInto('user')
        .values({ id, username: input.username, email: input.email })
        .execute();
      return user(id);
    },
    async update(id: string) {
      return user(id);
    },
    async resetPassword(id: string) {
      calls.push(`password ${id}`);
    },
    async enable(id: string) {
      calls.push(`enable ${id}`);
      disabled.delete(id);
      return user(id);
    },
    async disable(id: string) {
      calls.push(`disable ${id}`);
      disabled.add(id);
      return user(id);
    },
    async replaceRoleScope(id: string, scope: string, value: unknown) {
      calls.push(`role ${id} ${scope} ${JSON.stringify(value)}`);
      return user(id);
    },
    async revokeSessions(id: string) {
      revokedSessions.push(id);
    },
    async remove(id: string) {
      calls.push(`remove ${id}`);
    },
  } as unknown as UserManagementService;
}

function service(
  authorization?: () => AppAuthorization,
): DefaultDemoDataService {
  return new DefaultDemoDataService({
    authorization,
    database: app.application.container.resolve(databaseManagerToken),

    enabled: () => true,
    models: new DemoModels(),
    modelBaseUrl: () => 'http://127.0.0.1/demoMode/models/v1',
    users,
  });
}

const dataset = (): DemoDataset => ({
  id: 'accounts',
  languages: ['en-US'],
  clear: async () => {},
  accounts: () => [],
  steps: () => [
    {
      key: 'people',
      run: async (context) => {
        await context.createAccount({
          username: 'ann',
          name: 'Ann',
          email: 'ann@example.com',
          roleScopes: { app: ['sales'] },
        });
      },
    },
  ],
});

it('gives a new account its role scopes and applies them again when an import reuses it', async () => {
  const demo = service();
  demo.register(dataset());
  await demo.importNow('admin');
  expect(calls).toEqual(['create ann {"app":["sales"]}']);
  calls = [];
  await demo.clear('admin');
  expect(calls).toEqual(['disable u1']);
  expect(disabled.has('u1')).toBe(true);
  expect(revokedSessions).toEqual(['u1']);
  calls = [];
  await demo.importNow('admin');
  expect(calls).toEqual(['password u1', 'enable u1', 'role u1 app ["sales"]']);
  await demo.clear('admin');
});

it('keeps the initiating demo account usable and tracked for reuse', async () => {
  const demo = service();
  demo.register(dataset());
  await demo.importNow('admin');
  calls = [];
  await demo.clear('u1');
  expect(calls).toEqual([]);
  expect(disabled.has('u1')).toBe(false);
  expect(revokedSessions).toEqual([]);
  expect(
    await app.connection.query
      .selectFrom('demoModeRecords')
      .select(['collection', 'recordId'])
      .execute(),
  ).toEqual([{ collection: '@user', recordId: 'u1' }]);
  // Clearing as a demo user must not disable the real administrator or prevent account reuse.
  expect(await demo.importNow('admin')).toMatchObject({ state: 'ready' });
  expect(disabled.has('u1')).toBe(false);
  await demo.clear('admin');
});

/** The authorization plugin's Permission Sets as far as demo roles use them, in memory. */
function permissionSets() {
  const sets = new Map<string, string>();
  let assignments: {
    id: string;
    subject: { type: string; id: string };
    permissionSet: string;
  }[] = [];
  let next = 1;
  const log: string[] = [];
  const api = {
    async get(key: string) {
      return sets.has(key) ? { key, title: sets.get(key) } : undefined;
    },
    async list() {
      return [...sets.keys()].map((key) => ({ key }));
    },
    async create(input: { key: string; title: string }) {
      log.push(`create ${input.key}`);
      sets.set(input.key, input.title);
    },
    async update(key: string, input: { title: string }) {
      log.push(`update ${key} ${input.title}`);
      sets.set(key, input.title);
    },
    async delete(key: string) {
      log.push(`delete ${key}`);
      sets.delete(key);
      assignments = assignments.filter((item) => item.permissionSet !== key);
    },
    async assign(input: {
      subject: { type: string; id: string };
      permissionSet: string;
    }) {
      const assignment = { id: `a${next++}`, ...input };
      log.push(
        `assign ${assignment.id} ${input.subject.id} ${input.permissionSet}`,
      );
      assignments.push(assignment);
      return assignment;
    },
    async revoke(id: string) {
      log.push(`revoke ${id}`);
      assignments = assignments.filter((item) => item.id !== id);
    },
    async listAssignments(permissionSet?: string) {
      return assignments.filter(
        (item) => !permissionSet || item.permissionSet === permissionSet,
      );
    },
    async replaceSubjectAssignments(input: { subject: { id: string } }) {
      assignments = assignments.filter(
        (item) => item.subject.id !== input.subject.id,
      );
      return [];
    },
  };
  return {
    log,
    assignments: () => assignments,
    authorization: () =>
      ({ permissionSets: api }) as unknown as AppAuthorization,
  };
}

it('keeps the accounts a reset creates again signed in and permitted, and releases the rest after the import', async () => {
  const roles = permissionSets();
  const demo = service(roles.authorization);
  let withBob = true;
  const during: unknown[] = [];
  demo.register({
    id: 'accounts',
    languages: ['en-US'],
    clear: async () => {
      // The cleanup runs while the carried account may still do what it did.
      during.push(
        disabled.has('u1'),
        roles.assignments().map((item) => item.id),
      );
    },
    accounts: () => [
      { username: 'ann', name: 'Ann', role: 'sales', password: 'ann12345' },
    ],
    steps: () => [
      {
        key: 'people',
        run: async (context) => {
          await context.createPermissionSet({
            key: 'demo.sales',
            title: 'Sales',
            grants: [],
          });
          await context.createAccount({
            username: 'ann',
            name: 'Ann',
            email: 'ann@example.com',
            password: 'ann12345',
            permissionSets: ['demo.sales'],
          });
          if (withBob) {
            await context.createAccount({
              username: 'bob',
              name: 'Bob',
              email: 'bob@example.com',
              permissionSets: ['demo.sales'],
            });
            await context.createPermissionSet({
              key: 'demo.obsolete',
              title: 'Obsolete',
              grants: [],
            });
            await context.assignPermissionSet('u1', 'demo.obsolete');
          }
        },
      },
    ],
  });
  await demo.importNow('admin');
  expect(roles.assignments().map((item) => item.id)).toEqual([
    'a1',
    'a2',
    'a3',
  ]);
  calls = [];
  roles.log.length = 0;
  withBob = false;
  expect(await demo.reset('u1', 'en-US', { wait: true })).toMatchObject({
    state: 'ready',
    records: 3,
  });
  expect(during).toEqual([false, ['a1', 'a2', 'a3']]);
  // Ann keeps her sessions, password and assignment; Bob, not created again, goes as a clear would take him.
  expect(calls).toEqual(['enable u1', 'disable u2']);
  expect(revokedSessions).toEqual(['u2']);
  expect(roles.log).toEqual([
    'update demo.sales Sales',
    'revoke a2',
    'revoke a3',
    'delete demo.obsolete',
  ]);
  expect(roles.assignments().map((item) => item.id)).toEqual(['a1']);
  calls = [];
  await demo.clear('u1');
  expect(calls).toEqual([]);
  expect(roles.assignments().map((item) => item.id)).toEqual(['a1']);
  await demo.clear('admin');
  expect(disabled.has('u1')).toBe(true);
  expect(roles.assignments()).toEqual([]);
});

it('answers a reset once it is claimed and reports how far the cleanup got', async () => {
  const demo = service();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let resetting = false;
  demo.register({
    ...dataset(),
    clear: async (context) => {
      if (!resetting) return;
      await context.progress(0.5);
      await gate;
    },
  });
  await demo.importNow('admin');
  resetting = true;
  expect(await demo.reset('admin')).toMatchObject({
    state: 'clearing',
    operation: 'reset',
  });
  await expect(demo.reset('admin')).rejects.toMatchObject({
    reason: 'DEMO_DATA_BUSY',
  });
  await vi.waitFor(async () =>
    expect((await demo.status()).importing?.percent).toBeGreaterThan(0),
  );
  release();
  await demo.whenIdle();
  expect(await demo.status()).toMatchObject({
    state: 'ready',
    operation: null,
    importing: null,
  });
  resetting = false;
  await demo.clear('admin');
});
