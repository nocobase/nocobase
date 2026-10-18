/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { MockServer } from '@nocobase/test';
import { generateFlowModelRd } from '@nocobase/utils';
import { vi } from 'vitest';
import { Liquid } from 'liquidjs';
import FlowModelRepository from '../repository';
import { getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';

type ResolveResult = {
  data?: Record<string, unknown>;
  results?: Array<{ data: Record<string, unknown>; id: string }>;
};

describe('variables:resolve record slot projection security', () => {
  let app: MockServer;
  const session = (() => {
    const signInTime = 'variables-resolve-security-1';
    const payload = Buffer.from(JSON.stringify({ userId: 1, signInTime })).toString('base64url');
    return {
      rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `1:${signInTime}`),
      token: `test.${payload}.sig`,
    };
  })();

  const insertFlowModel = async (model: Record<string, unknown>) => {
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel(model);
  };

  const execResolve = async (values: Record<string, unknown>) => {
    const action = app.resourceManager.getAction('variables', 'resolve').clone();
    action.mergeParams({ values });
    const ctx = {
      action,
      app,
      auth: { role: 'member', user: { id: 1 } },
      db: app.db,
      get: (name: string) => (name.toLowerCase() === 'authorization' ? `Bearer ${session.token}` : undefined),
      getCurrentLocale: () => 'en-US',
      headers: { authorization: `Bearer ${session.token}` },
      request: { body: values, method: 'POST', path: '/api/variables:resolve', query: {} },
      state: { currentRole: 'member', currentRoles: ['member'] },
      throw: (status: number, body: unknown) => {
        throw Object.assign(new Error(String(body)), { body, status });
      },
    } as unknown as ResourcerContext & { body?: ResolveResult };

    await action.execute(ctx, async () => undefined);
    return ctx.body || {};
  };

  beforeEach(async () => {
    resetVariablesRegistryForTest();
    app = await createFlowEngineMockServer({
      plugins: ['error-handler', 'auth', 'users', 'acl', 'data-source-manager', 'field-sort', 'flow-engine'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('resolves Markdown loop associations for members without authorizing unrelated fields', async () => {
    const uid = 'markdown-loop-association';
    const content = '{% for role in ctx.record.roles %}{{ role.name }};{% endfor %}';
    await insertFlowModel({
      uid,
      use: 'MarkdownItemModel',
      stepParams: { markdownBlockSettings: { editMarkdown: { content } } },
    });
    const contextParams = { record: { collection: 'users', dataSourceKey: 'main', filterByTk: 1 } };
    const response = await execResolve({
      rd: session.rd(uid),
      contextParams,
      template: { record: { roles: '{{ctx.record.roles}}' } },
    });
    const user = await app.db.getRepository('users').findOne({ appends: ['roles'], filterByTk: 1 });
    const roles = user.get('roles') as Array<{ name: string }>;
    expect(roles.length).toBeGreaterThan(0);
    expect(await new Liquid().parseAndRender(content, { ctx: response })).toBe(
      roles.map((role) => `${role.name};`).join(''),
    );
    const unconfigured = { value: '{{ctx.record.nickname}}' };
    expect(await execResolve({ rd: session.rd(uid), contextParams, template: unconfigured })).toEqual(unconfigured);
  });

  it('resolves the reported Markdown template in a nested details model through the batch API', async () => {
    app.db.collection({
      name: 'markdownOrganizations',
      fields: [
        { name: 'orgname', type: 'string' },
        { name: 'userId', type: 'bigInt' },
      ],
    });
    app.db.collection({
      name: 'markdownUsers',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'org_o2m_tree', type: 'hasMany', target: 'markdownOrganizations', foreignKey: 'userId' },
      ],
    });
    await app.db.sync();
    await app.db.getRepository('markdownUsers').create({ values: { id: 1, name: 'Unconfigured value' } });
    await app.db.getRepository('markdownOrganizations').create({ values: { orgname: 'Company A', userId: 1 } });
    await app.db.getRepository('markdownOrganizations').create({ values: { orgname: 'Company B', userId: 1 } });

    const uid = 'nested-markdown-item';
    const content =
      '<div style="text-align: center; font-weight: bold; font-size: 20px;">\n' +
      '{% for item in ctx.record.org_o2m_tree%} {{ item.orgname }}：{{ item.orgname }}分 ' +
      '{% if forloop.first %}    <span style="color: #FF5722;">vs    </span> {% endif %}{% endfor %}\n\n\n';
    await insertFlowModel({
      uid: 'markdown-details',
      use: 'DetailsBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'markdownUsers' } } },
      subModels: {
        grid: {
          uid: 'markdown-details-grid',
          use: 'DetailsGridModel',
          subModels: {
            items: [
              {
                uid,
                use: 'MarkdownItemModel',
                stepParams: { markdownBlockSettings: { editMarkdown: { content } } },
              },
            ],
          },
        },
      },
    });
    const options = {
      rd: session.rd(uid),
      contextParams: { record: { collection: 'markdownUsers', dataSourceKey: 'main', filterByTk: 1 } },
    };
    const unconfigured = { record: { name: '{{ctx.record.name}}' } };
    const response = await execResolve({
      batch: [
        { ...options, id: 'configured', template: { record: { org_o2m_tree: '{{ctx.record.org_o2m_tree}}' } } },
        { ...options, id: 'unconfigured', template: unconfigured },
      ],
    });
    const configured = response.results?.find((result) => result.id === 'configured');
    expect(configured?.data).toMatchObject({
      record: {
        org_o2m_tree: expect.arrayContaining([
          expect.objectContaining({ orgname: 'Company A', userId: 1 }),
          expect.objectContaining({ orgname: 'Company B', userId: 1 }),
        ]),
      },
    });
    const rendered = await new Liquid().parseAndRender(content, { ctx: configured?.data });
    expect(rendered).toContain('Company A：Company A分');
    expect(rendered).toContain('Company B：Company B分');
    expect(rendered.match(/>vs /g)).toHaveLength(1);
    expect(response.results?.find((result) => result.id === 'unconfigured')?.data).toEqual(unconfigured);
  });

  it('blocks a moved Slot while resolving the descriptor in its exact Slot', async () => {
    const uid = 'record-projection-single';
    const template = { id: '{{ ctx.backend.record.id }}', role: '{{ ctx.backend.record.roles[0].title }}' };
    await insertFlowModel({ uid, use: 'DetailsBlockModel', props: template });
    getRecordSlotResolverRegistry(app).register({
      owner: 'test',
      id: 'backend-record',
      match: (path) => path.varName === 'backend' && path.runtimeSegments[0] === 'record',
      resolve: () => ({
        status: 'resolved',
        slot: ['record'],
      }),
    });

    const users = app.db.getRepository('users');
    const wide = await users.findOne({ appends: ['roles'], filterByTk: 1 });
    expect(wide?.toJSON?.()).toHaveProperty('roles');

    const attack = await execResolve({
      contextParams: {
        'backend.record.roles': { collection: 'roles', filterByTk: 'root' },
      },
      rd: session.rd(uid),
      template,
    });

    expect(attack).toEqual(template);

    const legal = await execResolve({
      contextParams: {
        'backend.record': { collection: 'users', dataSourceKey: 'main', filterByTk: 1 },
      },
      rd: session.rd(uid),
      template,
    });

    expect(legal.id).toBe(1);
    expect(legal.role).not.toBe(template.role);
  });

  it('projects each binding after batch prefetch fills a full-record cache', async () => {
    const wholeUid = 'record-projection-full-cache';
    const narrowUid = 'record-projection-batch';
    const narrowTemplate = { id: '{{ ctx.narrow.record.id }}', nickname: '{{ ctx.narrow.record.nickname }}' };
    await insertFlowModel({ uid: wholeUid, use: 'DetailsBlockModel', props: '{{ ctx.wide.record }}' });
    await insertFlowModel({ uid: narrowUid, use: 'DetailsBlockModel', props: narrowTemplate });
    const registry = getRecordSlotResolverRegistry(app);
    registry.register({
      owner: 'test',
      id: 'wide-record',
      match: (path) => path.varName === 'wide' && path.runtimeSegments[0] === 'record',
      resolve: () => ({ status: 'resolved', slot: ['record'] }),
    });
    registry.register({
      owner: 'test',
      id: 'narrow-record',
      match: (path) => path.varName === 'narrow',
      resolve: ({ path }) =>
        path.runtimeSegments[0] === 'record' && path.runtimeSegments[1] === 'id'
          ? { status: 'resolved', slot: ['record'] }
          : { status: 'abstain' },
    });

    const usersFindOne = vi.spyOn(app.db.getRepository('users'), 'findOne');
    const response = await execResolve({
      batch: [
        {
          contextParams: { 'wide.record': { collection: 'users', filterByTk: 1 } },
          id: 'full',
          rd: session.rd(wholeUid),
          template: { value: '{{ ctx.wide.record }}' },
        },
        {
          contextParams: { 'narrow.record': { collection: 'users', filterByTk: 1 } },
          id: 'projected',
          rd: session.rd(narrowUid),
          template: narrowTemplate,
        },
      ],
    });

    expect(response.results?.[0].data.value).toHaveProperty('nickname');
    expect(response.results?.[1]).toEqual({
      id: 'projected',
      data: { id: 1, nickname: narrowTemplate.nickname },
    });
    expect(usersFindOne).toHaveBeenCalledTimes(1);
  });
});
