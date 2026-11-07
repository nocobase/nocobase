import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { createStandaloneServer } from '../../server/standalone.js';

const admin = {
  username: 'foundationadmin',
  email: 'foundationadmin@example.invalid',
  password: 'Foundation-test-only-670!',
};
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'foundation-test-secret-at-least-32-characters' },
    users: { initialAdmin: admin },
  },
});

test('serves documented Foundation evidence only to an unrestricted administrator', async ({
  testApp,
  request,
}) => {
  expect((await request('/foundation/overview')).status).toBe(401);
  const root = await signIn(testApp, admin);
  const document = await root.fetch('/swagger');
  expect(document.status).toBe(200);
  const { paths } = await document.json();
  expect(
    Object.keys(paths).some((path) => path.endsWith('/foundation/overview')),
  ).toBe(true);
  const overview = await root.fetch('/foundation/overview');
  expect(overview.status).toBe(200);
  const { data } = await overview.json();
  expect(data).toEqual(
    expect.objectContaining({
      kernelVersion: expect.any(String),
      status: expect.stringMatching(/^(queued|running|succeeded|failed)$/),
      needsScan: expect.any(Boolean),
    }),
  );
  expect(
    (
      await root.fetch('/foundation/refresh', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(200);

  const member = {
    email: 'foundationmember@example.invalid',
    password: 'Foundation-member-test-670!',
  };
  const registration = await request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...member,
      name: 'Foundation member',
      username: 'foundationmember',
    }),
  });
  expect(registration.status).toBe(200);
  const session = await signIn(testApp, member);
  const denied = await session.fetch('/foundation/overview');
  expect(denied.status).toBe(403);
  for (const path of ['refresh', 'ensureScan', 'countRecords']) {
    expect(
      (
        await session.fetch(`/foundation/${path}`, {
          method: 'POST',
          headers: { origin: 'http://localhost' },
        })
      ).status,
    ).toBe(403);
  }
  expect((await session.fetch('/foundation/scanStatus')).status).toBe(403);
  expect(await denied.json()).toEqual({
    error: expect.objectContaining({ reason: 'FOUNDATION_FORBIDDEN' }),
  });
});
