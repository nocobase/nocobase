// @vitest-environment node
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { genericOAuth } from 'better-auth/plugins';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ssoCallbackUrl, ssoConfig } from '../../../client/pages/sso-config.js';
import { createAuthFixture } from './support.js';

const PROVIDER = 'local-oidc';
const AUTH_BASE = 'http://localhost/api/auth';

/**
 * A minimal OpenID provider on a local port: discovery, a token endpoint that answers only for the `redirect_uri` the
 * authorization request carried, and user info. Enough to run Better Auth's whole sign-in through the callback URL
 * the single sign-on guide tells the administrator to register.
 */
function startProvider(): Promise<{
  server: Server;
  issuer: string;
  tokenRequests: URLSearchParams[];
}> {
  const tokenRequests: URLSearchParams[] = [];
  const server = createServer((request, response) => {
    const issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const url = new URL(request.url ?? '/', issuer);
    const json = (status: number, body: unknown) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    if (url.pathname === '/.well-known/openid-configuration')
      return json(200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
      });
    if (url.pathname === '/token') {
      let body = '';
      request.on('data', (chunk: Buffer) => (body += chunk.toString()));
      request.on('end', () => {
        const form = new URLSearchParams(body);
        tokenRequests.push(form);
        if (
          form.get('code') !== 'local-code' ||
          form.get('redirect_uri') !== ssoCallbackUrl(AUTH_BASE, PROVIDER)
        )
          return json(400, { error: 'invalid_grant' });
        json(200, {
          access_token: 'local-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        });
      });
      return;
    }
    if (url.pathname === '/userinfo')
      return json(200, {
        sub: 'subject-42',
        email: 'oidc-user@example.com',
        email_verified: true,
        name: 'OIDC User',
      });
    json(404, { error: 'not_found' });
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () =>
      resolve({
        server,
        issuer: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        tokenRequests,
      }),
    ),
  );
}

describe('the callback URL the single sign-on guide generates', () => {
  let provider: Awaited<ReturnType<typeof startProvider>>;
  let fixture: Awaited<ReturnType<typeof createAuthFixture>>;

  beforeAll(async () => {
    provider = await startProvider();
    fixture = await createAuthFixture({
      plugins: [
        genericOAuth({
          config: [
            {
              providerId: PROVIDER,
              discoveryUrl: `${provider.issuer}/.well-known/openid-configuration`,
              clientId: 'local-client',
              clientSecret: 'local-secret',
            },
          ],
        }),
      ],
    });
  }, 60_000);

  afterAll(async () => {
    await fixture?.dispose();
    await new Promise((resolve) => provider?.server.close(resolve));
  });

  it('is the redirect_uri of the authorization request, and Better Auth completes a sign-in on it', async () => {
    expect(
      ssoConfig({ type: 'sso', id: PROVIDER, signUp: 'create' }),
    ).toContain(`providerId: '${PROVIDER}'`);
    const start = await fixture.router.request('/api/auth/sign-in/social', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({ provider: PROVIDER, callbackURL: '/' }),
    });
    expect(start.status).toBe(200);
    const authorization = new URL(
      ((await start.json()) as { url: string }).url,
    );
    expect(authorization.origin + authorization.pathname).toBe(
      `${provider.issuer}/authorize`,
    );
    const redirectUri = authorization.searchParams.get('redirect_uri');
    expect(redirectUri).toBe(ssoCallbackUrl(AUTH_BASE, PROVIDER));

    // The provider sends the browser back to that URL with a code.
    const cookies = start.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
    const callback = new URL(redirectUri!);
    callback.searchParams.set('code', 'local-code');
    callback.searchParams.set(
      'state',
      authorization.searchParams.get('state')!,
    );
    const done = await fixture.router.request(
      callback.pathname + callback.search,
      { headers: { cookie: cookies } },
    );
    expect(done.status).toBe(302);
    expect(done.headers.get('location')).toBe('/');
    expect(provider.tokenRequests.at(-1)?.get('redirect_uri')).toBe(
      redirectUri,
    );
    const account = await fixture.connection.query
      .selectFrom('account')
      .select(['providerId', 'accountId'])
      .where('providerId', '=', PROVIDER)
      .executeTakeFirst();
    expect(account).toEqual({ providerId: PROVIDER, accountId: 'subject-42' });
  });

  it('is also where linkSocial sends a signed-in person linking the provider', async () => {
    const { cookie } = await fixture.signUp({
      email: 'linker@example.com',
      username: 'linker',
    });
    const link = await fixture.router.request('/api/auth/link-social', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
        cookie: cookie.split(';')[0]!,
      },
      body: JSON.stringify({ provider: PROVIDER, callbackURL: '/' }),
    });
    expect(link.status).toBe(200);
    const authorization = new URL(((await link.json()) as { url: string }).url);
    expect(authorization.searchParams.get('redirect_uri')).toBe(
      ssoCallbackUrl(AUTH_BASE, PROVIDER),
    );
  });
});
