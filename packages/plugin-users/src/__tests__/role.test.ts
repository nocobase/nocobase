import Database from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';
import { MockServer, mockServer } from '@nocobase/test';

describe('role', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();
    await api.cleanDb();
    api.plugin(require('../server').default);
    api.plugin(PluginACL);
    await api.loadAndInstall();

    db = api.db;
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('should set default role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        title: 'Admin User',
        allowConfigure: true,
        default: true,
      },
    });

    const user = await db.getRepository('users').create({});

    // @ts-ignore
    const roles = await user.getRoles();

    expect(roles.length).toEqual(1);
    expect(roles[0].get('name')).toEqual('test1');
  });

  it('should not add role when user has role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        default: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test2',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: [
          {
            name: 'test2',
          },
        ],
      },
    });

    // @ts-ignore
    const roles = await user.getRoles();

    expect(roles.length).toEqual(1);
    expect(roles[0].get('name')).toEqual('test2');
  });
});
