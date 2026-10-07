// @vitest-environment node

import { ApiError, describeRoute } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import type { AuthEnv, CredentialResolver } from '../../auth.js';
import { createAuthFixture } from './support.js';

const RUN_HEADER = 'x-test-run';
const runSecurity = [{ cookieAuth: [] }, { runToken: [] }];

describe('Issued credentials', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  async function setup() {
    const fixture = await createAuthFixture();
    fixtures.push(fixture);
    const { response } = await fixture.signUp();
    const { user } = (await response.json()) as { user: { id: string } };
    const resolver: CredentialResolver = (headers) => {
      const token = headers.get(RUN_HEADER);
      if (!token) return Promise.resolve(undefined);
      if (token !== 'good')
        throw new ApiError({
          status: 'UNAUTHENTICATED',
          reason: 'RUN_TOKEN_INVALID',
          domain: 'agents',
          message: 'No such run.',
        });
      return Promise.resolve({
        type: 'run',
        id: 'r1',
        userId: user.id,
        scheme: 'runToken',
        data: { agentId: 'a1' },
      });
    };
    const remove = fixture.auth.addCredentialResolver(resolver);
    const router = new Hono<AuthEnv>();
    router.get(
      '/runs-welcome',
      describeRoute({ security: runSecurity }),
      fixture.auth.required({ scopedKeys: true }),
      (context) => {
        const auth = context.get('auth');
        return context.json({
          userId: auth?.user.id,
          credential: auth?.credential,
        });
      },
    );
    router.get(
      '/no-scheme',
      describeRoute({ security: [{ cookieAuth: [] }] }),
      fixture.auth.required({ scopedKeys: true }),
      (context) => context.json({ ok: true }),
    );
    router.get(
      '/person-only',
      describeRoute({ security: runSecurity }),
      fixture.auth.required(),
      (context) => context.json({ ok: true }),
    );
    router.onError((error, context) =>
      error instanceof ApiError
        ? context.json({ reason: error.reason }, 401)
        : context.json({ error: String(error) }, 500),
    );
    return { router, userId: user.id, remove };
  }

  it('acts for its user where the route lists its scheme and accepts scoped credentials', async () => {
    const { router, userId } = await setup();
    const response = await router.request('/runs-welcome', {
      headers: { [RUN_HEADER]: 'good' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      userId,
      credential: { type: 'run', id: 'r1', scheme: 'runToken' },
    });
  });

  it('is refused by a route that does not list its scheme, and by one that takes no scoped credentials', async () => {
    const { router } = await setup();
    const headers = { [RUN_HEADER]: 'good' };
    const unlisted = await router.request('/no-scheme', { headers });
    expect(unlisted.status).toBe(403);
    expect(await unlisted.json()).toMatchObject({
      error: { reason: 'CREDENTIAL_NOT_ACCEPTED' },
    });
    const personal = await router.request('/person-only', { headers });
    expect(personal.status).toBe(403);
  });

  it('answers what the resolver throws for a credential that is not valid', async () => {
    const { router } = await setup();
    const response = await router.request('/runs-welcome', {
      headers: { [RUN_HEADER]: 'stale' },
    });
    expect(await response.json()).toEqual({ reason: 'RUN_TOKEN_INVALID' });
  });

  it('stops recognizing the credential once its resolver is removed', async () => {
    const { router, remove } = await setup();
    remove();
    const response = await router.request('/runs-welcome', {
      headers: { [RUN_HEADER]: 'good' },
    });
    expect(response.status).toBe(401);
  });
});
