import { permissionSetsPlugin } from '@nocobase/authorization';
import { describe, expect, it } from 'vitest';

import type { AppAuthorization } from '../../../server/index.js';
import { createAuthorization } from '../../helpers/authorization-fixture.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';
import { mountedRouter, testIdentity } from '../../helpers/mounted-router.js';
import { pagesPlugin } from '../../../server/pages-authorization.js';

function authorization(): AppAuthorization {
  return createAuthorization({
    plugins: [
      testIdentity(),
      pagesPlugin(),
      permissionSetsPlugin({
        store: new MockPermissionSetStore({
          permissionSets: [
            {
              key: 'reader',
              grants: [
                {
                  resource: { type: 'page', id: 'orders' },
                  actions: [{ action: 'access' }],
                },
              ],
            },
          ],
          assignments: [
            {
              id: 'reader-alice',
              subject: { type: 'user', id: 'alice' },
              permissionSet: 'reader',
            },
          ],
        }),
      }),
    ],
  }) as unknown as AppAuthorization;
}

describe('GET /api/authorization/permissions', () => {
  it('protects its HTTP routes with authentication', async () => {
    const router = await mountedRouter(authorization(), {
      authenticate: (context) =>
        Promise.resolve(
          context.json(
            { code: 'UNAUTHORIZED', message: 'Authentication required' },
            401,
          ),
        ),
    });

    const response = await router.request('/api/authorization/permissions');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  });

  it("answers the signed-in identity's snapshot", async () => {
    const router = await mountedRouter(authorization());

    const response = await router.request('/api/authorization/permissions', {
      headers: { 'x-test-user': 'alice' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        unrestricted: false,
        permissions: [
          { resource: { type: 'page', id: 'orders' }, actions: ['access'] },
        ],
      },
    });
  });
});
