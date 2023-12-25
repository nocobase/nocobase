import { vi } from 'vitest';
import { Context } from '@nocobase/actions';
import { ACL } from '..';

describe('acl', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should grant action with own params', () => {
    acl.setAvailableAction('edit', {
      type: 'old-data',
    });

    acl.setAvailableAction('create', {
      type: 'new-data',
    });

    acl.define({
      role: 'admin',
      actions: {
        'posts:edit': {
          own: true,
        },
      },
    });

    const canResult = acl.can({ role: 'admin', resource: 'posts', action: 'edit' });

    expect(canResult).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'edit',
      params: {
        filter: {
          createdById: '{{ ctx.state.currentUser.id }}',
        },
      },
    });
  });

  it('should define role with predicate', () => {
    acl.setAvailableAction('edit', {
      type: 'old-data',
    });

    acl.setAvailableAction('create', {
      type: 'new-data',
    });

    acl.define({
      role: 'admin',
      strategy: {
        actions: ['edit:own', 'create'],
      },
    });

    const canResult = acl.can({ role: 'admin', resource: 'posts', action: 'edit' });

    expect(canResult).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'edit',
      params: {
        filter: {
          createdById: '{{ ctx.state.currentUser.id }}',
        },
      },
    });
  });

  it('should allow all', () => {
    acl.setAvailableAction('create', {
      type: 'new-data',
    });

    acl.setAvailableAction('edit', {
      type: 'old-data',
    });

    acl.setAvailableStrategy('s1', {
      displayName: 's1',
      actions: '*',
    });

    acl.define({
      role: 'admin',
      strategy: 's1',
    });

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });
  });

  it('should deny all', () => {
    acl.setAvailableStrategy('s1', {
      displayName: 'test',
      actions: false,
    });

    acl.define({
      role: 'admin',
      strategy: 's1',
    });

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toBeNull();
  });

  it('should grant action when define role', () => {
    acl.setAvailableAction('create', {
      displayName: 'create',
      type: 'new-data',
    });

    acl.setAvailableStrategy('s1', {
      displayName: 'test',
      actions: false,
    });

    const role = acl.define({
      role: 'admin',
      strategy: 's1',
      actions: {
        'posts:create': {},
      },
    });

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });
  });

  it('should grant action', function () {
    acl.setAvailableAction('create', {
      displayName: 'create',
      type: 'new-data',
    });

    acl.setAvailableStrategy('s1', {
      displayName: 'test',
      actions: false,
    });

    const role = acl.define({
      role: 'admin',
      strategy: 's1',
    });

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toBeNull();

    role.grantAction('posts:create', {});

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });
  });

  it('should works with alias action', () => {
    acl.setAvailableAction('view', {
      displayName: 'view',
      type: 'new-data',
      aliases: ['get', 'list'],
    });

    acl.setAvailableStrategy('s1', {
      displayName: 'test',
      actions: ['view'],
    });

    const role = acl.define({
      role: 'admin',
      strategy: 's1',
    });

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'get' })).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'get',
    });
    expect(acl.can({ role: 'admin', resource: 'posts', action: 'list' })).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'list',
    });
  });

  it('should return action params when check permission', () => {
    acl.setAvailableStrategy('s2', {
      displayName: 'view create update',
      actions: ['view', 'create', 'update'],
    });

    acl.setAvailableAction('view', { type: 'new-data' });
    acl.setAvailableAction('create', { type: 'new-data' });
    acl.setAvailableAction('update', { type: 'new-data' });

    acl.define({
      role: 'admin',
      strategy: 's2',
      actions: {
        'posts:view': {
          filter: {
            createdById: '{{ ctx.state.currentUser.id }}',
          },
        },
      },
    });

    const canResult = acl.can({ role: 'admin', resource: 'posts', action: 'view' });

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

  it('should getActionParams', () => {
    acl.setAvailableStrategy('s2', {
      displayName: 'view create update',
      actions: ['view', 'create', 'update'],
    });

    acl.setAvailableAction('view', { type: 'new-data' });
    acl.setAvailableAction('create', { type: 'new-data' });
    acl.setAvailableAction('update', { type: 'new-data' });

    const role = acl.define({
      role: 'admin',
      strategy: 's2',
      actions: {
        'posts:view': {
          filter: {
            createdById: '{{ ctx.state.currentUser.id }}',
          },
        },
      },
    });

    const params = role.getActionParams('posts:view');

    expect(params).toMatchObject({
      filter: {
        createdById: '{{ ctx.state.currentUser.id }}',
      },
    });
  });

  it('should revoke action', () => {
    acl.setAvailableAction('create', {
      displayName: 'create',
      type: 'new-data',
    });

    acl.setAvailableStrategy('s1', {
      displayName: 'test',
      actions: false,
    });

    const role = acl.define({
      role: 'admin',
      strategy: 's1',
    });

    role.grantAction('posts:create', {});

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });

    role.revokeAction('posts:create');

    expect(acl.can({ role: 'admin', resource: 'posts', action: 'create' })).toBeNull();
  });

  it('should call beforeGrantAction', () => {
    acl.setAvailableAction('create', {
      type: 'old-data',
    });

    acl.beforeGrantAction((ctx) => {
      if (ctx.path === 'posts:create') {
        ctx.params = {
          filter: {
            status: 'publish',
          },
        };
      }
    });

    acl.define({
      role: 'admin',
      actions: {
        'posts:create': {},
      },
    });

    const results = acl.can({ role: 'admin', resource: 'posts', action: 'create' });

    expect(results).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
      params: {
        filter: {
          status: 'publish',
        },
      },
    });
  });

  it('should to JSON', () => {
    acl.setAvailableAction('create', {
      displayName: 'create',
      type: 'new-data',
    });

    acl.setAvailableStrategy('s1', {
      displayName: 'test',
      actions: false,
    });

    const role = acl.define({
      role: 'admin',
      strategy: 's1',
      actions: {
        'posts:create': {
          filter: { a: 'b' },
        },
      },
    });

    const roleJSON = role.toJSON();

    expect(roleJSON).toMatchObject({
      role: 'admin',
      strategy: 's1',
      actions: {
        'posts:create': {},
      },
    });
  });

  it('should clone can result deeply', () => {
    vi.spyOn(acl, 'can').mockReturnValue({
      role: 'root',
      resource: 'Test',
      action: 'test',
      params: {
        fields: [],
      },
    });
    const newConext = () => ({
      state: {},
      action: {},
      throw: () => {},
    });
    const ctx1 = newConext() as Context;
    const ctx2 = newConext() as Context;
    acl.getActionParams(ctx1);
    acl.getActionParams(ctx2);
    ctx1.permission.can.params.fields.push('createdById');
    expect(ctx2.permission.can.params.fields).toEqual([]);
  });
});
