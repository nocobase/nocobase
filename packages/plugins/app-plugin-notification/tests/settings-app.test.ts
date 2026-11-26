// @vitest-environment node
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect, vi } from 'vitest';

import { notificationServiceToken } from '../server/tokens.js';
import { createStandaloneServer } from './fixtures/app/server/standalone.js';
import { fixtureSent } from './fixtures/app/server/runtime.js';

const test = createAppTest({ createServer: createStandaloneServer });

const json = (method: string, value: unknown): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(value),
});

async function account(testApp: Parameters<typeof signIn>[0], name: string) {
  const credentials = {
    email: `${name}@example.com`,
    password: 'notification-test-password',
  };
  expect(
    (
      await testApp.request(
        '/auth/sign-up/email',
        json('POST', { ...credentials, name }),
      )
    ).status,
  ).toBe(200);
  return signIn(testApp, credentials);
}

test('checks notification read and manage on settings routes, and preferences only need a session', async ({
  app,
  testApp,
  request,
}) => {
  expect((await request('/notifications/channels')).status).toBe(401);
  expect((await request('/notifications/preferences')).status).toBe(401);

  const person = await account(testApp, 'notify-admin');
  const authz = app.container.resolve(authorizationToken);
  const grant = async (key: string, actions: string[]) => {
    await authz.permissionSets.create({
      key,
      grants: [
        {
          resource: { type: 'settings', id: 'notification' },
          actions: actions.map((action) => ({ action })),
        },
      ],
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: person.user.id },
      permissionSet: key,
    });
  };
  const reads = [
    '/notifications/channels',
    '/notifications/kinds',
    '/notifications/kinds/fixture.assigned',
    '/notifications/deliveries',
    '/notifications/logs',
  ];
  const test = () =>
    person.fetch('/notifications/channels/fixture/test', json('POST', {}));

  for (const path of reads) {
    const denied = await person.fetch(path);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({
      error: { reason: 'AUTHORIZATION_DENIED' },
    });
  }
  expect((await test()).status).toBe(403);
  // Personal preferences need no grant.
  const preferences = await person.fetch('/notifications/preferences');
  expect(preferences.status).toBe(200);
  expect((await preferences.json()).data).toMatchObject({
    channelTypes: ['fixture-user'],
    kinds: [
      {
        id: 'fixture.assigned',
        channels: [
          {
            type: 'fixture-user',
            policy: 'on',
            adjustable: true,
            enabled: true,
          },
        ],
      },
    ],
  });

  await grant('notification-readers', ['read']);
  for (const path of reads)
    expect({ path, status: (await person.fetch(path)).status }).toEqual({
      path,
      status: 200,
    });
  const channels = await (await person.fetch('/notifications/channels')).json();
  expect(channels.data).toEqual([
    expect.objectContaining({
      name: 'fixture',
      type: 'fixture-user',
      contributor: '@nocobase/fixture-channel',
      summary: [{ label: 'Token', value: '••••' }],
      testable: true,
      reachesUsers: true,
    }),
  ]);
  expect(JSON.stringify(channels)).not.toContain('secret-token');
  expect(channels.meta.delivery.retry).toMatchObject({ maxAttempts: 1 });
  expect((await test()).status).toBe(403);
  expect(
    (
      await person.fetch(
        '/notifications/deliveries/missing/retry',
        json('POST', { reason: 'Fixed' }),
      )
    ).status,
  ).toBe(403);

  await grant('notification-managers', ['manage']);
  const tested = await test();
  expect(tested.status).toBe(200);
  await vi.waitFor(() =>
    expect(fixtureSent).toContainEqual({
      recipient: { userId: person.user.id },
      title: 'Test notification',
    }),
  );
  const testLog = await vi.waitFor(async () => {
    const page = await (
      await person.fetch(`/notifications/deliveries?q=${person.user.id}`)
    ).json();
    expect(page.data[0]?.delivery.status).toBe('accepted');
    return page;
  });
  expect(testLog.data).toEqual([
    expect.objectContaining({
      sourceType: 'notification.test',
      sourceReferenceId: 'fixture',
      delivery: expect.objectContaining({
        recipientKey: person.user.id,
        status: 'accepted',
      }),
    }),
  ]);
});

test('filters and pages the delivery log, and retries a failed delivery with its reason', async ({
  app,
  testApp,
}) => {
  const person = await account(testApp, 'notify-operator');
  const authz = app.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'notification-operators',
    grants: [
      {
        resource: { type: 'settings', id: 'notification' },
        actions: [{ action: 'read' }, { action: 'manage' }],
      },
    ],
  });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: person.user.id },
    permissionSet: 'notification-operators',
  });
  const notification = app.container.resolve(notificationServiceToken);
  for (let index = 0; index < 5; index += 1)
    await notification.notify('fixture.assigned', {
      to: [`user-${index}`],
      data: { title: index === 2 ? 'fail once' : `Task ${index}` },
      idempotencyKey: `fixture-${index}`,
    });

  await vi.waitFor(
    async () => {
      const page = await (
        await person.fetch('/notifications/deliveries?kind=fixture.assigned')
      ).json();
      expect(page.meta.statusCounts).toMatchObject({ accepted: 4, failed: 1 });
    },
    { timeout: 10_000 },
  );
  const seen: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await (
      await person.fetch(
        `/notifications/deliveries?kind=fixture.assigned&pageSize=2${pageToken ? `&pageToken=${pageToken}` : ''}`,
      )
    ).json();
    seen.push(
      ...page.data.map(
        (item: { delivery: { id: string } }) => item.delivery.id,
      ),
    );
    expect(page.meta.statusCounts).toMatchObject({ accepted: 4, failed: 1 });
    pageToken = page.meta.nextPageToken;
  } while (pageToken);
  expect(seen).toHaveLength(5);
  expect(new Set(seen).size).toBe(5);

  const failed = await (
    await person.fetch(
      '/notifications/deliveries?status=failed&channel=fixture',
    )
  ).json();
  expect(failed.data).toHaveLength(1);
  const deliveryId = failed.data[0].delivery.id as string;
  expect(failed.data[0]).toMatchObject({
    kind: 'fixture.assigned',
    delivery: { recipientKey: 'user-2' },
  });
  expect(
    (
      await person
        .fetch(
          `/notifications/deliveries?q=user-2&from=${encodeURIComponent('2000-01-01T00:00:00Z')}&to=${encodeURIComponent('2000-01-02T00:00:00Z')}`,
        )
        .then((response) => response.json())
    ).data,
  ).toEqual([]);

  const retry = (body: unknown) =>
    person.fetch(
      `/notifications/deliveries/${deliveryId}/retry`,
      json('POST', body),
    );
  expect((await retry({})).status).toBe(400);
  expect((await retry({ reason: '   ' })).status).toBe(400);
  const retried = await retry({ reason: 'Provider fixed' });
  expect(retried.status).toBe(200);
  const details = (await retried.json()).data;
  // The retry is a new attempt, run by the jobs like the first one.
  const settled = await vi.waitFor(async () => {
    const current = (
      await (
        await person.fetch(`/notifications/deliveries/${deliveryId}`)
      ).json()
    ).data;
    expect(current.attempts).toHaveLength(2);
    return current;
  });
  expect(settled.retryAudits).toHaveLength(1);
  expect(details.delivery.id).toBe(deliveryId);
  expect(details.retryAudits).toEqual([
    expect.objectContaining({
      resolution: expect.objectContaining({ reason: 'Provider fixed' }),
    }),
  ]);
  const accepted = await (
    await person.fetch('/notifications/deliveries?status=accepted&pageSize=1')
  ).json();
  expect(
    (
      await person.fetch(
        `/notifications/deliveries/${accepted.data[0].delivery.id as string}/retry`,
        json('POST', { reason: 'Again' }),
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await person.fetch(
        '/notifications/deliveries/missing/retry',
        json('POST', { reason: 'Again' }),
      )
    ).status,
  ).toBe(404);
});

test('saves preferences, refuses a required channel, and documents every route', async ({
  app,
  testApp,
}) => {
  const person = await account(testApp, 'notify-person');
  const saved = await person.fetch(
    '/notifications/preferences',
    json('PUT', {
      items: [
        {
          kind: 'fixture.assigned',
          channelType: 'fixture-user',
          enabled: false,
        },
      ],
    }),
  );
  expect(saved.status).toBe(200);
  expect((await saved.json()).data.kinds[0].channels[0].enabled).toBe(false);
  const result = await app.container
    .resolve(notificationServiceToken)
    .notify('fixture.assigned', {
      to: [person.user.id],
      data: { title: 'Muted' },
    });
  expect(result.send).toBeUndefined();
  expect(result.skipped).toEqual([
    {
      userId: person.user.id,
      channelType: 'fixture-user',
      reason: 'preference',
    },
  ]);
  const unknown = await person.fetch(
    '/notifications/preferences',
    json('PUT', {
      items: [{ kind: 'fixture.assigned', channelType: 'sms', enabled: true }],
    }),
  );
  expect(unknown.status).toBe(400);
  expect(await unknown.json()).toMatchObject({
    error: { reason: 'NOTIFICATION_PREFERENCE_UNKNOWN' },
  });

  expect(
    findUndeclaredApiRoutes(app).filter(({ path }) =>
      path.includes('/notifications'),
    ),
  ).toEqual([]);
  const document = await generateApiDocument(app, {
    info: { title: 'test', version: '0.0.0' },
  });
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
});
