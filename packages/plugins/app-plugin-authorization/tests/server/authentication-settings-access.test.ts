import {
  AUTHENTICATION_SETTINGS_ID,
  authenticationSettingsAccessToken,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { apiErrorHandler } from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import {
  AuthorizationProvider,
  authorizationToken,
} from '../../server/index.js';
import { migratePlugins } from '../helpers/database-fixture.js';

describe('reading the Authentication settings', () => {
  it('declares the settings item and lets only identities granted its read action through', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    await migratePlugins(database, 'app-plugin-authorization');
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    const provider = new AuthorizationProvider({
      container,
      config: { get: () => undefined },
    } as unknown as AppPluginApplication);
    try {
      provider.register();
      await provider.boot();
      const authorization = container.resolve(authorizationToken);
      expect(
        authorization.settings.grant(AUTHENTICATION_SETTINGS_ID, ['read']),
      ).toEqual({
        resource: { type: 'settings', id: AUTHENTICATION_SETTINGS_ID },
        actions: [{ action: 'read' }],
      });
      await authorization.permissionSets.create({
        key: 'auth-readers',
        grants: [
          authorization.settings.grant(AUTHENTICATION_SETTINGS_ID, ['read']),
        ],
      });
      await authorization.permissionSets.assign({
        subject: { type: 'user', id: 'reader' },
        permissionSet: 'auth-readers',
      });

      const access = container.resolve(authenticationSettingsAccessToken);
      const request = (userId: string) => {
        const router = new Hono();
        router.onError(apiErrorHandler);
        router.get(
          '/settings',
          async (context, next) => {
            context.set('auth' as never, { user: { id: userId } } as never);
            await next();
          },
          access,
          (context) => context.json({ data: 'ok' }),
        );
        return router.request('/settings');
      };

      expect((await request('member')).status).toBe(403);
      const allowed = await request('reader');
      expect(allowed.status).toBe(200);
      await expect(allowed.json()).resolves.toEqual({ data: 'ok' });
    } finally {
      await provider.shutdown();
      await testDatabase.destroy();
    }
  });
});
