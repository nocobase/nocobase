import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import {
  demoEffectsGuard,
  isDemoMode,
  type DemoEffectsGuardOptions,
} from '../../server/index.js';
import { demoModeServiceToken } from '../../server/tokens.js';

function container(enabled?: boolean): ServiceContainer {
  const services = new ServiceContainer();
  if (enabled !== undefined)
    services.instance(demoModeServiceToken, { enabled, allowCollections: [] });
  return services;
}

describe('isDemoMode', () => {
  it.each([undefined, false, true])(
    'checks a container with mode %s',
    (enabled) => {
      expect(isDemoMode(container(enabled))).toBe(enabled === true);
    },
  );

  it('does not hide a registered service failing to initialize', () => {
    const services = new ServiceContainer();
    services.singleton(demoModeServiceToken, () => {
      throw new Error('configuration failed');
    });
    expect(() => isDemoMode(services)).toThrow('configuration failed');
  });
});

async function guardedRouter(
  options: DemoEffectsGuardOptions,
  enabled: boolean | undefined = true,
) {
  const router = new Hono();
  let effects = 0;
  router.use('*', async (context, next) => {
    context.header('Server-Timing', 'upstream');
    await next();
  });
  await demoEffectsGuard(options).register(router, {
    container: container(enabled),
  });
  router.all('*', async (context) => {
    // Body parsing and external work must only happen after the guard.
    if (context.req.method === 'POST') await context.req.json();
    effects++;
    return context.json({ ok: true });
  });
  return { router, effects: () => effects };
}

describe('demoEffectsGuard', () => {
  it.each(['%0A', '%0D', '%E2%80%A8', '%E2%80%A9'])(
    'guards a routed parameter containing the encoded line terminator %s',
    async (encoded) => {
      const router = new Hono();
      let effects = 0;
      await demoEffectsGuard({ paths: ['/api/outbound/*'] }).register(router, {
        container: container(true),
      });
      router.post('/api/outbound/:id/send', (context) => {
        effects++;
        return context.json({ sent: true });
      });

      const response = await router.request(`/api/outbound/${encoded}/send`, {
        method: 'POST',
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { reason: 'DEMO_READ_ONLY' },
      });
      expect(effects).toBe(0);
    },
  );

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'refuses %s before parsing the body or running business effects',
    async (method) => {
      const app = await guardedRouter({ paths: ['/api/effects/*'] });
      const response = await app.router.request('/api/effects/send', {
        method,
        body: 'invalid JSON',
        headers: { 'x-request-id': 'demo-effects-test' },
      });
      expect(response.status).toBe(400);
      expect(response.headers.get('Server-Timing')).toBe(
        'upstream, demo-read-only',
      );
      expect(response.headers.get('x-request-id')).toBe('demo-effects-test');
      expect(await response.json()).toEqual({
        error: {
          code: 400,
          status: 'FAILED_PRECONDITION',
          reason: 'DEMO_READ_ONLY',
          domain: 'demoMode',
          message: 'This is a demo. Changes cannot be saved.',
          requestId: 'demo-effects-test',
        },
      });
      expect(app.effects()).toBe(0);
    },
  );

  it.each(['GET', 'HEAD', 'OPTIONS'])('passes %s', async (method) => {
    const app = await guardedRouter({ paths: ['/*'] });
    expect((await app.router.request('/api/effects', { method })).status).toBe(
      200,
    );
    expect(app.effects()).toBe(1);
  });

  it.each([false, undefined])('passes when mode is %s', async (enabled) => {
    // Pass the absent container explicitly: undefined is also the default argument above.
    const router = new Hono();
    await demoEffectsGuard({ paths: ['/*'] }).register(router, {
      container: container(enabled),
    });
    router.post('/send', (context) => context.json({ sent: true }));
    const response = await router.request('/send', { method: 'POST' });
    expect(response.status).toBe(200);
    expect(response.headers.get('Server-Timing')).toBeNull();
  });

  it.each([
    ['/api/effects', true],
    ['/api/effects/', true],
    ['/api/effects/run/again?dry=false', true],
    ['/api/effectsOther/run', false],
    ['/api/other/effects', false],
    ['/api/upload', true],
    ['/api/upload/', true],
    ['/api/upload/subpath', false],
    ['/api/files/123/send', true],
    ['/api/files/123/send/again', false],
    ['/api/v1.0/run', true],
    ['/api/v1x0/run', false],
  ])('scopes %s (blocked: %s)', async (path, blocked) => {
    const app = await guardedRouter({
      paths: [
        '/api/effects/*',
        '/api/upload',
        '/api/files/:id/send',
        '/api/v1.0/run',
      ],
    });
    const response = await app.router.request(path, {
      method: 'POST',
      body: '{}',
    });
    expect(response.status).toBe(blocked ? 400 : 200);
    expect(app.effects()).toBe(blocked ? 0 : 1);
  });

  it('allows only the configured method and path, including parameterized exceptions', async () => {
    const app = await guardedRouter({
      paths: ['/api/*'],
      allow: [
        { method: 'post', path: '/api/query/:id' },
        { method: 'POST', path: '/api/demoMode/data/reset' },
      ],
    });
    for (const [method, path, expected] of [
      ['POST', '/api/query/123', 200],
      ['DELETE', '/api/query/123', 400],
      ['POST', '/api/query/123/send', 400],
      ['POST', '/api/demoMode/data/reset', 200],
      ['POST', '/api/demoMode/data/clear', 400],
    ] as const) {
      const response = await app.router.request(path, { method, body: '{}' });
      expect(response.status).toBe(expected);
    }
    expect(app.effects()).toBe(2);
  });

  it.each([
    'api/effects',
    '/api/**',
    '/api/*/send',
    '/api/x?y=1',
    '/api//send',
    '/api/:',
  ])('rejects invalid patterns: %s', (path) => {
    expect(() => demoEffectsGuard({ paths: [path] })).toThrow(
      'Invalid demo effects guard path',
    );
  });
});
