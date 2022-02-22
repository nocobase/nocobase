import { mockServer } from '@nocobase/test';
import PluginUiSchema from '@nocobase/plugin-ui-schema-storage';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import PluginACL from '../server';

let mockRole: string = 'admin';
let mockUser = {};

export function changeMockRole(role: string) {
  mockRole = role;
}

export function changeMockUser(user: any) {
  mockUser = user;
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
    ctx.state.currentUser = mockUser;
    await next();
  });

  app.plugin(PluginACL);
  await app.loadAndInstall();

  return app;
}
