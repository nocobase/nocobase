import { mockServer } from '@nocobase/test';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginACL from '../server';

export async function prepareApp() {
  const app = mockServer({
    registerActions: true,
  });

  await app.cleanDb();
  app.plugin(PluginUiSchema);
  app.plugin(PluginCollectionManager);
  app.plugin(PluginACL);
  await app.loadAndSync();

  return app;
}
