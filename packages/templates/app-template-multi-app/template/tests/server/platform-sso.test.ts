import { identityApplicationAccessToken } from '@nocobase/app-plugin-identity-provider/server/tokens';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  identityProviderServiceToken,
  providerId,
} from '@nocobase/app-plugin-identity-provider/server';
import { createStandaloneServer } from '../../server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'https://platform.example' },
    auth: { trustedOrigins: ['https://platform.example'] },
    secrets: {
      keys: [{ version: 1, key: randomBytes(32).toString('base64') }],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    releases: { host: { enabled: false } },
  },
});
const json = (body: unknown, method = 'POST') => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'https://platform.example',
    'idempotency-key': `${Date.now()}.${randomUUID()}`,
  },
  body: JSON.stringify(body),
});
test('OIDC: isolated client registration, explicit membership, PKCE, replay protection and revocation', async ({
  app,
  testApp,
  request,
  connection,
}) => {
  vi.spyOn(
    app.container.resolve(identityApplicationAccessToken),
    'allowed',
  ).mockResolvedValue(true);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS),
    identity = app.container.resolve(identityProviderServiceToken);
  const client = await identity.ensureClient(
    'sso-lab',
    'SSO laboratory',
    'https://platform.example/sso-lab',
    admin.user.id,
  );
  expect(
    await identity.ensureClient(
      'sso-lab',
      'SSO laboratory',
      'https://platform.example/sso-lab',
      admin.user.id,
    ),
  ).toEqual(client);
  expect(await connection.repository('oauthClient').count()).toBe(1);
  const moved = await identity.ensureClient(
    'sso-lab',
    'Renamed laboratory',
    'https://platform.example/renamed-lab',
    admin.user.id,
  );
  expect(moved).toEqual(client);
  const registered = await connection
    .repository('platformClients')
    .findOne({ filter: { id: 'sso-lab' } });
  expect(registered?.publicUrl).toBe('https://platform.example/renamed-lab');
  const nativeClient = await connection
    .repository('oauthClient')
    .findOne({ filter: { clientId: client.clientId } });
  expect(JSON.stringify(nativeClient?.redirectUris)).toContain(
    '/renamed-lab/api/auth/callback/',
  );
  await identity.ensureClient(
    'sso-lab',
    'SSO laboratory',
    'https://platform.example/sso-lab',
    admin.user.id,
  );

  expect(await identity.access('sso-lab', admin.user.id)).toBeNull();
  expect(
    (await request(`/identity/management/apps/sso-lab/members`)).status,
  ).toBe(401);
  expect(
    (
      await admin.fetch(
        '/identity/management/apps/sso-lab/members/' + admin.user.id,
        json({ role: 'reader' }, 'PUT'),
      )
    ).status,
  ).toBe(200);
  const basic = `Basic ${Buffer.from(client.clientId + ':' + client.clientSecret).toString('base64')}`;
  const access = () =>
    request('/identity/access', {
      ...json({ subject: admin.user.id }),
      headers: { 'content-type': 'application/json', authorization: basic },
    });
  expect((await access()).status).toBe(200);
  const discovery = await request('/auth/.well-known/openid-configuration');
  expect(discovery.status).toBe(200);
  const metadata = (await discovery.json()) as {
    issuer: string;
    jwks_uri: string;
  };
  expect(metadata.issuer).toBe(identity.issuer);
  const verifier = randomBytes(32).toString('base64url'),
    redirect = `https://platform.example/sso-lab/api/auth/callback/${providerId(identity.issuer)}`;
  const query = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'openid profile email',
    state: 'browser-bound-state',
    nonce: 'nonce-123',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  });
  const guestAuthorize = await request('/auth/oauth2/authorize?' + query);
  expect(guestAuthorize.status).toBe(302);
  const loginUrl = new URL(
    guestAuthorize.headers.get('location')!,
    identity.issuer,
  );
  expect(loginUrl.pathname).toContain('/identity/login');
  const resumed = await admin.fetch(
    '/auth/oauth2/continue',
    json({ postLogin: true, oauth_query: loginUrl.search.slice(1) }),
  );
  expect(resumed.status).toBe(200);
  const resumedBody = (await resumed.json()) as { url: string };
  expect(new URL(resumedBody.url).searchParams.get('code')).toBeTruthy();
  const authorize = await admin.fetch('/auth/oauth2/authorize?' + query);
  expect(authorize.status).toBe(302);
  const location = new URL(authorize.headers.get('location')!);
  expect(location.searchParams.get('state')).toBe('browser-bound-state');
  expect(location.searchParams.get('code')).toBeTruthy();
  const exchange = (codeVerifier = verifier) =>
    request('/auth/oauth2/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: basic,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: location.searchParams.get('code')!,
        redirect_uri: redirect,
        code_verifier: codeVerifier,
      }).toString(),
    });
  const response = await exchange();
  expect(response.status).toBe(200);
  const tokens = (await response.json()) as {
    id_token: string;
    access_token: string;
  };
  expect(tokens.id_token).toBeTruthy();
  const info = await request('/auth/oauth2/userinfo', {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  expect(info.status).toBe(200);
  expect(await info.json()).toMatchObject({
    sub: admin.user.id,
    platform_app_id: 'sso-lab',
    platform_role: 'reader',
  });
  expect((await exchange()).status).toBe(400);
  const invalid = await admin.fetch(
    '/auth/oauth2/authorize?' +
      new URLSearchParams({
        ...Object.fromEntries(query),
        redirect_uri: 'https://untrusted.invalid/callback',
      }),
  );
  expect(invalid.headers.get('location') ?? '').not.toContain(
    'untrusted.invalid',
  );
  expect(invalid.headers.get('location') ?? '').not.toContain('code=');
  await identity.setMember('sso-lab', admin.user.id, null);
  expect((await access()).status).toBe(403);
  const userinfoAfter = await request('/auth/oauth2/userinfo', {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  expect(userinfoAfter.status).toBe(401);
  expect(
    (
      await request('/identity/access', {
        ...json({ subject: admin.user.id }),
        headers: {
          'content-type': 'application/json',
          authorization:
            'Basic ' +
            Buffer.from(client.clientId + ':wrong').toString('base64'),
        },
      })
    ).status,
  ).toBe(401);
});

test('native OIDC registration rejects insecure remote HTTP callback origins', async ({
  app,
  testApp,
}) => {
  const identity = app.container.resolve(identityProviderServiceToken);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  for (const origin of [
    'http://192.168.5.10:13230',
    'http://203.0.113.10:13230',
  ]) {
    await expect(
      identity.ensureClient(
        'insecure-lab',
        'Laboratory',
        origin + '/insecure-lab',
        admin.user.id,
      ),
    ).rejects.toThrow();
  }
});

test('re-enrollment retains an existing child provider binding after a platform address migration', async ({
  app,
  testApp,
  connection,
}) => {
  const identity = app.container.resolve(identityProviderServiceToken);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const previousId = providerId('https://previous.example/main/api/auth');
  const first = await identity.ensureClient(
    'issuer-move',
    'Moved platform',
    'https://platform.example/issuer-move',
    admin.user.id,
    `https://platform.example/issuer-move/api/auth/callback/${previousId}`,
  );
  const moved = await identity.ensureClient(
    'issuer-move',
    'Moved platform',
    'https://platform.example/renamed-instance',
    admin.user.id,
  );
  expect(moved.clientId).toBe(first.clientId);
  expect(moved.clientSecret).toBe(first.clientSecret);
  const registered = await connection
    .repository('platformClients')
    .findOne({ filter: { id: 'issuer-move' } });
  expect(registered?.redirectUri).toBe(
    `https://platform.example/renamed-instance/api/auth/callback/${previousId}`,
  );
});
