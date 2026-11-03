// @vitest-environment node

import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import { afterEach, describe, expect, it } from 'vitest';

import type { SessionSubstitution } from '../../auth.js';
import { createUserAdministrationService } from '../../user-administration.js';
import { createAuthFixture } from './support.js';

const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) await fixture.dispose();
});

async function setUp() {
  const fixture = await createAuthFixture();
  fixtures.push(fixture);
  fixture.router.onError(apiErrorHandler);
  const actor = await fixture.signUp({
    email: 'actor@example.com',
    username: 'actor',
  });
  const target = await fixture.signUp({
    email: 'target@example.com',
    username: 'target',
  });
  const { user: actorUser } = (await actor.response.clone().json()) as {
    user: { id: string };
  };
  const { user: targetUser } = (await target.response.clone().json()) as {
    user: { id: string };
  };
  const cookie = actor.cookie.split(';')[0]!;
  const asTarget: SessionSubstitution = (session) =>
    Promise.resolve(
      session.user.id === actorUser.id
        ? {
            id: 'substitute:1',
            userId: targetUser.id,
            expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          }
        : undefined,
    );
  return { fixture, cookie, actorUser, targetUser, asTarget };
}

const read = (
  fixture: Awaited<ReturnType<typeof createAuthFixture>>,
  path: string,
  cookie: string,
) => fixture.router.request(path, { headers: { cookie } });

describe('session substitution', () => {
  it('acts as the substitute on routes and in /get-session, as an ordinary session', async () => {
    const { fixture, cookie, targetUser, asTarget } = await setUp();
    fixture.auth.addSessionSubstitution(asTarget);

    const route = await read(fixture, '/private', cookie);
    expect(route.status).toBe(200);
    const { auth } = (await route.json()) as {
      auth: {
        user: { id: string };
        session: { id: string; token: string; userId: string };
        credential?: unknown;
      };
    };
    expect(auth.user.id).toBe(targetUser.id);
    expect(auth.session).toMatchObject({
      id: 'substitute:1',
      token: 'substitute:1',
      userId: targetUser.id,
    });
    expect(auth.credential).toBeUndefined();
    expect(
      await fixture.auth.isScopedSession(
        auth as never,
        new Request('http://localhost/private'),
      ),
    ).toBe(false);

    const answered = await read(fixture, '/api/auth/get-session', cookie);
    expect(answered.status).toBe(200);
    const session = (await answered.json()) as {
      user: { id: string; email: string };
      session: { id: string; expiresAt: string };
    };
    expect(session.user).toMatchObject({
      id: targetUser.id,
      email: 'target@example.com',
    });
    expect(session.session).toMatchObject({
      id: 'substitute:1',
      expiresAt: '2099-01-01T00:00:00.000Z',
    });
  });

  it('leaves the session its own user on other Better Auth endpoints', async () => {
    const { fixture, cookie, actorUser, targetUser, asTarget } = await setUp();
    fixture.auth.addSessionSubstitution(asTarget);

    const response = await fixture.router.request('/api/auth/update-user', {
      method: 'POST',
      headers: {
        cookie,
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({ name: 'Renamed' }),
    });
    expect(response.status).toBe(200);

    const names = await fixture.connection.query
      .selectFrom('user')
      .select(['id', 'name'])
      .where('id', 'in', [actorUser.id, targetUser.id])
      .execute();
    expect(Object.fromEntries(names.map((row) => [row.id, row.name]))).toEqual({
      [actorUser.id]: 'Renamed',
      [targetUser.id]: 'Alice',
    });
  });

  it('signs nobody in when the substitute is disabled', async () => {
    const { fixture, cookie, targetUser, asTarget } = await setUp();
    fixture.auth.addSessionSubstitution(asTarget);
    await createUserAdministrationService({
      auth: fixture.auth,
      connection: fixture.connection,
    }).disable(targetUser.id);

    expect((await read(fixture, '/private', cookie)).status).toBe(401);
  });

  it('refuses the request when the substitution does, except for /get-session', async () => {
    const { fixture, cookie, actorUser } = await setUp();
    fixture.auth.addSessionSubstitution(() => {
      throw new ApiError({
        status: 'ABORTED',
        reason: 'SUBSTITUTE_ENDED',
        domain: 'test',
        message: 'Ended.',
      });
    });

    const refused = await read(fixture, '/private', cookie);
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'SUBSTITUTE_ENDED' },
    });

    const session = await read(fixture, '/api/auth/get-session', cookie);
    expect(session.status).toBe(200);
    expect(await session.json()).toMatchObject({
      user: { id: actorUser.id },
    });
  });

  it('returns to the session itself once the substitution is removed', async () => {
    const { fixture, cookie, actorUser, asTarget } = await setUp();
    const remove = fixture.auth.addSessionSubstitution(asTarget);
    remove();

    const response = await read(fixture, '/private', cookie);
    expect(await response.json()).toMatchObject({
      auth: { user: { id: actorUser.id } },
    });
  });
});
