import { mockServer, MockServer } from '@nocobase/test';
import Database, { Repository } from '@nocobase/database';
import { Authentication } from '@nocobase/authentication';
import { Plugin } from '@nocobase/server';
import UsersPlugin from '@nocobase/plugin-users';
const testPluginName = 'test-auth-plugin';
let errorSpy;

describe('use', () => {
  let api: MockServer;
  let db: Database;
  let auth: Authentication;
  let authenticatorsRepo: Repository;

  beforeAll(async () => {
    api = mockServer();
    api.plugin(UsersPlugin);
    await api.loadAndInstall({ clean: true });
    db = api.db;
    auth = api.authentication;
    authenticatorsRepo = db.getRepository('authenticators');

    errorSpy = jest.spyOn(api.logger, 'error');

    // Insert test plugin record
    const pluginsRepo = db.getRepository('applicationPlugins');
    await pluginsRepo.create({
      values: {
        name: testPluginName,
        version: '0.0.1',
        enabled: true,
        installed: true,
        builtIn: true,
      },
    });

    await auth.register({
      plugin: {
        name: testPluginName,
      } as Plugin,
      authType: 'test',
      authMiddleware: () => {},
    });
  });

  afterEach(() => {
    errorSpy.mockClear();
  });
});
