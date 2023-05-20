import PluginErrorHandler from '@nocobase/plugin-error-handler';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import type { MockServer} from '@nocobase/test';
import { mockServer } from '@nocobase/test';
import Plugin from '../';

export async function createApp(
  options: { beforeInstall?: (app: MockServer) => void; beforePlugin?: (app: MockServer) => void } & any = {},
) {
  const app = mockServer({
    acl: false,
    ...options,
  });

  await app.db.clean({ drop: true });
  await app.db.sync({});

  options.beforePlugin && options.beforePlugin(app);

  await app.plugin(PluginErrorHandler, { name: 'error-handler' });
  await app.plugin(Plugin, { name: 'collection-manager' });
  await app.plugin(PluginUiSchema, { name: 'ui-schema-storage' });

  if (options.beforeInstall) {
    await options.beforeInstall(app);
  }

  await app.install({ clean: true });
  await app.start();
  return app;
}
