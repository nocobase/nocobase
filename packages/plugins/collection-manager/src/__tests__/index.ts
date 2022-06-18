import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import { mockServer } from '@nocobase/test';
import lodash from 'lodash';
import CollectionManagerPlugin from '../';

export async function createApp(options = {}) {
  const app = mockServer();

  if (lodash.get(options, 'cleanDB', true)) {
    await app.cleanDb();
  }

  app.plugin(CollectionManagerPlugin);
  app.plugin(PluginUiSchema);

  await app.load();
  return app;
}
