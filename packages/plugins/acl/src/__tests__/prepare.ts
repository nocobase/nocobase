import type { MockServer } from '@nocobase/test';
import { mockServer } from '@nocobase/test';
import PluginACL from '../server';

export async function prepareApp(): Promise<MockServer> {
  const app = mockServer({
    registerActions: true,
    acl: true,
    plugins: ['error-handler', 'users', 'ui-schema-storage', 'collection-manager'],
  });

  await app.plugin(PluginACL, {
    name: 'acl',
  });

  await app.loadAndInstall({ clean: true });

  await app.db.sync();

  return app;
}
