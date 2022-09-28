import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import PluginUsers from '@nocobase/plugin-users';
import { mockServer } from '@nocobase/test';
import PluginACL from '../server';

export async function prepareApp() {
  const app = mockServer({
    registerActions: true,
    acl: true,
  });

  await app.cleanDb();

  app.plugin(PluginUsers);
  app.plugin(PluginUiSchema);
  app.plugin(PluginErrorHandler);
  app.plugin(PluginCollectionManager);

  app.plugin(PluginACL);
  await app.loadAndInstall();

  await app.db.sync();

  return app;
}
