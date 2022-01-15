import { ACL, AclRole } from '..';

describe('acl', () => {
  let acl: ACL;
  beforeEach(() => {
    acl = new ACL();
  });

  it('should set resource action', function () {
    acl.addRole('admin');
    acl.addStrategy('s1', {
      displayName: 'test',
      actions: false,
      resource: '*',
    });

    acl.strategy({
      role: 'admin',
      strategy: 's1',
    });

    expect(acl.can('admin', 'posts', 'create')).toBeNull();

    acl.setResourceAction({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });

    expect(acl.can('admin', 'posts', 'create')).not.toBeNull();
  });

  describe('role', () => {
    it('should set strategy of role', () => {
      acl.addStrategy('s1', {
        displayName: '可以管理所有数据',
        actions: '*',
        resource: '*',
      });

      acl.roles.set('admin', new AclRole());

      const adminRole = acl.roles.get('admin');
      expect(adminRole).toEqual(expect.anything());

      acl.strategy({
        role: 'admin',
        strategy: 's1',
      });

      expect(adminRole.strategy).toEqual('s1');
    });

    it('should set acl actions', () => {
      acl.setAction('view', {
        type: 'old-data', // 对新数据的操作
        displayName: 'view',
        aliases: ['list', 'get'],
      });

      acl.addRole('admin');

      expect(acl.resolveActionAlias('list')).toEqual('view');

      acl.addResource({
        role: 'admin',
        resource: 'posts',
        actions: {
          view: {},
        },
      });

      expect(acl.can('admin', 'posts', 'list')).not.toBeNull();
      expect(acl.can('admin', 'posts', 'get')).not.toBeNull();
    });
  });

  describe('can', () => {
    it('should deny all actions in resource', () => {
      acl.roles.set('admin', new AclRole());

      acl.addStrategy('allowAll', {
        displayName: 'Allow all',
        actions: '*',
        resource: '*',
      });

      acl.strategy({
        role: 'admin',
        strategy: 'allowAll',
      });

      acl.addResource({
        role: 'admin',
        resource: 'posts',
        actions: false,
      });

      expect(acl.can('admin', 'posts', 'create')).toBeNull();
      expect(acl.can('admin', 'users', 'create')).toEqual(expect.anything());
    });

    it('should allow all actions in resource', () => {
      acl.roles.set('admin', new AclRole());

      acl.addStrategy('denyAll', {
        displayName: 'Deny all',
        actions: false,
        resource: '*',
      });

      acl.strategy({
        role: 'admin',
        strategy: 'denyAll',
      });

      acl.addResource({
        role: 'admin',
        resource: 'posts',
        actions: '*',
      });

      expect(acl.can('admin', 'posts', 'create')).toEqual(expect.anything());
      expect(acl.can('admin', 'users', 'create')).toBeNull();
    });

    it('should deny all', () => {
      acl.roles.set('admin', new AclRole());

      acl.addStrategy('denyAll', {
        displayName: 'Deny all',
        actions: false,
        resource: '*',
      });

      acl.strategy({
        role: 'admin',
        strategy: 'denyAll',
      });

      expect(acl.can('admin', 'posts', 'create')).toBeNull();
    });

    it('should return null when deny all', () => {
      acl.roles.set('admin', new AclRole());

      acl.addStrategy('denyAll', {
        displayName: 'Deny all',
        actions: false,
        resource: '*',
      });

      expect(acl.can('admin', 'posts', 'create')).toBeNull();
    });

    it('should return null when access other resource action', () => {
      acl.roles.set('admin', new AclRole());

      acl.addStrategy('allowAll', {
        displayName: 'allow all',
        actions: '*',
        resource: '*',
      });

      acl.addResource({
        role: 'admin',
        resource: 'posts',
        actions: {
          view: {},
        },
      });

      const canResult = acl.can('admin', 'posts', 'view');
      expect(canResult).toEqual(expect.anything());

      expect(acl.can('admin', 'posts', 'create')).toBeNull();
    });

    it('should return action config', async () => {
      acl.roles.set('admin', new AclRole());

      acl.addStrategy('s2', {
        displayName: '只能查看、添加、修改数据',
        actions: ['view', 'create', 'update'],
        resource: '*',
      });

      acl.strategy({
        role: 'admin',
        strategy: 's2',
      });

      acl.addResource({
        role: 'admin',
        resource: 'posts',
        actions: {
          view: {
            filter: {
              createdById: '{{ ctx.state.currentUser.id }}',
            },
          },
        },
      });

      const canResult = acl.can('admin', 'posts', 'view');

      expect(canResult).toMatchObject({
        role: 'admin',
        resource: 'posts',
        action: 'view',
        params: {
          filter: {
            createdById: '{{ ctx.state.currentUser.id }}',
          },
        },
      });
    });
  });
});
