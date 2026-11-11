import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import { identityProviderServiceToken } from '@nocobase/app-plugin-identity-provider/server';
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
const json = (
  body: unknown,
  method = 'POST',
  key = `${Date.now()}.${randomUUID()}`,
) => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'https://platform.example',
    'idempotency-key': key,
  },
  body: JSON.stringify(body),
});
test('external registry, link-only memberships, confidential OIDC clients, directory and revocation', async ({
  app,
  testApp,
  request,
  connection,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await request('/multiApp/externalApps')).status).toBe(401);
  expect((await request('/multiApp/externalApps', json({}))).status).toBe(401);
  const auth = app.container.resolve(authenticationToken);
  const user = await (
    await auth.administrationContext()
  ).internalAdapter.createUser({
    name: 'Ordinary user',
    email: 'ordinary@example.test',
    emailVerified: true,
  });
  const issued = await auth.signInUser(
    user.id,
    new Request('https://platform.example/main/api/auth/get-session'),
  );
  const cookie = issued.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  expect(
    (await request('/multiApp/externalApps', { headers: { cookie } })).status,
  ).toBe(403);
  expect(
    (
      await request('/multiApp/externalApps', {
        ...json({}),
        headers: { ...json({}).headers, cookie },
      })
    ).status,
  ).toBe(403);
  const input = {
    name: 'External documentation',
    url: 'https://docs.example/guide?language=en',
    kind: 'web',
    authMode: 'link',
  };
  const options = json(input);
  const created = await admin.fetch('/multiApp/externalApps', options);
  expect(created.status).toBe(200);
  const link = (await created.json()).data;
  const replay = await admin.fetch('/multiApp/externalApps', options);
  expect((await replay.json()).data.id).toBe(link.id);
  expect(await connection.repository('mamInstances').count()).toBe(0);
  expect(await connection.repository('mamTemplates').count()).toBe(0);
  expect(await connection.repository('oauthClient').count()).toBe(0);
  expect((await admin.fetch('/multiApp/myApps')).status).toBe(200);
  expect((await (await admin.fetch('/multiApp/myApps')).json()).data).toEqual(
    [],
  );
  const identity = app.container.resolve(identityProviderServiceToken);
  expect(
    (
      await admin.fetch(
        `/identity/management/apps/${link.id}/members/${admin.user.id}`,
        json({ role: 'reader' }, 'PUT'),
      )
    ).status,
  ).toBe(200);
  const directory = (await (await admin.fetch('/multiApp/myApps')).json()).data;
  expect(directory).toMatchObject([
    { id: link.id, entryUrl: input.url, kind: 'web', authMode: 'link' },
  ]);
  expect(
    (
      await admin.fetch(
        `/multiApp/externalApps/${link.id}/configureIdentity`,
        json({}),
      )
    ).ok,
  ).toBe(false);
  for (const url of [
    'javascript:alert(1)',
    'https://user:pass@example.com/',
    'https://example.com/#callback',
  ]) {
    expect(
      (await admin.fetch('/multiApp/externalApps', json({ ...input, url })))
        .status,
    ).toBe(400);
  }
  expect(
    (
      await admin.fetch(
        '/multiApp/externalApps',
        json({ ...input, authMode: 'platform' }),
      )
    ).status,
  ).toBe(400);
  const native = (
    await (
      await admin.fetch(
        '/multiApp/externalApps',
        json({
          name: 'Independent NocoBase',
          url: 'https://independent.example/lab',
          kind: 'nocobase',
          authMode: 'platform',
        }),
      )
    ).json()
  ).data;
  expect(
    (
      await request(
        `/multiApp/externalApps/${native.id}/configureIdentity`,
        json({}),
      )
    ).status,
  ).toBe(401);
  expect(
    (
      await request(`/multiApp/externalApps/${native.id}/configureIdentity`, {
        ...json({}),
        headers: { ...json({}).headers, cookie },
      })
    ).status,
  ).toBe(403);
  const configResponse = await admin.fetch(
    `/multiApp/externalApps/${native.id}/configureIdentity`,
    json({}),
  );
  expect(configResponse.status).toBe(200);
  expect(configResponse.headers.get('cache-control')).toBe('no-store');
  const configuration = (await configResponse.json()).data;
  expect(configuration.callbackUrl).toMatch(
    /^https:\/\/independent.example\/lab\/api\/auth\/callback\/platform-/u,
  );
  const repeated = (
    await (
      await admin.fetch(
        `/multiApp/externalApps/${native.id}/configureIdentity`,
        json({}),
      )
    ).json()
  ).data;
  expect(repeated.variables).toEqual(configuration.variables);
  const basic =
    'Basic ' +
    Buffer.from(
      configuration.variables.PLATFORM_SSO_CLIENT_ID +
        ':' +
        configuration.variables.PLATFORM_SSO_CLIENT_SECRET,
    ).toString('base64');
  const getDirectory = () =>
    request('/identity/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basic },
      body: JSON.stringify({ subject: admin.user.id }),
    });
  expect((await getDirectory()).status).toBe(403);
  await identity.setMember(native.id, admin.user.id, 'reader');
  expect((await getDirectory()).status).toBe(200);
  expect((await (await getDirectory()).json()).data).toHaveLength(2);
  const disabled = await admin.fetch(
    `/multiApp/externalApps/${native.id}`,
    json({ expectedRevision: 1, status: 'disabled' }, 'PUT'),
  );
  expect(disabled.status).toBe(200);
  expect((await getDirectory()).status).toBe(403);
  expect(await identity.access(native.id, admin.user.id)).toBeNull();
  expect(
    (await (await admin.fetch('/multiApp/myApps')).json()).data,
  ).toHaveLength(1);
  expect(
    (
      await admin.fetch(
        `/multiApp/externalApps/${native.id}`,
        json({ expectedRevision: 1, status: 'enabled' }, 'PUT'),
      )
    ).status,
  ).toBe(409);
  const externalOidc = (
    await (
      await admin.fetch(
        '/multiApp/externalApps',
        json({
          name: 'OIDC client',
          url: 'https://web.example/',
          kind: 'web',
          authMode: 'platform',
          callbackUrl: 'https://web.example/auth/callback',
        }),
      )
    ).json()
  ).data;
  const oidc = (
    await (
      await admin.fetch(
        `/multiApp/externalApps/${externalOidc.id}/configureIdentity`,
        json({}),
      )
    ).json()
  ).data;
  await identity.setMember(externalOidc.id, admin.user.id, 'reader');
  const verifier = randomBytes(32).toString('base64url');
  const authorize = await admin.fetch(
    '/auth/oauth2/authorize?' +
      new URLSearchParams({
        client_id: oidc.variables.PLATFORM_SSO_CLIENT_ID,
        redirect_uri: oidc.callbackUrl,
        response_type: 'code',
        scope: 'openid profile email',
        state: 'test-state',
        nonce: 'test-nonce',
        code_challenge: createHash('sha256')
          .update(verifier)
          .digest('base64url'),
        code_challenge_method: 'S256',
      }),
  );
  expect(authorize.status).toBe(302);
  const location = new URL(authorize.headers.get('location')!);
  expect(location.origin + location.pathname).toBe(oidc.callbackUrl);
  const token = await request('/auth/oauth2/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization:
        'Basic ' +
        Buffer.from(
          oidc.variables.PLATFORM_SSO_CLIENT_ID +
            ':' +
            oidc.variables.PLATFORM_SSO_CLIENT_SECRET,
        ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: location.searchParams.get('code')!,
      redirect_uri: oidc.callbackUrl,
      code_verifier: verifier,
    }).toString(),
  });
  expect(token.status).toBe(200);
  expect((await token.json()).id_token).toBeTruthy();
  await identity.setMember(link.id, admin.user.id, null);
  expect(
    (await (await admin.fetch('/multiApp/myApps')).json()).data.map(
      (row: { id: string }) => row.id,
    ),
  ).not.toContain(link.id);
  expect(await connection.repository('mamInstances').count()).toBe(0);
  const spec = await (await admin.fetch('/swagger')).json();
  expect(spec.paths['/api/multiApp/externalApps']).toBeTruthy();
  expect(spec.paths['/api/identity/applications']).toBeTruthy();
});
