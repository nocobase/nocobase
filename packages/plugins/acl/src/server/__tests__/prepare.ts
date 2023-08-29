import { mockServer, MockServer } from '@nocobase/test';
import PluginACL from '../../server';

export async function prepareApp(): Promise<MockServer> {
  const app = mockServer({
    registerActions: true,
    acl: true,
    plugins: ['error-handler', 'users', 'ui-schema-storage', 'collection-manager', 'auth'],
  });

  await app.db.clean({ drop: true });
  app.plugin(PluginACL, {
    name: 'acl',
  });

  await app.loadAndInstall({ clean: true });
  await app.start();
  return app;
}
