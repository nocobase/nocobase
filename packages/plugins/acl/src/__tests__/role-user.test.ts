import Database, { BelongsToManyRepository } from '@nocobase/database';
import PluginACL from '@nocobase/plugin-acl';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer, mockServer } from '@nocobase/test';

describe('role', () => {
  let api: MockServer;
  let db: Database;

  let usersPlugin: UsersPlugin;

  beforeEach(async () => {
    api = mockServer();
    await api.cleanDb();
    api.plugin(UsersPlugin);
    api.plugin(PluginACL);
    await api.loadAndInstall();

    db = api.db;
    usersPlugin = api.getPlugin('@nocobase/plugin-users');
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

  it('should set users default role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        title: 'Admin User',
        allowConfigure: true,
        default: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test2',
        title: 'test2 user',
        allowConfigure: true,
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        token: '123',
      },
    });

    const userRolesRepo = db.getRepository<BelongsToManyRepository>('users.roles', user.get('id') as string);
    await userRolesRepo.add('test1');
    await userRolesRepo.add('test2');

    const userToken = usersPlugin.jwtService.sign({ userId: user.get('id') });
    const response = await api
      .agent()
      .post('/users:setDefaultRole')
      .send({
        roleName: 'test2',
      })
      .set({
        Authorization: `Bearer ${userToken}`,
      });

    expect(response.statusCode).toEqual(200);

    const userRoles = await userRolesRepo.find();
    const defaultRole = userRoles.find((userRole) => userRole.get('rolesUsers').default);

    expect(defaultRole['name']).toEqual('test2');
  });
});
