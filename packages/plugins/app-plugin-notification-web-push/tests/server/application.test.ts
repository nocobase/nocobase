import { createECDH, randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';
import { webPushServiceToken } from '../../server/tokens.js';
import type { AfterSubscribe } from '../../server/service.js';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { createDeviceRoutes } from '../../server/routes/devices.js';
import {
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
  generateApiDocument,
} from '@nocobase/app-server/router';

const transport = vi.hoisted(() => ({ requests: [] as string[] }));
vi.mock('node:https', () => ({
  request: (
    url: URL,
    _options: unknown,
    callback: (response: object) => void,
  ) => {
    const req = new EventEmitter() as EventEmitter & { end: () => void };
    req.end = () => {
      transport.requests.push(url.href);
      callback({ statusCode: 201, destroy() {} });
    };
    return req;
  },
}));
const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    push: { privateKey: 'b'.repeat(64), contact: 'mailto:test@example.com' },
  },
});

async function account(testApp: Parameters<typeof signIn>[0], name: string) {
  const credentials = {
    email: `${name}@example.com`,
    password: 'web-push-test-password',
  };
  expect(
    (
      await testApp.request('/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ ...credentials, name }),
      })
    ).status,
  ).toBe(200);
  return signIn(testApp, credentials);
}
function subscription(endpoint: string) {
  const pair = createECDH('prime256v1');
  pair.generateKeys();
  return {
    name: 'Browser',
    locale: 'de-DE-u-co-phonebk',
    subscription: {
      endpoint: `https://fcm.googleapis.com/fcm/send/${endpoint}`,
      keys: {
        p256dh: pair.getPublicKey().toString('base64url'),
        auth: randomBytes(16).toString('base64url'),
      },
    },
  };
}

test('rejects unknown JSON fields and returns current device state with strict HTTP statuses', async ({
  testApp,
}) => {
  const browser = await account(testApp, 'contracts');
  const input = subscription('contracts');
  const send = (method: string, path: string, body?: object) =>
    browser.fetch(`/webPush${path}`, {
      method,
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  for (const body of [
    { ...input, unexpected: true },
    { ...input, subscription: { ...input.subscription, unexpected: true } },
    {
      ...input,
      subscription: {
        ...input.subscription,
        keys: { ...input.subscription.keys, unexpected: true },
      },
    },
  ])
    expect((await send('POST', '/subscriptions', body)).status).toBe(400);
  const saved = await send('POST', '/subscriptions', input);
  expect(saved.status).toBe(200);
  const device = (await saved.json()).data;
  expect(device).toMatchObject({ locale: 'de-DE-u-co-phonebk', enabled: true });
  expect(
    (
      await send('PATCH', `/subscriptions/${device.id}`, {
        enabled: false,
        unexpected: true,
      })
    ).status,
  ).toBe(400);
  const patched = await send('PATCH', `/subscriptions/${device.id}`, {
    enabled: false,
  });
  expect(patched.status).toBe(200);
  expect((await patched.json()).data).toMatchObject({
    ...device,
    enabled: false,
    updatedAt: expect.any(String),
  });
  const repeated = await send('POST', '/subscriptions', input);
  expect((await repeated.json()).data).toMatchObject({
    id: device.id,
    enabled: false,
  });
  expect((await send('POST', `/subscriptions/${device.id}/test`)).status).toBe(
    503,
  );
  const deleted = await send('DELETE', `/subscriptions/${device.id}`);
  expect(deleted.status).toBe(204);
  expect(await deleted.text()).toBe('');
  expect((await send('DELETE', `/subscriptions/${device.id}`)).status).toBe(
    404,
  );
  expect(
    (await send('PATCH', `/subscriptions/${device.id}`, { enabled: true }))
      .status,
  ).toBe(404);
});

test('retains a saved device when subscription initialization fails and reuses its identity on retry', async ({
  app,
  testApp,
}) => {
  const browser = await account(testApp, 'initialization');
  const service = app.container.resolve(webPushServiceToken);
  const initialized = vi.fn<AfterSubscribe>(async () => {
    if (initialized.mock.calls.length === 1)
      throw new Error('Initialization failed.');
  });
  const stop = service.afterSubscribe('failure-retry', initialized);
  try {
    const body = subscription('initialization');
    const post = () =>
      browser.fetch('/webPush/subscriptions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify(body),
      });
    expect((await post()).status).toBe(500);
    const original = (
      await (await browser.fetch('/webPush/subscriptions')).json()
    ).data;
    expect(original).toHaveLength(1);
    const retry = await post();
    expect(retry.status).toBe(200);
    expect((await retry.json()).data.id).toBe(original[0].id);
    expect(
      (await (await browser.fetch('/webPush/subscriptions')).json()).data,
    ).toHaveLength(1);
    expect(initialized).toHaveBeenCalledTimes(2);
    expect(initialized.mock.calls[0]![1].id).toBe(
      initialized.mock.calls[1]![1].id,
    );
  } finally {
    stop();
  }
});

test('validates messages through the notification channel before queue submission', async ({
  app,
}) => {
  const notifications = app.container.resolve(notificationServiceToken);
  const service = app.container.resolve(webPushServiceToken);
  const validate = vi.spyOn(service, 'validateMessage');
  try {
    for (const message of [
      { body: '中'.repeat(1400), url: '/' },
      { body: '', url: 'https://evil.test/' },
    ]) {
      await expect(
        notifications.send({
          idempotencyKey: `invalid-${validate.mock.calls.length}`,
          messages: {
            webPush: {
              to: [{ id: 'device', userId: 'owner' }],
              title: 'Notice',
              dedupeKey: 'notice',
              ...message,
            },
          },
        }),
      ).rejects.toThrow();
    }
    expect(validate).toHaveBeenCalledTimes(2);
  } finally {
    validate.mockRestore();
  }
});

test('documents only actual responses with a shared device schema and list total', async ({
  app,
}) => {
  const router = await createDeviceRoutes().createRouter(app);
  expect(findUndeclaredApiRoutes(router)).toEqual([]);
  const doc = await generateApiDocument(router, {
    info: { title: 'Web Push', version: 'test' },
  });
  expect(findApiDocumentSchemaProblems(doc)).toEqual([]);
  expect(doc.components?.schemas).toHaveProperty('WebPushDevice');
  const paths = doc.paths!;
  for (const [path, method, statuses] of [
    ['/api/webPush/subscriptions', 'get', ['200', '401', '500']],
    [
      '/api/webPush/subscriptions',
      'post',
      ['200', '400', '401', '403', '500', '503'],
    ],
    [
      '/api/webPush/subscriptions/{id}',
      'patch',
      ['200', '400', '401', '404', '500'],
    ],
    [
      '/api/webPush/subscriptions/{id}/test',
      'post',
      ['202', '400', '401', '404', '429', '500', '503'],
    ],
  ] as const)
    expect(Object.keys(paths[path]![method]!.responses!)).toEqual(statuses);
  expect(Object.keys(paths['/api/webPush/key']!.get!.responses!)).toEqual([
    '200',
    '401',
    '500',
  ]);
  expect(
    Object.keys(paths['/api/webPush/subscriptions/{id}']!.delete!.responses!),
  ).toEqual(['204', '400', '401', '404', '500']);
  expect(
    paths['/api/webPush/subscriptions/{id}/test']!.post!.responses,
  ).toHaveProperty('202');
  expect(
    paths['/api/webPush/subscriptions/{id}']!.patch!.responses!['200'],
  ).toMatchObject({
    content: {
      'application/json': {
        schema: {
          properties: { data: { $ref: '#/components/schemas/WebPushDevice' } },
        },
      },
    },
  });
  expect(
    paths['/api/webPush/subscriptions']!.get!.responses!['200'],
  ).toMatchObject({
    content: {
      'application/json': {
        schema: { properties: { meta: { required: ['total'] } } },
      },
    },
  });
});

test('subscribes, manages and queues an encrypted test push in a standalone application', async ({
  testApp,
  app,
  expectCollection,
}) => {
  const subscribed = vi.fn<AfterSubscribe>(async () => undefined);
  const service = app.container.resolve(webPushServiceToken);
  const stop = service.afterSubscribe('application-baseline', subscribed);
  expect(() =>
    service.afterSubscribe('application-baseline', subscribed),
  ).toThrow();
  await expectCollection('webPushSubscriptions').toHaveField(
    'subscriptionSealed',
  );
  for (const [method, path] of [
    ['GET', '/key'],
    ['GET', '/subscriptions'],
    ['POST', '/subscriptions'],
    ['PATCH', '/subscriptions/device'],
    ['DELETE', '/subscriptions/device'],
    ['POST', '/subscriptions/device/test'],
  ])
    expect((await testApp.request(`/webPush${path}`, { method })).status).toBe(
      401,
    );
  const credentials = {
    email: 'browser@example.com',
    password: 'web-push-test-password',
  };
  expect(
    (
      await testApp.request('/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ ...credentials, name: 'Browser' }),
      })
    ).status,
  ).toBe(200);
  const browser = await signIn(testApp, credentials);
  const key = await (await browser.fetch('/webPush/key')).json();
  expect(key.data.publicKey).toHaveLength(87);
  const pair = createECDH('prime256v1');
  pair.generateKeys();
  const endpoint = 'https://fcm.googleapis.com/fcm/send/standalone';
  const result = await browser.fetch('/webPush/subscriptions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({
      name: 'Test browser',
      locale: 'fr-FR',
      subscription: {
        endpoint,
        keys: {
          p256dh: pair.getPublicKey().toString('base64url'),
          auth: randomBytes(16).toString('base64url'),
        },
      },
    }),
  });
  expect(result.status).toBe(200);
  const device = (await result.json()).data;
  expect(subscribed).toHaveBeenCalledExactlyOnceWith(
    expect.any(String),
    device,
  );
  expect(JSON.stringify(device)).not.toContain(endpoint);
  const list = await (await browser.fetch('/webPush/subscriptions')).json();
  expect(list.data).toHaveLength(1);
  expect(list.meta).toEqual({ total: 1 });
  const otherCredentials = {
    email: 'other-browser@example.com',
    password: 'web-push-other-test-password',
  };
  expect(
    (
      await testApp.request('/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ ...otherCredentials, name: 'Other browser' }),
      })
    ).status,
  ).toBe(200);
  const other = await signIn(testApp, otherCredentials);
  expect(
    (
      await other.fetch('/webPush/subscriptions', {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Other browser',
          locale: 'es-ES',
          subscription: {
            endpoint,
            keys: {
              p256dh: pair.getPublicKey().toString('base64url'),
              auth: randomBytes(16).toString('base64url'),
            },
          },
        }),
      })
    ).status,
  ).toBe(403);
  expect(
    (await (await other.fetch('/webPush/subscriptions')).json()).data,
  ).toEqual([]);
  expect(
    (
      await other.fetch(`/webPush/subscriptions/${device.id}/test`, {
        method: 'POST',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(404);
  expect(
    (
      await other.fetch(`/webPush/subscriptions/${device.id}`, {
        method: 'PATCH',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ enabled: false }),
      })
    ).status,
  ).toBe(404);
  expect(
    (
      await other.fetch(`/webPush/subscriptions/${device.id}`, {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(404);
  expect(
    (await (await browser.fetch('/webPush/subscriptions')).json()).data,
  ).toHaveLength(1);
  // Reidentification preserves device identity and invokes the same application initialization.
  const subscription = {
    endpoint,
    keys: {
      p256dh: pair.getPublicKey().toString('base64url'),
      auth: randomBytes(16).toString('base64url'),
    },
  };
  const ownerId = subscribed.mock.calls[0]![0];
  expect(
    (
      await service.subscribe(ownerId, {
        name: 'Test browser',
        locale: 'fr-FR',
        subscription,
      })
    ).id,
  ).toBe(device.id);
  expect(subscribed).toHaveBeenCalledTimes(2);
  stop();
  const saved = await service.subscribe(ownerId, {
    name: 'Test browser',
    locale: 'fr-FR',
    subscription: {
      endpoint,
      keys: {
        p256dh: pair.getPublicKey().toString('base64url'),
        auth: randomBytes(16).toString('base64url'),
      },
    },
  });
  expect(saved.id).toBe(device.id);
  expect(subscribed).toHaveBeenCalledTimes(2);
  const post = () =>
    browser.fetch(`/webPush/subscriptions/${device.id}/test`, {
      method: 'POST',
      headers: { origin: 'http://localhost' },
    });
  expect((await post()).status).toBe(202);
  await vi.waitFor(() => expect(transport.requests).toContain(endpoint));
  expect((await post()).status).toBe(429);
  expect(
    (
      await browser.fetch(`/webPush/subscriptions/${device.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify({ enabled: false }),
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await browser.fetch(`/webPush/subscriptions/${device.id}`, {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(204);
  const empty = await (await browser.fetch('/webPush/subscriptions')).json();
  expect(empty).toEqual({ data: [], meta: { total: 0 } });
});
