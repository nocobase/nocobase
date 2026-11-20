import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import type { AuthorizationOptionsResponse } from '@nocobase/app-plugin-authorization/client';
import { createStandaloneServer } from '../../server/standalone.js';
import { businessSelectionIssues } from '../../client/pages/settings/permission-workspace.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});

test('the permission editor selects only operations registered by the running server', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/authorization/permissionSets/options');
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as {
    data: AuthorizationOptionsResponse;
  };
  expect(businessSelectionIssues(data)).toEqual([]);
});
