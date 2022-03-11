import { mockServer } from '@nocobase/test';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';

import CollectionManagerPlugin from '..';

export async function createApp() {
  const app = mockServer();
  await app.cleanDb();
  app.plugin(CollectionManagerPlugin);
  app.plugin(PluginUiSchema);
  await app.load();
  return app;
}
