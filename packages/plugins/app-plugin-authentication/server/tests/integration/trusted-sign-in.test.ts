// @vitest-environment node

import { afterEach, expect, it, vi } from 'vitest';
import { createUserAdministrationService } from '../../user-administration.js';
import { createAuthFixture } from './support.js';

const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) await fixture.dispose();
});

it('issues an ordinary session with configured cookies and hooks without changing credentials', async () => {
  const before = vi.fn(async () => undefined);
  const fixture = await createAuthFixture({
    baseURL: 'https://example.com/main/api/auth',
    advanced: {
      cookiePrefix: 'demo-site',
      defaultCookieAttributes: { path: '/main' },
      useSecureCookies: true,
    },
    databaseHooks: { session: { create: { before } } },
  });
  fixtures.push(fixture);
  const users = createUserAdministrationService({
    auth: fixture.auth,
    connection: fixture.connection,
  });
  const user = await users.create({
    name: 'Admin',
    username: 'owner',
    email: 'owner@example.com',
    password: 'unchanged-password',
  });
  const credential = () =>
    fixture.connection.query
      .selectFrom('account')
      .select('password')
      .where('userId', '=', user.id)
      .executeTakeFirst();
  const original = await credential();
  const response = await fixture.auth.signInUser(
    user.id,
    new Request('https://example.com/main/api/demoMode/accounts/owner/signIn', {
      method: 'POST',
    }),
  );
  expect(response.status).toBe(200);
  const cookies = response.headers.getSetCookie();
  expect(cookies.join('; ')).toContain('__Secure-demo-site.session_token');
  expect(cookies.join('; ')).toContain('Path=/main');
  const cookie = cookies.map((value) => value.split(';')[0]).join('; ');
  expect(
    (await fixture.auth.getSession(new Headers({ cookie })))?.user.id,
  ).toBe(user.id);
  expect(before).toHaveBeenCalled();
  expect(await credential()).toEqual(original);
});

it('refuses disabled people and service accounts through the normal session hooks', async () => {
  const fixture = await createAuthFixture();
  fixtures.push(fixture);
  const users = createUserAdministrationService({
    auth: fixture.auth,
    connection: fixture.connection,
  });
  const person = await users.create({
    name: 'Person',
    email: 'person@example.com',
    password: 'person-password',
  });
  await users.disable(person.id);
  const robot = await users.createServiceAccount({ name: 'Robot' });
  for (const user of [person, robot]) {
    const response = await fixture.auth.signInUser(
      user.id,
      new Request('http://localhost/api/demoMode/accounts/example/signIn', {
        method: 'POST',
      }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toEqual([]);
  }
});

it('keeps trusted sign-in callable only from the server', async () => {
  const fixture = await createAuthFixture();
  fixtures.push(fixture);
  for (const path of ['signInUser', 'sign-in-user']) {
    const response = await fixture.router.request(`/api/auth/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'anything' }),
    });
    expect(response.status).toBe(404);
  }
});
