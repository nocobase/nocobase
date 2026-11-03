import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

const PASSWORD = 'correct horse battery staple';

let app: TestApp;
let adminId: string;
let memberId: string;
let otherId: string;

async function createUser(username: string): Promise<string> {
  const users = app.application.container.resolve(
    userAdministrationServiceToken,
  );
  const user = await users.create({
    name: username,
    username,
    email: `${username}@example.com`,
    password: PASSWORD,
  });
  return user.id;
}

const signInAs = (email: string): Promise<TestSession> =>
  signIn(app, { email, password: PASSWORD });

const send = (
  session: TestSession,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> =>
  session.fetch(path, {
    method,
    headers: {
      origin: 'http://localhost',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const startSwitch = (session: TestSession, userId: string) =>
  send(session, 'POST', '/accountSwitcher/switches', { userId });

const whoAmI = async (session: TestSession): Promise<string | undefined> => {
  const response = await send(session, 'GET', '/auth/get-session');
  const body = (await response.json()) as { user?: { id: string } } | null;
  return body?.user?.id;
};

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { accountSwitcher: { mode: 'full' } },
  });
  adminId = await createUser('switching_admin');
  memberId = await createUser('switching_member');
  otherId = await createUser('switching_other');
  const { permissionSets } =
    app.application.container.resolve(authorizationToken);
  const root = (await permissionSets.list()).find(
    (set) => permissionSets.protection(set.key)?.unrestricted,
  );
  await permissionSets.assign({
    permissionSet: root!.key,
    subject: { type: 'user', id: adminId },
  });
});
afterAll(() => app.close());

describe('who may switch', () => {
  it('refuses an anonymous request', async () => {
    const response = await app.fetch(
      new Request('http://localhost/main/api/accountSwitcher/state'),
    );
    expect(response.status).toBe(401);
  });

  it('refuses a person without unrestricted access, and tells them they cannot', async () => {
    const member = await signInAs('switching_member@example.com');

    const state = await send(member, 'GET', '/accountSwitcher/state');
    expect(await state.json()).toEqual({
      data: { canSwitch: false, switched: null },
    });

    const list = await send(member, 'GET', '/accountSwitcher/accounts');
    expect(list.status).toBe(403);
    expect(await list.json()).toMatchObject({
      error: { reason: 'ACCOUNT_SWITCH_NOT_ALLOWED' },
    });

    const start = await startSwitch(member, otherId);
    expect(start.status).toBe(403);
    expect(await whoAmI(member)).toBe(memberId);
  });

  it('refuses a request carrying an API key, even beside a browser session', async () => {
    const admin = await signInAs('switching_admin@example.com');
    const response = await app.fetch(
      new Request('http://localhost/main/api/accountSwitcher/state', {
        headers: { cookie: admin.cookie, 'x-api-key': 'a-key' },
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { reason: 'ACCOUNT_SWITCH_BROWSER_ONLY' },
    });
  });
});

describe('a switch', () => {
  it('lists accounts with who is current and whose account is one’s own', async () => {
    const admin = await signInAs('switching_admin@example.com');
    const response = await send(
      admin,
      'GET',
      '/accountSwitcher/accounts?q=switching_member',
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { id: string; current: boolean; own: boolean }[];
      meta: { total: number };
    };
    expect(body.meta.total).toBe(1);
    expect(body.data[0]).toMatchObject({
      id: memberId,
      current: false,
      own: false,
    });
  });

  it('acts as the account everywhere, moves between accounts, and returns', async () => {
    const admin = await signInAs('switching_admin@example.com');

    const started = await startSwitch(admin, memberId);
    expect(started.status).toBe(201);
    expect(await started.json()).toMatchObject({
      data: {
        canSwitch: true,
        switched: {
          actor: { id: adminId },
          target: { id: memberId },
        },
      },
    });
    expect(await whoAmI(admin)).toBe(memberId);

    // The signed-in person still decides, though the account acted as could not.
    const moved = await startSwitch(admin, otherId);
    expect(moved.status).toBe(201);
    expect(await whoAmI(admin)).toBe(otherId);
    const state = await send(admin, 'GET', '/accountSwitcher/state');
    expect(await state.json()).toMatchObject({
      data: {
        canSwitch: true,
        switched: { actor: { id: adminId }, target: { id: otherId } },
      },
    });
    const accounts = await send(
      admin,
      'GET',
      '/accountSwitcher/accounts?q=switching_admin',
    );
    expect(await accounts.json()).toMatchObject({
      data: [{ id: adminId, current: false, own: true }],
    });

    const returned = await send(
      admin,
      'DELETE',
      '/accountSwitcher/switches/current',
    );
    expect(returned.status).toBe(204);
    expect(await whoAmI(admin)).toBe(adminId);
    expect(
      await send(admin, 'DELETE', '/accountSwitcher/switches/current'),
    ).toHaveProperty('status', 204);
  });

  it('stays with the session that started it', async () => {
    const elsewhere = await signInAs('switching_admin@example.com');
    const admin = await signInAs('switching_admin@example.com');
    await startSwitch(admin, memberId);

    expect(await whoAmI(admin)).toBe(memberId);
    expect(await whoAmI(elsewhere)).toBe(adminId);

    await send(admin, 'DELETE', '/accountSwitcher/switches/current');
  });

  it('refuses one’s own account, a missing one and a disabled one', async () => {
    const admin = await signInAs('switching_admin@example.com');
    const disabledId = await createUser('switching_disabled');
    await app.application.container
      .resolve(userAdministrationServiceToken)
      .disable(disabledId);

    for (const userId of [adminId, 'no-such-account', disabledId]) {
      const response = await startSwitch(admin, userId);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { reason: 'ACCOUNT_NOT_SWITCHABLE' },
      });
    }
    expect(await whoAmI(admin)).toBe(adminId);
  });
});

describe('while acting as another account', () => {
  it('refuses API keys and Better Auth writes, leaving both accounts unchanged', async () => {
    const admin = await signInAs('switching_admin@example.com');
    await startSwitch(admin, memberId);

    const keys = await send(admin, 'GET', '/apiKeys');
    expect(keys.status).toBe(403);
    expect(await keys.json()).toMatchObject({
      error: { reason: 'ACCOUNT_SWITCH_FORBIDDEN_ACTION' },
    });
    const password = await send(admin, 'POST', '/auth/change-password', {
      currentPassword: PASSWORD,
      newPassword: 'another horse battery staple',
    });
    expect(password.status).toBe(403);
    const rename = await send(admin, 'POST', '/auth/update-user', {
      name: 'Renamed',
    });
    expect(rename.status).toBe(403);

    await send(admin, 'DELETE', '/accountSwitcher/switches/current');
    expect((await send(admin, 'GET', '/auth/get-session')).status).toBe(200);
  });

  it('ends the switch with the session when signing out', async () => {
    const admin = await signInAs('switching_admin@example.com');
    await startSwitch(admin, memberId);

    const signedOut = await send(admin, 'POST', '/auth/sign-out');
    expect(signedOut.status).toBe(200);
    expect(await whoAmI(admin)).toBeUndefined();
    const open = await app.connection.query
      .selectFrom('accountSwitches')
      .select('id')
      .where('actorUserId', '=', adminId)
      .where('endedAt', 'is', null)
      .execute();
    expect(open).toEqual([]);
  });

  it('refuses the next request when the switch has run out, then acts as the signed-in person', async () => {
    const admin = await signInAs('switching_admin@example.com');
    await startSwitch(admin, memberId);
    await app.connection.query
      .updateTable('accountSwitches')
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where('actorUserId', '=', adminId)
      .where('endedAt', 'is', null)
      .execute();

    const refused = await send(admin, 'GET', '/accountSwitcher/state');
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'ACCOUNT_SWITCH_ENDED' },
    });
    expect(await whoAmI(admin)).toBe(adminId);
    const ended = await app.connection.query
      .selectFrom('accountSwitches')
      .select(['endReason'])
      .where('actorUserId', '=', adminId)
      .orderBy('startedAt', 'desc')
      .executeTakeFirst<{ endReason: string }>();
    expect(ended?.endReason).toBe('expired');
  });

  it('ends the switch when the account is disabled meanwhile', async () => {
    const admin = await signInAs('switching_admin@example.com');
    const targetId = await createUser('switching_short_lived');
    await startSwitch(admin, targetId);
    await app.application.container
      .resolve(userAdministrationServiceToken)
      .disable(targetId);

    const refused = await send(admin, 'GET', '/accountSwitcher/state');
    expect(refused.status).toBe(409);
    expect(await whoAmI(admin)).toBe(adminId);
  });

  it('stops acting at once when the signed-in person’s session is revoked', async () => {
    const admin = await signInAs('switching_admin@example.com');
    await startSwitch(admin, memberId);
    await app.application.container
      .resolve(userAdministrationServiceToken)
      .revokeSessions(adminId);

    const response = await send(admin, 'GET', '/accountSwitcher/state');
    expect(response.status).toBe(401);
  });
});

it('declares every route for the API document', async () => {
  const undeclared = await findUndeclaredApiRoutes(app.application);
  expect(
    undeclared.filter((route) => route.path.includes('accountSwitcher')),
  ).toEqual([]);
  const documentResponse = await (
    await signInAs('switching_admin@example.com')
  ).fetch('/swagger');
  expect(documentResponse.status).toBe(200);
  const document = (await documentResponse.json()) as Parameters<
    typeof findApiDocumentSchemaProblems
  >[0];
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(JSON.stringify(document)).toContain('accountSwitcherStartSwitch');
});
