import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const common = {
  createServer: createStandaloneServer,
  scope: 'test' as const,
  config: {
    app: { publicOrigin: 'http://localhost' },
    spa: {
      indexPath: fileURLToPath(new URL('../../index.html', import.meta.url)),
    },
    auth: {
      secret: 'notification-template-test-secret-at-least-32-characters',
    },
  },
};
describe('bare Default', () => {
  const test = createAppTest(common);
  test('keeps the bare Default navigation disabled without an invitation transport', async ({
    app,
  }) => {
    expect(
      app.config.get('client.notificationTemplates.invitationConfigured'),
    ).toBe(false);
  });
});
describe('configured Default', () => {
  const test = createAppTest({
    ...common,
    config: {
      ...common.config,
      mailers: {
        default: 'system',
        system: {
          provider: 'smtp',
          host: '127.0.0.1',
          port: 9,
          auth: { user: 'synthetic', pass: 'synthetic-private-password' },
        },
      },
    },
  });

  test('boots the real Default invitation directory and protects all three endpoints', async ({
    testApp,
    app,
    request,
  }) => {
    expect(
      app.config.get('client.notificationTemplates.invitationConfigured'),
    ).toBe(true);
    const page = await testApp.fetch(
      new Request(`http://localhost${testApp.publicBasePath}/`),
    );
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('"invitationConfigured":true');
    expect(html).not.toContain('synthetic-private-password');
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    expect((await request('/notifications/templates')).status).toBe(401);
    const list = await admin.fetch('/notifications/templates');
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(JSON.stringify(body)).not.toContain('synthetic-private-password');
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'users.invitation',
          localeMode: 'combined',
          channels: [
            expect.objectContaining({
              name: 'system',
              type: 'email',
              configured: true,
              enabled: true,
            }),
          ],
        }),
      ]),
    );
    const detail = await admin.fetch(
      '/notifications/templates/users.invitation',
    );
    expect(detail.status).toBe(200);
    const logsBefore = await (await admin.fetch('/notifications/logs')).json();
    const preview = await admin.fetch(
      '/notifications/templates/users.invitation/preview',
      {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ locale: 'en-US' }),
      },
    );
    expect(preview.status).toBe(200);
    expect(JSON.stringify(await preview.json())).toContain('example.invalid');
    expect(await (await admin.fetch('/notifications/logs')).json()).toEqual(
      logsBefore,
    );
    const member = {
      username: 'templateviewer',
      email: 'templateviewer@example.invalid',
      password: 'Synthetic-template-viewer-943!',
    };
    const created = await admin.fetch('/users', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
        'Idempotency-Key': `${Date.now()}.${randomUUID()}`,
      },
      body: JSON.stringify({
        ...member,
        name: 'Synthetic restricted viewer',
        roleScopes: {},
      }),
    });
    expect(created.status).toBe(201);
    const restricted = await signIn(testApp, member);
    for (const endpoint of [
      '',
      '/users.invitation',
      '/users.invitation/preview',
    ]) {
      const response = await restricted.fetch(
        `/notifications/templates${endpoint}`,
        endpoint.endsWith('/preview')
          ? {
              method: 'POST',
              headers: {
                origin: 'http://localhost',
                'content-type': 'application/json',
              },
              body: JSON.stringify({ locale: 'en-US' }),
            }
          : undefined,
      );
      expect(response.status).toBe(403);
    }
  });
});
