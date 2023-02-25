import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '../';

export async function createApp(options: { beforeInstall?: (app: MockServer) => void } & any = {}) {
  const app = mockServer({
    acl: false,
    ...options,
  });

  await app.db.clean({ drop: true });
  await app.db.sync({});

  app.plugin(PluginErrorHandler, { name: 'error-handler' });
  app.plugin(Plugin, { name: 'collection-manager' });
  app.plugin(PluginUiSchema, { name: 'ui-schema-storage' });

  if (options.beforeInstall) {
    await options.beforeInstall(app);
  }

  await app.loadAndInstall({ clean: true, afterLoad: options.afterLoad });
  await app.start();
  return app;
}
