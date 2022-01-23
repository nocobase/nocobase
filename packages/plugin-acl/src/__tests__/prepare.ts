import { mockServer } from '@nocobase/test';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginACL from '../server';

let mockRole: string = 'admin';

export function changeMockRole(role: string) {
  mockRole = role;
}

export async function prepareApp() {
  const app = mockServer({
    registerActions: true,
  });

  await app.cleanDb();
  app.plugin(PluginUiSchema);
  app.plugin(PluginCollectionManager);

  app.resourcer.use(async (ctx, next) => {
    ctx.state.currentRole = mockRole;
    await next();
  });

  app.plugin(PluginACL);
  await app.loadAndSync();

  return app;
}
