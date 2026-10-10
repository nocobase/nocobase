// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUserAdministrationService } from '../../user-administration.js';
import { createAuthFixture } from './support.js';

describe('user administration', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  const setup = async (naming?: { readonly underscored: boolean }) => {
    const fixture = await createAuthFixture({}, naming);
    fixtures.push(fixture);
    const disconnectUser = vi.fn();
    const users = createUserAdministrationService({
      auth: fixture.auth,
      connection: fixture.connection,
      realtime: { disconnectUser } as never,
    });
    return { ...fixture, users, disconnectUser };
  };
  const setupList = async (naming?: { readonly underscored: boolean }) => {
    const fixture = await setup(naming);
    const now = new Date();
    for (const [id, name, email, disabled] of [
      ['plain', 'Alice Smith', 'alice@example.com', false],
      ['percent', '100% Coverage', 'percent@example.com', false],
      ['underscore', 'a_c report', 'underscore@example.com', false],
      ['literal', 'abc report', 'literal@example.com', false],
      ['inactive', 'Alice Retired', 'retired@example.com', true],
    ] as const) {
      await fixture.connection.query
        .insertInto('user')
        .values({
          id,
          name,
          email,
          emailVerified: false,
          ...(disabled ? { disabledAt: now } : {}),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
    return fixture;
  };
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  it('reports stable conflicts for duplicate email and username', async () => {
    const { users, signUp } = await setup();
    await signUp();
    await expect(
      users.create({
        name: 'Duplicate email',
        username: 'another.user',
        email: 'ALICE@EXAMPLE.COM',
        password: 'strong-password',
      }),
    ).rejects.toMatchObject({ code: 'USER_EMAIL_CONFLICT' });
    await expect(
      users.create({
        name: 'Duplicate username',
        username: 'ALICE.ADMIN',
        email: 'another@example.com',
        password: 'strong-password',
      }),
    ).rejects.toMatchObject({ code: 'USER_USERNAME_CONFLICT' });
  });

  it('updates an identity without treating its own values as conflicts', async () => {
    const { users, signUp, connection } = await setup();
    await signUp();
    const alice = await connection.query
      .selectFrom('user')
      .select('id')
      .where('email', '=', 'alice@example.com')
      .executeTakeFirstOrThrow();
    const bob = await users.create({
      name: 'Bob',
      username: 'bob',
      email: 'bob@example.com',
      password: 'strong-password',
    });
    await expect(
      users.update(String(alice.id), {
        email: 'ALICE@EXAMPLE.COM',
        username: 'ALICE.ADMIN',
      }),
    ).resolves.toMatchObject({
      email: 'alice@example.com',
      username: 'alice.admin',
    });
    await expect(
      users.update(String(alice.id), { email: bob.email }),
    ).rejects.toMatchObject({ code: 'USER_EMAIL_CONFLICT' });
    await expect(
      users.update(String(alice.id), { username: bob.username }),
    ).rejects.toMatchObject({ code: 'USER_USERNAME_CONFLICT' });
    await expect(
      users.update('unknown', { name: 'Nobody' }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('disables a user, revokes sessions, disconnects realtime, and permits login after enabling', async () => {
    const { users, signUp, connection, router, disconnectUser } = await setup();
    const { cookie } = await signUp();
    const user = await connection.query
      .selectFrom('user')
      .select('id')
      .where('email', '=', 'alice@example.com')
      .executeTakeFirstOrThrow();
    const id = String(user.id);
    expect(
      (await router.request('/private', { headers: { cookie } })).status,
    ).toBe(200);
    await users.disable(id);
    expect(disconnectUser).toHaveBeenCalledWith(id);
    expect(
      await connection.query
        .selectFrom('session')
        .select('id')
        .where('userId', '=', id)
        .execute(),
    ).toEqual([]);
    expect(
      (await router.request('/private', { headers: { cookie } })).status,
    ).toBe(401);
    await users.enable(id);
    const response = await router.request('/api/auth/sign-in/username', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'alice.admin',
        password: 'correct horse battery staple',
      }),
    });
    expect(response.status).toBe(200);
  });

  it('validates a new password and revokes existing sessions after reset', async () => {
    const { users, signUp, connection, router } = await setup();
    const { cookie } = await signUp();
    const user = await connection.query
      .selectFrom('user')
      .select('id')
      .where('email', '=', 'alice@example.com')
      .executeTakeFirstOrThrow();
    const id = String(user.id);
    await expect(users.resetPassword(id, 'short')).rejects.toMatchObject({
      code: 'PASSWORD_TOO_SHORT',
    });
    await users.resetPassword(id, 'replacement-password');
    expect(
      (await router.request('/private', { headers: { cookie } })).status,
    ).toBe(401);
    const response = await router.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'replacement-password',
      }),
    });
    expect(response.status).toBe(200);
  });

  it('adds credential login when resetting a user who has no password account', async () => {
    const { users, connection, router } = await setup();
    await connection.query
      .insertInto('user')
      .values({
        id: 'sso-user',
        name: 'SSO User',
        username: 'sso-user',
        email: 'sso@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    await users.resetPassword('sso-user', 'replacement-password');
    const response = await router.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'sso@example.com',
        password: 'replacement-password',
      }),
    });
    expect(response.status).toBe(200);
  });

  it('soft deletes another user and removes login records', async () => {
    const { users, signUp, connection, disconnectUser } = await setup();
    await signUp();
    const user = await connection.query
      .selectFrom('user')
      .select('id')
      .where('email', '=', 'alice@example.com')
      .executeTakeFirstOrThrow();
    const id = String(user.id);
    await expect(users.remove(id, id)).rejects.toThrow(
      'You cannot delete your own account',
    );
    await users.remove(id, 'actor');
    expect(await users.get(id)).toBeUndefined();
    expect(
      await connection.query
        .selectFrom('user')
        .select(['deletedAt', 'deletedBy'])
        .where('id', '=', id)
        .executeTakeFirst(),
    ).toMatchObject({
      deletedAt: expect.any(String),
      deletedBy: 'actor',
    });
    expect(
      await connection.query
        .selectFrom('account')
        .select('id')
        .where('userId', '=', id)
        .execute(),
    ).toEqual([]);
    expect(disconnectUser).toHaveBeenCalledWith(id);
  });

  it.each([undefined, { underscored: false }] as const)(
    'searches literal text under naming %s',
    async (naming) => {
      const { users } = await setupList(naming);
      await expect(users.list({ search: '%' })).resolves.toMatchObject({
        total: 1,
        items: [{ id: 'percent' }],
      });
      const underscore = await users.list({ search: 'a_c' });
      expect(underscore.items.map(({ id }) => id)).toEqual(['underscore']);
      expect(
        (await users.list({ search: 'alice' })).items.map(({ id }) => id),
      ).toEqual(['inactive', 'plain']);
      await expect(users.list({ status: 'disabled' })).resolves.toMatchObject({
        total: 1,
        items: [{ id: 'inactive' }],
      });
    },
  );

  it('keeps pages stable when users have the same creation time', async () => {
    const { users } = await setupList();
    const first = await users.list({ pageSize: 3 });
    const second = await users.list({ page: 2, pageSize: 3 });
    expect(first.total).toBe(5);
    expect([
      ...first.items.map(({ id }) => id),
      ...second.items.map(({ id }) => id),
    ]).toEqual(['inactive', 'literal', 'percent', 'plain', 'underscore']);
  });

  it('combines status and ID filters and hides soft-deleted users', async () => {
    const { users } = await setupList();
    expect((await users.list({ status: 'enabled' })).total).toBe(4);
    expect(
      (
        await users.list({ userIds: ['plain', 'inactive', 'absent'] })
      ).items.map(({ id }) => id),
    ).toEqual(['inactive', 'plain']);
    await expect(
      users.list({ userIds: ['plain', 'inactive'], status: 'enabled' }),
    ).resolves.toMatchObject({ total: 1, items: [{ id: 'plain' }] });
    await expect(
      users.list({ userIds: ['plain', 'percent'], search: 'alice' }),
    ).resolves.toMatchObject({ total: 1, items: [{ id: 'plain' }] });
    await expect(users.list({ userIds: [] })).resolves.toMatchObject({
      total: 0,
      items: [],
    });
    await users.remove('plain', 'operator');
    expect((await users.list()).total).toBe(4);
    await expect(users.list({ search: 'alice' })).resolves.toMatchObject({
      total: 1,
      items: [{ id: 'inactive' }],
    });
    await expect(users.list({ userIds: ['plain'] })).resolves.toMatchObject({
      total: 0,
      items: [],
    });
  });
});
