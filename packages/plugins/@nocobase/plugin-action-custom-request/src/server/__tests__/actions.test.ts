/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent: ReturnType<MockServer['agent']>;
  let resource: ReturnType<ReturnType<MockServer['agent']>['resource']>;

  beforeAll(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'action-custom-request',
        'data-source-manager',
        'ui-schema-storage',
        'system-settings',
      ],
    });
    db = app.db;
    repo = db.getRepository('customRequests');
    agent = app.agent();
    resource = (agent.set('X-Role', 'admin') as any).resource('customRequests');
    await agent.login(1);
  });

  describe('send', () => {
    let params = null;
    beforeAll(async () => {
      app.resourcer.getResource('customRequests').addAction('test', (ctx: Context) => {
        params = ctx.action.params.values;
        return ctx.action.params.values;
      });
      await repo.create({
        values: {
          key: 'test',
          options: {
            url: '/customRequests:test',
            method: 'GET',
            data: {
              username: '{{ currentRecord.username }}',
            },
          },
        },
      });
    });

    test('basic', async () => {
      const res = await resource.send({
        filterByTk: 'test',
      });
      expect(res.status).toBe(200);
      expect(params).toMatchObject({});
    });

    test('currentRecord.data', async () => {
      const res = await resource.send({
        filterByTk: 'test',
        values: {
          currentRecord: {
            data: {
              username: 'testname',
            },
          },
        },
      });
      expect(res.status).toBe(200);
      expect(params).toMatchSnapshot();
    });

    test('parse o2m variables correctly', async () => {
      await repo.create({
        values: {
          key: 'o2m',
          options: {
            url: '/customRequests:test',
            method: 'GET',
            data: {
              o2m: '{{ currentRecord.o2m.id }}',
            },
          },
        },
      });

      const res = await resource.send({
        filterByTk: 'o2m',
        values: {
          currentRecord: {
            data: {
              o2m: [
                {
                  id: 1,
                },
                {
                  id: 2,
                },
              ],
            },
          },
        },
      });
      expect(res.status).toBe(200);
      expect(params).toMatchObject({
        o2m: [1, 2],
      });
    });

    test('currentRecord.id with collectionName works fine', async () => {
      await repo.create({
        values: {
          key: 'test2',
          options: {
            method: 'GET',
            headers: [],
            params: [{ name: 'userId', value: '{{currentRecord.id}}' }],
            url: '/users:get',
            collectionName: 'users',
            data: null,
          },
        },
      });

      const userId = 1;
      const res = await resource.send({
        filterByTk: 'test2',
        values: {
          currentRecord: {
            id: userId,
          },
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(userId);
    });

    test('currentUser with association data', async () => {
      await repo.create({
        values: {
          key: 'currentUser-with-association-data',
          options: {
            method: 'POST',
            headers: [],
            data: {
              a: '{{currentUser.roles.name}}',
              b: '{{currentUser.roles.title}}',
              c: '{{currentUser.roles.rolesUsers.userId}}',
            },
            url: '/customRequests:test',
          },
        },
      });

      const res = await resource.send({
        filterByTk: 'currentUser-with-association-data',
      });
      expect(res.status).toBe(200);
      expect(expect.arrayContaining(params.a)).toMatchObject(['root', 'member', 'admin']);
      expect(expect.arrayContaining(params.b)).toMatchObject(['{{t("Member")}}', '{{t("Root")}}', '{{t("Admin")}}']);
      expect(expect.arrayContaining(params.c)).toMatchObject([1, 1, 1]);
    });
  });
});
