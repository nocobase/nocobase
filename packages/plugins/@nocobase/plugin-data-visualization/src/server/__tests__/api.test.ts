/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Repository } from '@nocobase/database';
import { FlowModelRepository } from '@nocobase/plugin-flow-engine';
import { MockServer, createMockServer } from '@nocobase/test';
import { generateFlowModelRdFromToken } from '@nocobase/utils';
import { vi } from 'vitest';
import { queryData } from '../actions/query';

describe('api', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let memberToken: string;
  let rootToken: string;
  let designerToken: string;
  let limitedToken: string;

  const insertChartModel = async (uid: string, template: unknown) => {
    const repository = db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({ uid, use: 'ChartBlockModel', props: template });
  };

  const requestChart = (token: string, role: string, values: Record<string, unknown>) =>
    app
      .agent()
      .post('/charts:queryData')
      .set({ Authorization: `Bearer ${token}`, 'X-Authenticator': 'basic', 'X-Role': role })
      .send(values);

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'flow-engine',
        'system-settings',
        'data-visualization',
      ],
    });
    db = app.db;

    db.collection({
      name: 'chart_test',
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
        {
          type: 'double',
          name: 'price',
        },
        {
          type: 'bigInt',
          name: 'count',
        },
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'date',
          name: 'createdAt',
        },
      ],
    });
    await db.sync();
    repo = db.getRepository('chart_test');
    await repo.create({
      values: [
        { id: 1, price: 1, count: 1, title: 'title1', createdAt: '2023-02-02' },
        { id: 2, price: 2, count: 2, title: 'title2', createdAt: '2023-01-01' },
      ],
    });

    await db.getRepository('roles').update({
      filterByTk: 'member',
      values: { strategy: { actions: ['view'] } },
    });
    await db.getRepository('roles').create({
      values: {
        name: 'chart-designer',
        allowConfigure: true,
        strategy: { actions: ['view'] },
      },
    });
    await db.getRepository('roles').create({
      values: {
        name: 'chart-limited',
        strategy: { actions: ['view'] },
      },
    });
    for (const roleName of ['member', 'chart-designer']) {
      const role = app.acl.getRole(roleName) || app.acl.define({ role: roleName });
      role.grantAction('chart_test:view', {});
    }
    const limitedRole = app.acl.getRole('chart-limited') || app.acl.define({ role: 'chart-limited' });
    limitedRole.grantAction('chart_test:view', {
      fields: ['id', 'price', 'title'],
      filter: { id: { $eq: 1 } },
    });
    const users = db.getRepository('users');
    const root = await users.findOne();
    const member = await users.create({ values: { nickname: 'Chart member', roles: ['member'] } });
    const designer = await users.create({ values: { nickname: 'Chart designer', roles: ['chart-designer'] } });
    const limited = await users.create({ values: { nickname: 'Chart limited', roles: ['chart-limited'] } });

    rootToken = await app.authManager.jwt.sign({ userId: root.id, roleName: 'root', signInTime: 'chart-root' });
    memberToken = await app.authManager.jwt.sign({
      userId: member.id,
      roleName: 'member',
      signInTime: 'chart-member',
    });
    designerToken = await app.authManager.jwt.sign({
      userId: designer.id,
      roleName: 'chart-designer',
      signInTime: 'chart-designer',
    });
    limitedToken = await app.authManager.jwt.sign({
      userId: limited.id,
      roleName: 'chart-limited',
      signInTime: 'chart-limited',
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  test('query', async () => {
    const ctx = {
      app,
      db,
      action: {
        params: {
          values: {
            collection: 'chart_test',
            measures: [
              {
                field: ['price'],
                alias: 'Price',
              },
              {
                field: ['count'],
                alias: 'Count',
              },
            ],
            dimensions: [
              {
                field: ['title'],
                alias: 'Title',
              },
            ],
          },
        },
      },
    } as any;
    ctx.get = () => '';
    await queryData(ctx, async () => {});
    expect(ctx.body).toBeDefined();
  });

  test('query with sort', async () => {
    const ctx = {
      app,
      db,
      action: {
        params: {
          values: {
            collection: 'chart_test',
            measures: [
              {
                field: ['price'],
                aggregation: 'sum',
                alias: 'Price',
              },
            ],
            dimensions: [
              {
                field: ['title'],
                alias: 'Title',
              },
              {
                field: ['createdAt'],
                format: 'YYYY-MM',
              },
            ],
            orders: [{ field: 'createdAt', order: 'asc' }],
          },
        },
      },
    } as any;
    ctx.get = () => '';
    await queryData(ctx, async () => {});
    expect(ctx.body).toBeDefined();
    expect(ctx.body).toMatchObject([{ createdAt: '2023-01' }, { createdAt: '2023-02' }]);
  });

  test('resolves persisted Chart variables through the registered endpoint', async () => {
    const uid = 'chart-production-variables';
    const filter = {
      $or: [
        { id: { $eq: '{{ ctx.view.record.id }}' } },
        { id: { $eq: '{{ ctx.popup.record.id }}' } },
        { id: { $eq: '{{ ctx.user.id }}' } },
      ],
    };
    await insertChartModel(uid, { filter });

    const response = await requestChart(memberToken, 'member', {
      collection: 'chart_test',
      contextParams: {
        'popup.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 2 },
        'view.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
      },
      dataSource: 'main',
      dimensions: [{ alias: 'Title', field: ['title'] }],
      filter,
      measures: [{ alias: 'Price', field: ['price'] }],
      mode: 'builder',
      rd: generateFlowModelRdFromToken(uid, memberToken),
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.map((row: { Title: string }) => row.Title).sort()).toEqual(['title1', 'title2']);
  });

  test('supports explicit legacy 1.x builder requests without rd', async () => {
    const response = await requestChart(memberToken, 'member', {
      collection: 'chart_test',
      dataSource: 'main',
      dimensions: [{ alias: 'Title', field: ['title'] }],
      measures: [{ alias: 'Price', field: ['price'] }],
      mode: 'builder',
      variableResolution: 'legacy-schema',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.map((row: { Title: string }) => row.Title).sort()).toEqual(['title1', 'title2']);
  });

  test('keeps row-level ACL filters in the explicit legacy lane', async () => {
    const response = await requestChart(limitedToken, 'chart-limited', {
      collection: 'chart_test',
      dataSource: 'main',
      dimensions: [{ alias: 'Title', field: ['title'] }],
      measures: [{ alias: 'Price', field: ['price'] }],
      mode: 'builder',
      variableResolution: 'legacy-schema',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual([expect.objectContaining({ Title: 'title1' })]);
  });

  test('keeps the legacy lane closed to Record descriptors and ctx paths', async () => {
    const query = vi.spyOn(repo, 'query');
    const base = {
      collection: 'chart_test',
      dataSource: 'main',
      dimensions: [{ alias: 'Title', field: ['title'] }],
      measures: [{ alias: 'Price', field: ['price'] }],
      mode: 'builder',
      variableResolution: 'legacy-schema',
    };

    const withRecord = await requestChart(memberToken, 'member', {
      ...base,
      contextParams: { 'view.record': { collection: 'chart_test', filterByTk: 1 } },
    });
    const withCtxPath = await requestChart(memberToken, 'member', {
      ...base,
      filter: { id: { $eq: '{{ ctx.user.id }}' } },
    });

    expect(withRecord.body.data).toEqual([]);
    expect(withCtxPath.body.data).toEqual([]);
    expect(query).not.toHaveBeenCalled();
    query.mockRestore();
  });

  test('fails closed when resolved record data contains an unsupported second-stage template', async () => {
    const uid = 'chart-secondary-unsupported-template';
    const filter = { title: { $eq: '{{ ctx.view.record.title }}' } };
    await insertChartModel(uid, { filter });
    await repo.update({ filterByTk: 1, values: { title: '{{ ctx.other() }}' } });
    const query = vi.spyOn(repo, 'query');

    try {
      const response = await requestChart(memberToken, 'member', {
        collection: 'chart_test',
        contextParams: {
          'view.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
        },
        dataSource: 'main',
        dimensions: [{ alias: 'Title', field: ['title'] }],
        filter,
        measures: [{ alias: 'Price', field: ['price'] }],
        mode: 'builder',
        rd: generateFlowModelRdFromToken(uid, memberToken),
      });

      expect(response.body.data).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    } finally {
      query.mockRestore();
      await repo.update({ filterByTk: 1, values: { title: 'title1' } });
    }
  });

  test.each([
    ['root', 'root', () => rootToken],
    ['allowConfigure', 'chart-designer', () => designerToken],
  ])('requires a valid model-bound rd in the %s lane', async (_lane, role, getToken) => {
    const uid = `chart-configure-${_lane}`;
    const filter = { id: { $eq: '{{ ctx.view.record.id }}' } };
    await insertChartModel(uid, { filter });
    const token = getToken();
    const query = vi.spyOn(repo, 'query');
    const values = {
      collection: 'chart_test',
      contextParams: {
        'view.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
      },
      dataSource: 'main',
      dimensions: [{ alias: 'Id', field: ['id'] }],
      filter,
      measures: [{ alias: 'Price', field: ['price'] }],
      mode: 'builder',
    };

    const valid = await requestChart(token, role, {
      ...values,
      rd: generateFlowModelRdFromToken(uid, token),
    });
    const callsAfterValid = query.mock.calls.length;
    const missing = await requestChart(token, role, values);
    const invalid = await requestChart(token, role, { ...values, rd: 'invalid-rd' });

    expect(valid.body.data).toEqual([expect.objectContaining({ Id: 1 })]);
    expect(missing.body.data).toEqual([]);
    expect(invalid.body.data).toEqual([]);
    expect(query).toHaveBeenCalledTimes(callsAfterValid);
    query.mockRestore();
  });

  test('rejects tampered paths, moved descriptors, cross-session rd, and unregistered chart.record', async () => {
    const uid = 'chart-rejected-requests';
    const allowedFilter = { id: { $eq: '{{ ctx.view.record.id }}' } };
    await insertChartModel(uid, { filter: allowedFilter });
    const query = vi.spyOn(repo, 'query');
    const base = {
      collection: 'chart_test',
      dataSource: 'main',
      dimensions: [{ alias: 'Id', field: ['id'] }],
      measures: [{ alias: 'Price', field: ['price'] }],
      mode: 'builder',
      rd: generateFlowModelRdFromToken(uid, memberToken),
    };
    const rejected = [
      {
        ...base,
        contextParams: {
          'view.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
        },
        filter: { title: { $eq: '{{ ctx.view.record.title }}' } },
      },
      {
        ...base,
        contextParams: {
          'view.record.id': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
        },
        filter: allowedFilter,
      },
      {
        ...base,
        contextParams: {
          'view.record': { collection: 'chart_test', dataSourceKey: 'main', fields: 'id', filterByTk: 1 },
        },
        filter: allowedFilter,
      },
      {
        ...base,
        contextParams: {
          'view.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
        },
        rd: generateFlowModelRdFromToken(uid, rootToken),
        filter: allowedFilter,
      },
      {
        ...base,
        contextParams: {
          'chart.record': { collection: 'chart_test', dataSourceKey: 'main', filterByTk: 1 },
        },
        filter: { id: { $eq: '{{ ctx.chart.record.id }}' } },
      },
    ];

    for (const values of rejected) {
      const response = await requestChart(memberToken, 'member', values);
      expect(response.body.data).toEqual([]);
    }
    expect(query).not.toHaveBeenCalled();
    query.mockRestore();
  });
});
