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
          ![PROVIDER, 'custom']
            .map((id) => ssoCallbackUrl(AUTH_BASE, id))
            .includes(form.get('redirect_uri') ?? '')
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
    // A plain OAuth 2.0 provider that names its account id user_id, as many do.
    if (url.pathname === '/oauth/userinfo')
      return json(200, {
        user_id: 'u-77',
        email: 'oauth-user@example.com',
        name: 'OAuth User',
      });
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

describe('a social provider outside Better Auth’s built-in list', () => {
  it('cannot be a socialProviders key, so the guide sends it through genericOAuth(), which signs in on /callback/<id>', async () => {
    // Better Auth builds each social provider by calling its built-in factory under that key.
    const unknown = await createAuthFixture({
      socialProviders: {
        custom: { clientId: 'id', clientSecret: 'secret' },
      } as never,
    });
    try {
      await expect(unknown.auth.administrationContext()).rejects.toThrow(
        'socialProviders[key] is not a function',
      );
    } finally {
      await unknown.dispose();
    }

    expect(
      ssoConfig({ type: 'oauth', id: 'custom', signUp: 'create' }),
    ).toContain("authorizationUrl: 'https://<provider>/oauth/authorize'");
    const fixture = await createAuthFixture({
      plugins: [
        genericOAuth({
          config: [
            {
              providerId: 'custom',
              authorizationUrl: 'https://oauth.example.com/oauth/authorize',
              tokenUrl: 'https://oauth.example.com/oauth/token',
              userInfoUrl: 'https://oauth.example.com/oauth/userinfo',
              clientId: 'custom-client',
              clientSecret: 'custom-secret',
            },
          ],
        }),
      ],
    });
    try {
      const start = await fixture.router.request('/api/auth/sign-in/social', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ provider: 'custom', callbackURL: '/' }),
      });
      expect(start.status).toBe(200);
      const authorization = new URL(
        ((await start.json()) as { url: string }).url,
      );
      expect(authorization.origin + authorization.pathname).toBe(
        'https://oauth.example.com/oauth/authorize',
      );
      expect(authorization.searchParams.get('redirect_uri')).toBe(
        ssoCallbackUrl(AUTH_BASE, 'custom'),
      );
    } finally {
      await fixture.dispose();
    }
  });
});

describe('the account id of a provider outside Better Auth’s built-in list', () => {
  let provider: Awaited<ReturnType<typeof startProvider>>;
  beforeAll(async () => {
    provider = await startProvider();
  });
  afterAll(async () => {
    await new Promise((resolve) => provider?.server.close(resolve));
  });

  /** Runs a whole sign-in through `custom` and returns the account it stored, if any. */
  async function signInThrough(
    config: Partial<Parameters<typeof genericOAuth>[0]['config'][number]>,
  ) {
    const fixture = await createAuthFixture({
      plugins: [
        genericOAuth({
          config: [
            {
              providerId: 'custom',
              authorizationUrl: `${provider.issuer}/authorize`,
              tokenUrl: `${provider.issuer}/token`,
              userInfoUrl: `${provider.issuer}/oauth/userinfo`,
              clientId: 'custom-client',
              clientSecret: 'custom-secret',
              ...config,
            },
          ],
        }),
      ],
    });
    try {
      const start = await fixture.router.request('/api/auth/sign-in/social', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ provider: 'custom', callbackURL: '/' }),
      });
      const authorization = new URL(
        ((await start.json()) as { url: string }).url,
      );
      const callback = new URL(authorization.searchParams.get('redirect_uri')!);
      callback.searchParams.set('code', 'local-code');
      callback.searchParams.set(
        'state',
        authorization.searchParams.get('state')!,
      );
      const done = await fixture.router.request(
        callback.pathname + callback.search,
        {
          headers: {
            cookie: start.headers
              .getSetCookie()
              .map((cookie) => cookie.split(';')[0])
              .join('; '),
          },
        },
      );
      const account = await fixture.connection.query
        .selectFrom('account')
        .select(['accountId'])
        .where('providerId', '=', 'custom')
        .executeTakeFirst();
      return { location: done.headers.get('location'), account };
    } finally {
      await fixture.dispose();
    }
  }

  it('comes from accountSubject, as the guide says, when the provider names it user_id', async () => {
    const config = ssoConfig({ type: 'oauth', id: 'custom', signUp: 'create' });
    expect(config).toContain(
      'accountSubject: ({ profile }) => String(profile.user_id),',
    );
    expect(
      await signInThrough({
        accountSubject: ({ profile }) =>
          String((profile as { user_id?: unknown }).user_id),
        mapProfileToUser: (profile) => ({
          email: profile.email as string,
          name: profile.name as string,
        }),
      }),
    ).toEqual({ location: '/', account: { accountId: 'u-77' } });
  });

  it('is missing without accountSubject, even when mapProfileToUser returns an id', async () => {
    const result = await signInThrough({
      mapProfileToUser: (profile) => ({
        id: String((profile as { user_id?: unknown }).user_id),
        email: profile.email as string,
        name: profile.name as string,
      }),
    });
    expect(result.account).toBeUndefined();
    expect(result.location).not.toBe('/');
  });
});
