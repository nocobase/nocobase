import { mockServer, MockServer } from '@nocobase/test';
import Database, { Repository } from '@nocobase/database';
import { Authentication } from '@nocobase/authentication';
import { Plugin } from '@nocobase/server';
const testPluginName = 'test-auth-plugin';
let testAuthencatorId;
let testUser;

describe('authentication.mapRoles', () => {
  let api: MockServer;
  let db: Database;
  let auth: Authentication;
  let authRepo: Repository;

  beforeAll(async () => {
    api = mockServer();
    await api.loadAndInstall({ clean: true });
    api.pm.add('users');
    api.pm.add('acl');
    await api.loadAndInstall();
    db = api.db;
    auth = api.authentication;
    authRepo = db.getRepository('authenticators');

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
        return null;
      },
    });
    testAuthencatorId = authencator.id;

    const usersRepo = db.getRepository('users');
    testUser = await usersRepo.create({
      values: {
        nickname: 'test-nickname-1',
      },
    });
  });

  it('should map same roles and use the first role as default role of user', async () => {
    await auth.mapRoles(testAuthencatorId, testUser, ['admin', 'member']);
    const roles = await testUser.getRoles();
    expect(roles).toHaveLength(2);
    expect(roles.map((role) => role.name)).toEqual(['admin', 'member']);
    const rolesUsersRepo = db.getRepository('rolesUsers');
    const rolesUsers = await rolesUsersRepo.findOne({
      filter: {
        userId: testUser.id,
        roleName: 'admin',
      },
    });
    expect(rolesUsers.default).toBe(true);
  });

  it('should set default role', async () => {
    await authRepo.update({
      filter: {
        id: testAuthencatorId,
      },
      values: {
        settings: {
          role: {
            useDefaultRole: true,
          },
        },
      },
    });
    await auth.mapRoles(testAuthencatorId, testUser, []);
    const roles = await testUser.getRoles();
    expect(roles).toHaveLength(1);
    expect(roles[0].name).toBe('member');
  });

  it('should map source role and target role', async () => {
    await authRepo.update({
      filter: {
        id: testAuthencatorId,
      },
      values: {
        settings: {
          role: {
            mapping: [
              {
                source: 'Admin',
                target: 'admin',
              },
              {
                source: 'Member',
                target: 'member',
              },
            ],
          },
        },
      },
    });
    await auth.mapRoles(testAuthencatorId, testUser, [
      'Admin',
      {
        name: 'Member',
        default: true,
      },
    ]);
    const roles = await testUser.getRoles();
    expect(roles).toHaveLength(2);
    expect(roles.map((role) => role.name)).toEqual(['admin', 'member']);
    const rolesUsersRepo = db.getRepository('rolesUsers');
    const rolesUsers = await rolesUsersRepo.findOne({
      filter: {
        userId: testUser.id,
        roleName: 'member',
      },
    });
    expect(rolesUsers.default).toBe(true);
  });

  it('should create new role', async () => {
    await authRepo.update({
      filter: {
        id: testAuthencatorId,
      },
      values: {
        settings: {
          role: {
            createIfNotExists: true,
          },
        },
      },
    });
    await auth.mapRoles(testAuthencatorId, testUser, ['custom']);
    const roles = await testUser.getRoles();
    expect(roles).toHaveLength(1);
    expect(roles[0].name).toBe('custom');
  });
});
