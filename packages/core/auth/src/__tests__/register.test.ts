import { mockServer, MockServer } from '@nocobase/test';
import Database, { Repository } from '@nocobase/database';
import { Authentication } from '@nocobase/auth';
import { Plugin } from '@nocobase/server';
const testPluginName = 'test-auth-plugin';
let errorSpy;

describe('authentication.register', () => {
  let api: MockServer;
  let db: Database;
  let auth: Authentication;
  let authenticatorsRepo: Repository;
  let pluginId: number;

  beforeAll(async () => {
    api = mockServer();
    await api.loadAndInstall({ clean: true });
    api.pm.add('users');
    await api.loadAndInstall();
    db = api.db;
    auth = api.authentication;
    authenticatorsRepo = db.getRepository('authenticators');

    errorSpy = jest.spyOn(api.logger, 'error');

    // Insert test plugin record
    const pluginsRepo = db.getRepository('applicationPlugins');
    const plugin = await pluginsRepo.create({
      values: {
        name: testPluginName,
        version: '0.0.1',
        enabled: true,
        installed: true,
        builtIn: true,
      },
    });
    pluginId = plugin.id;
  });

  beforeEach(async () => {
    // Clean test data before running each test case
    await authenticatorsRepo.destroy({
      truncate: true,
    });
  });

  afterEach(() => {
    errorSpy.mockClear();
  });

  it('should add authenticator', async () => {
    const authenticator = await auth.register({
      plugin: {
        name: testPluginName,
      } as Plugin,
      authType: 'test',
      authMiddleware: (ctx, next) => {
        return next();
      },
    });

    const [_, count] = await authenticatorsRepo.findAndCount({
      filter: {
        pluginId,
        type: 'test',
      },
    });

    expect(count).toBe(1);
    expect(auth.authenticators.get(authenticator.id)).not.toBeUndefined();
  });

  it('should log error if plugin not exists', async () => {
    await auth.register({
      plugin: {
        name: 'not-exists',
      } as Plugin,
      authType: 'test',
      authMiddleware: (ctx, next) => {
        return next();
      },
    });
    expect(errorSpy.mock.calls[0][0].message).toBe('plugin not-exists not exists.');
  });

  it('should log error if authenticator already exists', async () => {
    await authenticatorsRepo.create({
      values: {
        pluginId,
        type: 'test',
      },
    });

    await auth.register({
      plugin: {
        name: testPluginName,
      } as Plugin,
      authType: 'test',
      authMiddleware: (ctx, next) => {
        return next();
      },
    });
    expect(errorSpy.mock.calls[0][0].message).toBe('authenticator test already exists in plugin test-auth-plugin.');
  });
});
