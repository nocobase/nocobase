/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { ACL } from '..';
describe('multiple roles merge', () => {
  let acl: ACL;
  beforeEach(() => {
    acl = new ACL();
  });
  describe('filter merge', () => {
    test('should allow all(params:{}) when filter1 = undefined, filter2 is not exists', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: undefined,
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {},
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should allow all(params:{}) when filter1 = undefined, filter2 = {}', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: undefined,
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            filter: {},
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should allow all(params={}) when filter1 = {}, filter2 = {}', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: {},
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            filter: {},
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should union filter(params.filter={$or:[{id:1}, {id:2}]}) when filter1 = {id: 1}, filter2 = {id: 2}', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: { id: 1 },
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            filter: { id: 2 },
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {
          filter: {
            $or: expect.arrayContaining([{ id: 1 }, { id: 2 }]),
          },
        },
      });
    });

    test('should union filter(filter={$or:[{id:1}, {name: zhangsan}]}) when filter1 = {id: 1}, filter2 = {name: zhangsan}', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: { id: 1 },
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            filter: { name: 'zhangsan' },
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {
          filter: {
            $or: expect.arrayContaining([{ id: 1 }, { name: 'zhangsan' }]),
          },
        },
      });
    });

    test('should union filter(filter={$or:[{id:1}, {name: zhangsan}]}) when filter1 = {id: 1}, filter2 = { $or: [{name: zhangsan}]', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: { id: 1 },
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            filter: { name: 'zhangsan' },
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {
          filter: {
            $or: expect.arrayContaining([{ id: 1 }, { name: 'zhangsan' }]),
          },
        },
      });
    });
  });

  describe('feilds merge', () => {
    test('should allow all(params={}) when fields1 = undefined, fields2 is not exists', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            fields: [],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {},
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should allow all(params={}) when fields1 = undefined, fields2 is not exists', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            fields: undefined,
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {},
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should allow all(params={}) when fields1 = [], fields2 =[]', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            fields: [],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: [],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should union fields(params={ fields: [a,b]}) when fields1 = [a], fields2 =[b]', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            fields: ['a'],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: ['b'],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {
          fields: expect.arrayContaining(['a', 'b']),
        },
      });
    });
    test('should union no repeat fields(params={ fields: [a,b,c]}) when fields1 = [a,b], fields2 =[b,c]', () => {
      acl.setAvailableAction('edit', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            fields: ['a', 'b'],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: ['b', 'c'],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {
          fields: expect.arrayContaining(['a', 'b', 'c']),
        },
      });
      expect(canResult.params.fields.length).toStrictEqual(3);
    });
  });

  describe('whitelist', () => {
    test('should union whitelist(params={ fields: [a,b,c]}) when fields1 = [a,b], fields2 =[c]', () => {
      acl.setAvailableAction('update');
      acl.define({
        role: 'role1',
        actions: {
          'posts:update': {
            whitelist: ['a', 'b'],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:update': {
            whitelist: ['c'],
          },
        },
      });
      const canResult = acl.can({ resource: 'posts', action: 'update', roles: ['role1', 'role2'] });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'update',
        params: {
          whitelist: expect.arrayContaining(['a', 'b', 'c']),
        },
      });
    });
  });

  describe('appends', () => {
    test('should union appends(params={ appends: [a,b,c]}) when appends = [a,b], appends =[c]', () => {
      acl.setAvailableAction('update');
      acl.define({
        role: 'role1',
        actions: {
          'posts:update': {
            appends: ['a', 'b'],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:update': {
            appends: ['c'],
          },
        },
      });
      const canResult = acl.can({ resource: 'posts', action: 'update', roles: ['role1', 'role2'] });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'update',
        params: {
          appends: expect.arrayContaining(['a', 'b', 'c']),
        },
      });
    });
    test('should union appends(params={ appends: [a,b]}) when appends = [a,b], appends =[]', () => {
      acl.setAvailableAction('update');
      acl.define({
        role: 'role1',
        actions: {
          'posts:update': {
            appends: ['a', 'b'],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:update': {
            appends: [],
          },
        },
      });
      const canResult = acl.can({ resource: 'posts', action: 'update', roles: ['role1', 'role2'] });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'update',
        params: {
          appends: expect.arrayContaining(['a', 'b']),
        },
      });
    });
  });

  describe('filter & fields merge', () => {
    test('should allow all(params={}) when actions1 = {filter: {}}, actions2 = {fields: []}', () => {
      acl.setAvailableAction('view', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: {},
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: [],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should allow all(params={}) when actions1 = {filter: {}}, actions2 = {fields: [a]}', () => {
      acl.setAvailableAction('view', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: {},
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: ['a'],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });
    test('should allow all(params={}) when actions1 = {filter: {a:1}}, actions2 = {fields: []}', () => {
      acl.setAvailableAction('view', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: { a: 1 },
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: [],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });

    test('should allow all(params={}) when actions1 = {filter: {a:1}}, actions2 = {fields: [a]}', () => {
      acl.setAvailableAction('view', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: { a: 1 },
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            fields: ['a'],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: {},
      });
    });

    test('should union filter&fields(params={ filter:{ $or:[{a:1},{a:2}]}, fields:[a,b]}) when actions1={filter:{a:1}, fields:[a]}, actions2={filter: {a:1}},fields:[b]}', () => {
      acl.setAvailableAction('view', {
        type: 'old-data',
      });
      acl.define({
        role: 'role1',
        actions: {
          'posts:view': {
            filter: { a: 1 },
            fields: ['a'],
          },
        },
      });
      acl.define({
        role: 'role2',
        actions: {
          'posts:view': {
            filter: { a: 2 },
            fields: ['b'],
          },
        },
      });
      const canResult = acl.can({ roles: ['role1', 'role2'], resource: 'posts', action: 'view' });
      expect(canResult).toStrictEqual({
        role: 'role1',
        resource: 'posts',
        action: 'view',
        params: expect.objectContaining({
          filter: { $or: expect.arrayContaining([{ a: 1 }, { a: 2 }]) },
          fields: expect.arrayContaining(['a', 'b']),
        }),
      });
    });
  });
});
