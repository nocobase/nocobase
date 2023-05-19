import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginMultiAppManager from '@nocobase/plugin-multi-app-manager';
import PluginUser from '@nocobase/plugin-users';
import { mockServer } from '@nocobase/test';
import Plugin from '..';

export async function createApp(options = {}) {
  const app = mockServer({
    acl: false,
    ...options,
  });

  await app.plugin(PluginUser, { name: 'users' });
  await app.plugin(PluginErrorHandler, { name: 'error-handler' });
  await app.plugin(PluginCollectionManager, { name: 'collection-manager' });
  await app.loadAndInstall({ clean: true });
  await app.plugin(PluginMultiAppManager, { name: 'multi-app-manager' });
  await app.plugin(Plugin, { name: 'multi-app-share-collection' });

  await app.reload();
  await app.install();
  await app.start();
  return app;
}
