import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { expect } from 'vitest';

import { registerReader, test } from '../helpers/app.js';

test('rejects an anonymous request', async ({ request }) => {
  expect((await request('/readingList')).status).toBe(401);
});

test('rejects a signed-in reader without a grant', async ({ testApp }) => {
  const reader = await registerReader(testApp, 'denied-reader');
  const response = await reader.fetch('/readingList');
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({
    error: { reason: 'AUTHORIZATION_DENIED' },
  });
});

test('reads persisted entries after assigning a permission set', async ({
  testApp,
  app,
  database,
}) => {
  const reader = await registerReader(testApp, 'allowed-reader');
  const authz = app.container.resolve(authorizationToken);
  await authz.permissionSets.create(
    definePermissionSet('reading-list-test-reader')
      .title('Reading list test reader')
      .grant({
        resource: { type: 'readingList', id: 'shared' },
        actions: [{ action: 'read' }],
      })
      .build(),
  );
  await authz.permissionSets.assign({
    permissionSet: 'reading-list-test-reader',
    subject: { type: 'user', id: reader.user.id },
  });
  await database.repository('readingListEntries').createOne({
    values: { id: 'server-entry', title: 'Read the migration guide' },
  });

  const response = await reader.fetch('/readingList');
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    data: [{ id: 'server-entry', title: 'Read the migration guide' }],
    meta: { total: 1 },
  });
});
