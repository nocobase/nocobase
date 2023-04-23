import { mockServer, MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { Authentication, RawUserInfo } from '@nocobase/authentication';
import { Plugin } from '@nocobase/server';
import { Context } from '@nocobase/actions';
const testPluginName = 'test-auth-plugin';
let testAuthencatorId;
let ctx;

describe('authentication.use', () => {
  let api: MockServer;
  let db: Database;
  let auth: Authentication;

  beforeAll(async () => {
    api = mockServer();
    await api.loadAndInstall({ clean: true });
    api.pm.add('users');
    await api.loadAndInstall();
    db = api.db;
    auth = api.authentication;

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

    const authencator = await auth.register({
      plugin: {
        name: testPluginName,
      } as Plugin,
      authType: 'test',
      authMiddleware: (ctx, next) => {
        const rawUserInfo: RawUserInfo = {
          uuid: 'test-uuid-1',
          nickname: 'test-nickname-1',
          roles: ['Admin'],
        };
        ctx.state.rawUser = rawUserInfo;
        return next();
      },
    });
    testAuthencatorId = authencator.id;
  });

  beforeEach(async () => {
    (ctx = {
      state: {},
      db: api.db,
      t: console.log,
      throw: console.log,
      currentUser: null,
    } as unknown as Context),
      await auth.use(testAuthencatorId)(ctx, async () => {});
  });

  it('should create new user', async () => {
    const userAuthRepo = db.getRepository('userAuthInfomation');
    const userAuth = await userAuthRepo.findOne({
      where: {
        uuid: 'test-uuid-1',
        type: 'test',
        plugin: testPluginName,
      },
    });
    expect(userAuth).not.toBeNull();
    const user = await userAuth.getUser();
    expect(user).not.toBeNull();
    expect(user.get('nickname')).toBe('test-nickname-1');
    expect(ctx.state.currentUser).toStrictEqual(user);
  });

  it('should get exist user', async () => {
    await auth.use(testAuthencatorId)(ctx, async () => {});
    expect(ctx.state.currentUser).not.toBeNull();
    expect(ctx.state.currentUser.nickname).toBe('test-nickname-1');
  });
});
