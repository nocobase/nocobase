import { createECDH, randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';
import { webPushServiceToken } from '../../server/tokens.js';
import type { AfterSubscribe } from '../../server/service.js';

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

test('subscribes, manages and queues an encrypted test push in an application without Studio', async ({
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
  expect((await testApp.request('/webPush/key')).status).toBe(401);
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
  const endpoint = 'https://fcm.googleapis.com/fcm/send/non-studio';
  const result = await browser.fetch('/webPush/subscriptions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({
      name: 'Test browser',
      locale: 'en-US',
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
  ).toBe(200);
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
        locale: 'en-US',
        subscription,
      })
    ).id,
  ).toBe(device.id);
  expect(subscribed).toHaveBeenCalledTimes(2);
  stop();
  const saved = await service.subscribe(ownerId, {
    name: 'Test browser',
    locale: 'en-US',
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
  expect((await post()).status).toBe(200);
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
  ).toBe(200);
  expect(
    (await (await browser.fetch('/webPush/subscriptions')).json()).data,
  ).toEqual([]);
});
