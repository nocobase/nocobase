import Database from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { setCurrentRole } from '../middlewares/setCurrentRole';
import { prepareApp } from './prepare';

describe('role', () => {
  let api: MockServer;
  let db: Database;

  let usersPlugin: UsersPlugin;
  let ctx;

  beforeEach(async () => {
    api = await prepareApp();

    db = api.db;
    usersPlugin = api.getPlugin('users');

    ctx = {
      db,
      state: {
        currentRole: '',
      },
    };
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('should set role with X-Role when exists', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'admin';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('admin');
  });

  it('should set role with default', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return '';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('root');
  });

  it('should throw 401', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'abc';
      }
    };
    const throwFn = jest.fn();
    ctx.throw = throwFn;
    await setCurrentRole(ctx, () => {});
    expect(throwFn).lastCalledWith(401, { code: 'ROLE_NOT_FOUND_ERR', message: 'The user role does not exist.' });
    expect(ctx.state.currentRole).not.toBeDefined();
  });

  it('should set role with anonymous', async () => {
    ctx.state.currentUser = await db.getRepository('users').findOne({
      appends: ['roles'],
    });
    ctx.get = function (name) {
      if (name === 'X-Role') {
        return 'anonymous';
      }
    };
    await setCurrentRole(ctx, () => {});
    expect(ctx.state.currentRole).toBe('anonymous');
  });
});
