import { MockServer, mockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';

describe('role', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = mockServer();

    api.plugin(require('../server').default);
    api.plugin(PluginACL);

    await api.load();
    db = api.db;
    await db.sync();
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
});
