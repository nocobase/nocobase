// @vitest-environment node
import { fileURLToPath } from 'node:url';

import { bearer, deviceAuthorization } from 'better-auth/plugins';
import { afterEach, describe, expect, it } from 'vitest';

import { createSessionSecurityFragment } from '../../api-docs.js';
import { resolveDeviceVerificationUri } from '../../providers/authentication.js';
import { createAuthFixture } from './support.js';

const ORIGIN = 'http://localhost';
const CLIENT_ID = 'test-cli';
const deviceCodeMigrations = [
  {
    packageName: 'device-code-test',
    directory: fileURLToPath(
      new URL('./fixtures/device-code-migrations', import.meta.url),
    ),
  },
];

interface DeviceCodeAnswer {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

describe('Device authorization with bearer sessions', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  async function setup() {
    const fixture = await createAuthFixture(
      {
        plugins: [
          deviceAuthorization({
            verificationUri: '/device',
            validateClient: (clientId) => clientId === CLIENT_ID,
          }),
          bearer(),
        ],
      },
      undefined,
      deviceCodeMigrations,
    );
    fixtures.push(fixture);
    const { response, cookie } = await fixture.signUp();
    const { user } = (await response.json()) as { user: { id: string } };
    const json = (body: unknown, headers: Record<string, string> = {}) => ({
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const browser = { cookie, origin: ORIGIN };
    const start = async (): Promise<DeviceCodeAnswer> => {
      const answer = await fixture.router.request(
        '/api/auth/device/code',
        json({ client_id: CLIENT_ID }),
      );
      expect(answer.status).toBe(200);
      return (await answer.json()) as DeviceCodeAnswer;
    };
    const poll = async (deviceCode: string) => {
      // The CLI waits `interval` between polls; the test clears the last poll instead of waiting.
      await fixture.connection.query
        .updateTable('deviceCode')
        .set({ lastPolledAt: null })
        .where('deviceCode', '=', deviceCode)
        .execute();
      const answer = await fixture.router.request(
        '/api/auth/device/token',
        json({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode,
          client_id: CLIENT_ID,
        }),
      );
      return {
        status: answer.status,
        body: (await answer.json()) as Record<string, unknown>,
      };
    };
    const review = (userCode: string) =>
      fixture.router.request(
        `/api/auth/device?user_code=${encodeURIComponent(userCode)}`,
        { headers: browser },
      );
    const decide = (decision: 'approve' | 'deny', userCode: string) =>
      fixture.router.request(
        `/api/auth/device/${decision}`,
        json({ userCode }, browser),
      );
    const whoami = (token: string) =>
      fixture.router.request('/private', {
        headers: { authorization: `Bearer ${token}` },
      });
    return {
      fixture,
      userId: user.id,
      json,
      start,
      poll,
      review,
      decide,
      whoami,
    };
  }

  it('issues a session token once approved, which authenticates as Bearer until signed out', async () => {
    const { fixture, userId, json, start, poll, review, decide, whoami } =
      await setup();
    const started = await start();
    expect(started.verification_uri).toBe(`${ORIGIN}/device`);
    expect(started.verification_uri_complete).toBe(
      `${ORIGIN}/device?user_code=${started.user_code}`,
    );

    expect((await poll(started.device_code)).body).toMatchObject({
      error: 'authorization_pending',
    });

    const reviewed = await review(started.user_code);
    expect(await reviewed.json()).toMatchObject({
      status: 'pending',
      client_id: CLIENT_ID,
    });
    expect((await decide('approve', started.user_code)).status).toBe(200);

    const issued = await poll(started.device_code);
    expect(issued).toMatchObject({
      status: 200,
      body: { token_type: 'Bearer' },
    });
    const token = issued.body.access_token as string;
    // The code is redeemed once.
    expect((await poll(started.device_code)).body).toMatchObject({
      error: 'invalid_grant',
    });

    const signedIn = await whoami(token);
    expect(signedIn.status).toBe(200);
    expect(
      ((await signedIn.json()) as { auth: { user: { id: string } } }).auth.user
        .id,
    ).toBe(userId);

    // A disabled user's token stops working, like a cookie.
    await fixture.connection.query
      .updateTable('user')
      .set({ disabledAt: new Date() })
      .where('id', '=', userId)
      .execute();
    expect((await whoami(token)).status).toBe(401);
    await fixture.connection.query
      .updateTable('user')
      .set({ disabledAt: null })
      .where('id', '=', userId)
      .execute();
    expect((await whoami(token)).status).toBe(200);

    // `logout`: signing out with the token deletes its session.
    const signedOut = await fixture.router.request(
      '/api/auth/sign-out',
      json({}, { authorization: `Bearer ${token}` }),
    );
    expect(signedOut.status).toBe(200);
    expect((await whoami(token)).status).toBe(401);
  });

  it('answers access_denied once the person declines, and refuses an unknown client', async () => {
    const { json, fixture, start, poll, review, decide } = await setup();
    const started = await start();
    await review(started.user_code);
    expect((await decide('deny', started.user_code)).status).toBe(200);
    expect((await poll(started.device_code)).body).toMatchObject({
      error: 'access_denied',
    });

    const refused = await fixture.router.request(
      '/api/auth/device/code',
      json({ client_id: 'someone-else' }),
    );
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({ error: 'invalid_client' });
  });

  it('answers slow_down to a CLI polling faster than its interval', async () => {
    const { fixture, start } = await setup();
    const started = await start();
    const body = JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: started.device_code,
      client_id: CLIENT_ID,
    });
    const tokenRequest = () =>
      fixture.router.request('/api/auth/device/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      });
    await tokenRequest();
    expect(await (await tokenRequest()).json()).toMatchObject({
      error: 'slow_down',
    });
  });

  it('documents the bearer token beside the session cookie', async () => {
    const { fixture } = await setup();
    const fragment = await createSessionSecurityFragment(fixture.auth);
    expect(fragment.components?.securitySchemes?.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
    expect(fragment.security).toEqual([{ cookieAuth: [] }, { bearerAuth: [] }]);
  });
});

describe('resolveDeviceVerificationUri()', () => {
  const uriOf = (plugin: unknown): unknown =>
    Reflect.get(
      Reflect.get(plugin as object, 'options') as object,
      'verificationUri',
    );

  it('places an app-local approval page below the public base path', () => {
    const [resolved] = resolveDeviceVerificationUri(
      [deviceAuthorization({ verificationUri: '/device' })],
      '/main',
    );
    expect(uriOf(resolved)).toBe('/main/device');
    const [defaulted] = resolveDeviceVerificationUri(
      [deviceAuthorization()],
      '/main/',
    );
    expect(uriOf(defaulted)).toBe('/main/device');
  });

  it('leaves an absolute URL, a root application and other plugins alone', () => {
    const absolute = deviceAuthorization({
      verificationUri: 'https://example.com/device',
    });
    const other = bearer();
    expect(resolveDeviceVerificationUri([absolute, other], '/main')).toEqual([
      absolute,
      other,
    ]);
    const root = deviceAuthorization({ verificationUri: '/device' });
    expect(resolveDeviceVerificationUri([root], '/')).toEqual([root]);
  });
});
