/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import FixedParamsManager from '../fixed-params-manager';

describe('FixedParamsManager', () => {
  let manager: FixedParamsManager;

  beforeEach(() => {
    manager = new FixedParamsManager();
  });

  describe('addGeneralParams', () => {
    it('should add general merger that applies to all resources', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { status: 'active' },
      }));

      const params1 = manager.getParams('posts', 'list');
      const params2 = manager.getParams('users', 'list');

      expect(params1).toEqual({ filter: { status: 'active' } });
      expect(params2).toEqual({ filter: { status: 'active' } });
    });

    it('should support multiple general mergers', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { status: 'active' },
      }));

      manager.addGeneralParams((resource, action) => ({
        filter: { published: true },
      }));

      const params = manager.getParams('posts', 'list');

      expect(params).toEqual({
        filter: {
          $and: [{ status: 'active' }, { published: true }],
        },
      });
    });

    it('should allow general merger to return different params based on resource', () => {
      manager.addGeneralParams((resource, action) => {
        if (resource === 'posts') {
          return { filter: { type: 'article' } };
        }
        if (resource === 'users') {
          return { filter: { role: 'member' } };
        }
        return {};
      });

      const postsParams = manager.getParams('posts', 'list');
      const usersParams = manager.getParams('users', 'list');
      const othersParams = manager.getParams('comments', 'list');

      expect(postsParams).toEqual({ filter: { type: 'article' } });
      expect(usersParams).toEqual({ filter: { role: 'member' } });
      expect(othersParams).toEqual({});
    });

    it('should allow general merger to return different params based on action', () => {
      manager.addGeneralParams((resource, action) => {
        if (action === 'list') {
          return { filter: { deleted: false } };
        }
        if (action === 'get') {
          return { fields: ['id', 'name'] };
        }
        return {};
      });

      const listParams = manager.getParams('posts', 'list');
      const getParams = manager.getParams('posts', 'get');
      const createParams = manager.getParams('posts', 'create');

      expect(listParams).toEqual({ filter: { deleted: false } });
      expect(getParams).toEqual({ fields: ['id', 'name'] });
      expect(createParams).toEqual({});
    });

    it('should apply general mergers before specific params', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { status: 'active' },
      }));

      manager.addParams('posts', 'list', () => ({
        filter: { featured: true },
      }));

      const params = manager.getParams('posts', 'list');

      expect(params).toEqual({
        filter: {
          $and: [{ status: 'active' }, { featured: true }],
        },
      });
    });

    it('should apply general mergers before extra params', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { status: 'active' },
      }));

      const params = manager.getParams('posts', 'list', {
        filter: { userId: 1 },
      });

      expect(params).toEqual({
        filter: {
          $and: [{ status: 'active' }, { userId: 1 }],
        },
      });
    });

    it('should apply all mergers in correct order: general -> specific -> extra', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { deleted: false },
      }));

      manager.addParams('posts', 'list', () => ({
        filter: { status: 'published' },
      }));

      const params = manager.getParams('posts', 'list', {
        filter: { userId: 1 },
      });
      expect(params).toEqual({
        filter: {
          $and: [
            {
              $and: [{ deleted: false }, { status: 'published' }],
            },
            { userId: 1 },
          ],
        },
      });
    });

    it('should handle multiple general mergers with different param types', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { status: 'active' },
      }));

      manager.addGeneralParams((resource, action) => ({
        fields: ['id', 'name'],
      }));

      manager.addGeneralParams((resource, action) => ({
        sort: ['createdAt'],
      }));

      const params = manager.getParams('posts', 'list');

      expect(params).toEqual({
        filter: { status: 'active' },
        fields: ['id', 'name'],
        sort: ['createdAt'],
      });
    });

    it('should allow general merger to return empty object', () => {
      manager.addGeneralParams((resource, action) => ({}));

      const params = manager.getParams('posts', 'list');

      expect(params).toEqual({});
    });

    it('should handle complex merge scenarios with general mergers', () => {
      manager.addGeneralParams((resource, action) => ({
        filter: { deleted: false },
        fields: ['id', 'name', 'email'],
        appends: ['profile'],
      }));

      manager.addParams('users', 'list', () => ({
        filter: { role: 'admin' },
        fields: ['id', 'name'], // intersect with general
        appends: ['roles'], // union with general
      }));

      const params = manager.getParams('users', 'list', {
        filter: { status: 'active' },
        except: ['password'], // union (new field)
      });

      expect(params).toEqual({
        filter: {
          $and: [
            {
              $and: [{ deleted: false }, { role: 'admin' }],
            },
            { status: 'active' },
          ],
        },
        fields: ['id', 'name'], // intersect result
        appends: ['profile', 'roles'], // union result
        except: ['password'],
      });
    });
  });
});
