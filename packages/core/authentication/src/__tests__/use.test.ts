import { mockServer, MockServer } from '@nocobase/test';
import Database, { Repository } from '@nocobase/database';
import { Authentication, RawUserInfo } from '@nocobase/authentication';
import { Plugin } from '@nocobase/server';
import UsersPlugin from '@nocobase/plugin-users';
import { Context } from '@nocobase/actions';
const testPluginName = 'test-auth-plugin';
let errorSpy;
let testAuthencatorId;

describe('authentication.use', () => {
  let api: MockServer;
  let db: Database;
  let auth: Authentication;

  beforeAll(async () => {
    api = mockServer();
    await api.loadAndInstall({ clean: true });
    await api.pm.add('users');
    await api.loadAndInstall();
    db = api.db;
    auth = api.authentication;

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
    await auth.use(testAuthencatorId)(
      {
        state: {},
        db: api.db,
      } as Context,
      async () => {},
    );
  });

  afterEach(() => {
    errorSpy.mockClear();
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
  });

  it('should get exist user', async () => {
    const ctx = {
      state: {
        currentUser: null,
      },
      db: api.db,
    };
    await auth.use(testAuthencatorId)(ctx as Context, async () => {});
    expect(ctx.state.currentUser).not.toBeNull();
    console.log(ctx.state.currentUser);
    expect(ctx.state.currentUser.nickname).toBe('test-nickname-1');
  });
});
