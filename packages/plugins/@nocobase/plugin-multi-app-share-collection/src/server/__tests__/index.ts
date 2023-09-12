import { mockServer } from '@nocobase/test';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUser from '@nocobase/plugin-users';
import Plugin from '..';

export async function createApp(options = {}) {
  const app = mockServer({
    acl: false,
    ...options,
  });

  app.plugin(PluginUser, { name: 'users' });
  app.plugin(PluginErrorHandler, { name: 'error-handler' });
  app.plugin(PluginCollectionManager, { name: 'collection-manager' });
  await app.loadAndInstall({ clean: true });
  app.plugin(PluginMultiAppManager, { name: 'multi-app-manager' });
  app.plugin(Plugin, { name: 'multi-app-share-collection' });

  await app.reload();
  await app.install();
  await app.start();
  return app;
}
