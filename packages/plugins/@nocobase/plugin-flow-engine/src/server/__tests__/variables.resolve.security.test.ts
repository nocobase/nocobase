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
import FlowModelRepository from '../repository';
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

  const formModel = (uid: string, template: unknown, configuredFields = ['roles']) => ({
    uid,
    use: 'EditFormModel',
    stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
    subModels: {
      grid: {
        uid: `${uid}-grid`,
        use: 'FormGridModel',
        subModels: {
          items: configuredFields.map((fieldPath) => ({
            uid: `${uid}-${fieldPath}`,
            use: 'FormItemModel',
            stepParams: { fieldSettings: { init: { fieldPath } } },
          })),
        },
      },
    },
    props: template,
  });

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

  it('blocks a configured association path from a wide root provider while keeping legal siblings', async () => {
    const uid = 'record-projection-single';
    const template = { id: '{{ ctx.formValues.id }}', role: '{{ ctx.formValues.roles.title }}' };
    await insertFlowModel(formModel(uid, template));

    const users = app.db.getRepository('users');
    const wide = await users.findOne({ appends: ['roles'], filterByTk: 1 });
    expect(wide?.toJSON?.()).toHaveProperty('roles');

    const attack = await execResolve({
      contextParams: {
        formValues: { appends: ['roles'], collection: 'users', fields: ['id'], filterByTk: 1 },
      },
      rd: session.rd(uid),
      template,
    });

    expect(attack).toEqual({ id: 1, role: template.role });

    const legal = await execResolve({
      contextParams: {
        formValues: { collection: 'users', filterByTk: 1 },
        'formValues.roles': { collection: 'roles', filterByTk: 'root' },
      },
      rd: session.rd(uid),
      template,
    });

    expect(legal.id).toBe(1);
    expect(legal.role).not.toBe(template.role);
  });

  it('projects each binding after batch prefetch fills a full-record cache', async () => {
    const wholeUid = 'record-projection-full-cache';
    const formUid = 'record-projection-batch';
    const formTemplate = { id: '{{ ctx.formValues.id }}', nickname: '{{ ctx.formValues.nickname }}' };
    await insertFlowModel({ uid: wholeUid, use: 'DetailsBlockModel', props: '{{ ctx.view.record }}' });
    await insertFlowModel(formModel(formUid, formTemplate, ['nickname']));

    const usersFindOne = vi.spyOn(app.db.getRepository('users'), 'findOne');
    const response = await execResolve({
      batch: [
        {
          contextParams: { 'view.record': { collection: 'users', filterByTk: 1 } },
          id: 'full',
          rd: session.rd(wholeUid),
          template: { value: '{{ ctx.view.record }}' },
        },
        {
          contextParams: { formValues: { collection: 'users', filterByTk: 1 } },
          id: 'projected',
          rd: session.rd(formUid),
          template: formTemplate,
        },
      ],
    });

    expect(response.results?.[0].data.value).toHaveProperty('nickname');
    expect(response.results?.[1]).toEqual({
      id: 'projected',
      data: { id: 1, nickname: formTemplate.nickname },
    });
    expect(usersFindOne).toHaveBeenCalledTimes(1);
  });
});
