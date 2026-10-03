// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import { signIn, type SignInTarget } from '../../testing.js';
import { createAuthFixture } from './support.js';

describe('signIn() for other packages’ tests', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  async function setup(): Promise<{
    target: SignInTarget;
    fixture: Awaited<ReturnType<typeof createAuthFixture>>;
  }> {
    const fixture = await createAuthFixture();
    fixtures.push(fixture);
    // The fixture serves its routes at the root, as an application with an empty public base path does.
    return {
      fixture,
      target: {
        fetch: (request) => fixture.router.fetch(request),
        publicBasePath: '',
      },
    };
  }

  it('signs in by email or username and acts as the signed-in user', async () => {
    const { fixture, target } = await setup();
    await fixture.signUp({
      email: 'alice@example.com',
      username: 'Alice.Admin',
      password: 'correct horse battery staple',
    });

    const byEmail = await signIn(target, {
      email: 'alice@example.com',
      password: 'correct horse battery staple',
    });
    expect(byEmail.user).toMatchObject({ email: 'alice@example.com' });
    expect(byEmail.cookie).not.toBe('');
    const privateResponse = await byEmail.fetch('http://localhost/private');
    expect(privateResponse.status).toBe(200);
    await expect(privateResponse.json()).resolves.toMatchObject({
      auth: { user: { id: byEmail.user.id } },
    });

    const byUsername = await signIn(target, {
      username: 'Alice.Admin',
      password: 'correct horse battery staple',
    });
    expect(byUsername.user.id).toBe(byEmail.user.id);
  });

  it('reports a refused sign-in with the route’s answer', async () => {
    const { fixture, target } = await setup();
    await fixture.signUp({ email: 'bob@example.com', username: 'bob' });
    await expect(
      signIn(target, { email: 'bob@example.com', password: 'wrong password' }),
    ).rejects.toThrow(/Sign-in as "bob@example.com" failed with 401/);
  });
});
