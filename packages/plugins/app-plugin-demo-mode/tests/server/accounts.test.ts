import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';

import { DemoModels } from '../../server/data/models.js';
import { DefaultDemoDataService } from '../../server/data/service.js';
import type { DemoDataset } from '../../server/data/types.js';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

let app: TestApp;
let calls: string[];
let disabled: Set<string>;
let revokedSessions: string[];

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { mode: 'observe', data: { models: false } } },
  });
});
afterAll(() => app.close());
beforeEach(async () => {
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
function users(): UserManagementService {
  let next = 1;
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
    async resetPassword() {},
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

function service(): DefaultDemoDataService {
  return new DefaultDemoDataService({
    database: app.application.container.resolve(databaseManagerToken),
    settings: { models: false },
    mode: () => 'observe',
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
  calls = [];
  await demo.importNow('admin');
  expect(calls).toEqual(['enable u1', 'role u1 app ["sales"]']);
  await demo.clear('admin');
});

it('always disables demo accounts so usernames remain reusable', async () => {
  const demo = service();
  demo.register(dataset());
  await demo.importNow('admin');
  calls = [];
  await demo.clear('admin');
  expect(calls).toEqual(['disable u1']);
});

it('disables and revokes sessions of a demo account that initiates cleanup', async () => {
  const demo = service();
  demo.register(dataset());
  await demo.importNow('admin');
  calls = [];
  await demo.clear('u1');
  expect(calls).toEqual(['disable u1']);
  expect(disabled.has('u1')).toBe(true);
  expect(revokedSessions).toEqual(['u1']);
  expect(
    await app.connection.query
      .selectFrom('demoModeRecords')
      .selectAll()
      .execute(),
  ).toEqual([]);
  // Clearing as a demo user must not disable the real administrator or prevent account reuse.
  expect(await demo.importNow('admin')).toMatchObject({ state: 'ready' });
  expect(disabled.has('u1')).toBe(false);
  await demo.clear('admin');
});
