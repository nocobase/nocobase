import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import { mockServer } from '@nocobase/test';
import Plugin from '../';

export async function createApp(options = {}) {
  const app = mockServer({
    acl: false,
    ...options,
  });

  app.plugin(PluginErrorHandler, { name: 'error-handler' });
  app.plugin(Plugin, { name: 'collection-manager' });
  app.plugin(PluginUiSchema, { name: 'ui-schema-storage' });

  await app.loadAndInstall({ clean: true });
  await app.start();
  return app;
}
