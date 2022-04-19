import { mockServer } from '@nocobase/test';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';

import CollectionManagerPlugin from '..';
import lodash from 'lodash';

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
