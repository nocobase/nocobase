// @vitest-environment node
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    hub: { host: { enabled: false } },
  },
});

describe('offline Mail example in the examples application', () => {
  test('requires a signed-in user for Mail', async ({ request }) => {
    expect((await request('/mail/accounts')).status).toBe(401);
  });

  test('configures all three demo providers and connects a mailbox through the real API', async ({
    testApp,
  }) => {
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const response = await session.fetch('/mail/providers');
    expect(response.status).toBe(200);
    const providers = (await response.json()) as {
      data: { name: string; type: string }[];
    };
    expect(providers.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'demo', type: 'mail-example' }),
        expect.objectContaining({
          name: 'demo-microsoft',
          type: 'mail-example-microsoft',
        }),
        expect.objectContaining({
          name: 'demo-imap-smtp',
          type: 'mail-example-imap-smtp',
        }),
      ]),
    );
    const connected = await session.fetch('/mail/accounts/connect', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({
        type: 'mail-example',
        name: 'demo',
        address: 'sam@example.test',
        username: 'demo-user',
        password: 'demo-only',
        initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
      }),
    });
    expect(connected.status).toBe(201);
    expect(await connected.json()).toMatchObject({
      data: {
        address: 'sam@example.test',
        provider: { type: 'mail-example', name: 'demo' },
      },
    });
    const accounts = await session.fetch('/mail/accounts');
    expect(accounts.status).toBe(200);
    expect(await accounts.json()).toMatchObject({
      data: [expect.objectContaining({ address: 'sam@example.test' })],
    });
  });
});
