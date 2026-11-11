import { expect, vi, afterEach } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    platformSso: { enabled: true, providerId: 'platform-test' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
  },
});
afterEach(() => vi.restoreAllMocks());
test('browser entry uses native OAuth, forwards state cookies and scopes return URLs', async ({
  app,
  testApp,
}) => {
  const auth = app.container.resolve(authenticationToken);
  const handler = vi.spyOn(auth, 'handler').mockImplementation(async () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.append(
      'set-cookie',
      'state=fixture; Path=/main; HttpOnly; SameSite=Lax',
    );
    headers.append(
      'set-cookie',
      'verifier=fixture; Path=/main; HttpOnly; SameSite=Lax',
    );
    return new Response(
      JSON.stringify({ url: 'https://platform.test/authorize?state=fixture' }),
      { headers },
    );
  });
  const response = await testApp.fetch(
    new Request(
      'http://localhost/main/login?redirect=%2Frecords%3Fsearch%3Dlab',
    ),
  );
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    'https://platform.test/authorize?state=fixture',
  );
  expect(response.headers.getSetCookie()).toHaveLength(2);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(await handler.mock.calls[0]?.[0].json()).toMatchObject({
    provider: 'platform-test',
    callbackURL: 'http://localhost/main/records?search=lab',
    errorCallbackURL:
      'http://localhost/main/login?ssoError=1&redirect=%2Frecords%3Fsearch%3Dlab',
  });
  for (const target of [
    '//evil.test',
    '/../other',
    '/%2e%2e/other',
    '/\\evil.test',
    '/login',
    '/sso/start',
    '/%0d%0aLocation:evil',
  ]) {
    await testApp.fetch(
      new Request(
        'http://localhost/main/sso/start?redirect=' +
          encodeURIComponent(target),
      ),
    );
    expect(await handler.mock.calls.at(-1)?.[0].json()).toMatchObject({
      callbackURL: 'http://localhost/main/',
    });
  }
});
test('local, signed-out and error pages do not restart authentication; failures return once', async ({
  app,
  testApp,
}) => {
  const handler = vi
    .spyOn(app.container.resolve(authenticationToken), 'handler')
    .mockResolvedValue(new Response(null, { status: 503 }));
  for (const query of [
    'auth=local',
    'local=1',
    'signedOut=1',
    'ssoError=1',
    'error=access_denied',
  ]) {
    const result = await testApp.fetch(
      new Request('http://localhost/main/login?' + query),
    );
    expect(result.status).not.toBe(302);
  }
  expect(handler).not.toHaveBeenCalled();
  const response = await testApp.fetch(
    new Request('http://localhost/main/sso/start?redirect=%2Frecords'),
  );
  expect(response.status).toBe(302);
  const url = new URL(response.headers.get('location')!);
  expect(url.pathname).toBe('/main/login');
  expect(url.searchParams.get('error')).toBe('PLATFORM_UNAVAILABLE');
  await testApp.fetch(new Request(url));
  expect(handler).toHaveBeenCalledTimes(1);
});
test('an existing valid session enters the target without another OAuth round trip', async ({
  app,
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const handler = vi.spyOn(
    app.container.resolve(authenticationToken),
    'handler',
  );
  const response = await testApp.fetch(
    new Request('http://localhost/main/login?redirect=%2Frecords', {
      headers: { cookie: admin.cookie },
    }),
  );
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    'http://localhost/main/records',
  );
  expect(handler).not.toHaveBeenCalled();
});

test('a rejected existing platform session becomes a permission page instead of a redirect loop', async ({
  app,
  testApp,
}) => {
  const auth = app.container.resolve(authenticationToken);
  vi.spyOn(auth, 'getSession').mockRejectedValue(
    Object.assign(new Error('Denied'), { status: 403 }),
  );
  const response = await testApp.fetch(
    new Request('http://localhost/main/sso/start?redirect=%2Frecords'),
  );
  const target = new URL(response.headers.get('location')!);
  expect(target.pathname).toBe('/main/login');
  expect(target.searchParams.get('error')).toBe('APP_ACCESS_DENIED');
  expect(target.searchParams.get('redirect')).toBe('/records');
});

test('passes an app-local path through the real native authentication handler', async ({
  app,
  testApp,
}) => {
  const handler = vi.spyOn(
    app.container.resolve(authenticationToken),
    'handler',
  );
  const response = await testApp.fetch(
    new Request('http://localhost/main/login'),
  );
  expect(response.status).toBe(302);
  expect(new URL(handler.mock.calls[0]![0].url).pathname).toBe(
    '/api/auth/sign-in/social',
  );
  // This fixture has no OAuth provider. A native provider error proves the path reached Better Auth,
  // rather than an empty 404 caused by adding the application base path twice.
  const native = await handler.mock.results[0]!.value;
  expect(await native.json()).toMatchObject({ code: 'PROVIDER_NOT_FOUND' });
});
