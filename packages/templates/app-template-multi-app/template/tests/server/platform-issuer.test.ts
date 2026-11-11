import { createHash, randomBytes } from 'node:crypto';
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
import { identityApplicationAccessToken } from '@nocobase/app-plugin-identity-provider/server/tokens';
import { createStandaloneServer } from '../../server/standalone.js';
const origin = 'https://platform.example';
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: origin },
    auth: { trustedOrigins: [origin] },
    secrets: {
      keys: [{ version: 1, key: randomBytes(32).toString('base64') }],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    releases: { host: { enabled: false } },
  },
});

test('the HTTPS discovery issuer matches the signed ID-token issuer and every endpoint', async ({
  app,
  testApp,
  request,
}) => {
  const identity = app.container.resolve(identityProviderServiceToken);
  vi.spyOn(
    app.container.resolve(identityApplicationAccessToken),
    'allowed',
  ).mockResolvedValue(true);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const client = await identity.ensureClient(
    'lan-issuer',
    'LAN issuer',
    origin + '/lan-issuer',
    admin.user.id,
  );
  await identity.setMember('lan-issuer', admin.user.id, 'reader');
  const discovery = await (
    await request('/auth/.well-known/openid-configuration')
  ).json();
  expect(discovery.issuer).toBe(identity.issuer);
  for (const field of [
    'authorization_endpoint',
    'token_endpoint',
    'userinfo_endpoint',
    'jwks_uri',
  ])
    expect(new URL(discovery[field]).origin).toBe(origin);
  const verifier = randomBytes(32).toString('base64url');
  const redirect = `${origin}/lan-issuer/api/auth/callback/${providerId(identity.issuer)}`;
  const query = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'openid profile email',
    state: 'lan-state',
    nonce: 'lan-nonce',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  });
  const response = await admin.fetch('/auth/oauth2/authorize?' + query);
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location')!);
  expect(location.origin).toBe(origin);
  const exchange = await request('/auth/oauth2/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(client.clientId + ':' + client.clientSecret).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: location.searchParams.get('code')!,
      redirect_uri: redirect,
      code_verifier: verifier,
    }).toString(),
  });
  expect(exchange.status).toBe(200);
  const tokens = await exchange.json();
  const claims = JSON.parse(
    Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString(),
  );
  expect(claims).toMatchObject({
    iss: discovery.issuer,
    aud: client.clientId,
    sub: admin.user.id,
    nonce: 'lan-nonce',
  });
});
