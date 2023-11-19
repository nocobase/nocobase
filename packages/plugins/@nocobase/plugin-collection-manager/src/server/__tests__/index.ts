import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '../';

export async function createApp(
  options: { beforeInstall?: (app: MockServer) => void; beforePlugin?: (app: MockServer) => void } & any = {},
) {
  const app = mockServer({
    acl: false,
    ...options,
  });

  options.beforePlugin && options.beforePlugin(app);

  app.plugin(PluginErrorHandler, { name: 'error-handler' });
  app.plugin(Plugin, { name: 'collection-manager' });
  app.plugin(PluginUiSchema, { name: 'ui-schema-storage' });

  await app.load();

  if (options.beforeInstall) {
    await options.beforeInstall(app);
  }

  await app.install({ clean: true });
  await app.start();
  return app;
}
