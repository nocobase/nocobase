import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import { mockServer } from '@nocobase/test';
import lodash from 'lodash';
import Plugin from '../';

export async function createApp(options = {}) {
  const app = mockServer({
    acl: false,
  });

  if (lodash.get(options, 'cleanDB', true)) {
    await app.cleanDb();
  }

  app.plugin(PluginErrorHandler);
  app.plugin(Plugin);
  app.plugin(PluginUiSchema);

  // await app.load();
  await app.install({ clean: true });
  await app.start();
  return app;
}
