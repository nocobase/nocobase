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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import FlowModelRepository from '../repository';
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';

type FieldConfig = string | { associationPathName: string; fieldPath: string };
type ResolveResult = {
  results?: Array<{ data: Record<string, unknown>; id: string }>;
} & Record<string, unknown>;

describe('variables:resolve persisted Form provider tree', () => {
  let app: MockServer;
  let childUserId: number;
  const childNickname = 'Provider Tree Exact Child';
  const session = (() => {
    const signInTime = 'variables-provider-tree-1';
    const payload = Buffer.from(JSON.stringify({ userId: 1, signInTime })).toString('base64url');
    return {
      rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `1:${signInTime}`),
      token: `test.${payload}.sig`,
    };
  })();

  const formModel = (uid: string, template: unknown, configuredFields: FieldConfig[]) => ({
    uid,
    use: 'CustomFormWithRecordProvider',
    stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
    subModels: {
      grid: {
        uid: `${uid}-grid`,
        use: 'CustomFormGrid',
        subModels: {
          items: configuredFields.map((field, index) => ({
            uid: `${uid}-field-${index}`,
            use: 'CustomFormField',
            stepParams: { fieldSettings: { init: typeof field === 'string' ? { fieldPath: field } : field } },
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

  const parentContext = () => ({
    fields: ['name'],
    appends: ['users'],
    collection: 'roles',
    filterByTk: 'root',
  });
  const childContext = () => ({ collection: 'users', fields: ['nickname'], filterByTk: childUserId });

  beforeAll(async () => {
    resetVariablesRegistryForTest();
    app = await createFlowEngineMockServer({
      plugins: ['error-handler', 'auth', 'users', 'acl', 'data-source-manager', 'field-sort', 'flow-engine'],
    });
    const child = await app.db.getRepository('users').create({
      values: { nickname: childNickname, username: 'provider-tree-exact-child' },
    });
    childUserId = (child.toJSON() as { id: number }).id;
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('resolves parent and child exact slots through the single action with one query per provider', async () => {
    const uid = 'provider-tree-single';
    const template = {
      wholeRole: '{{ ctx.formValues.roles }}',
      role: '{{ ctx.formValues.roles.name }}',
      user: '{{ ctx.formValues.roles.users.nickname }}',
    };
    await insertFlowModel(formModel(uid, template, ['roles', { associationPathName: 'roles', fieldPath: 'users' }]));
    const rolesFindOne = vi.spyOn(app.db.getRepository('roles'), 'findOne');
    const usersFindOne = vi.spyOn(app.db.getRepository('users'), 'findOne');

    try {
      const response = await execResolve({
        contextParams: {
          'formValues.roles': parentContext(),
          'formValues.roles.users': childContext(),
        },
        rd: session.rd(uid),
        template,
      });

      expect(response).toEqual({
        wholeRole: expect.objectContaining({ name: 'root' }),
        role: 'root',
        user: childNickname,
      });
      expect(rolesFindOne).toHaveBeenCalledTimes(1);
      expect(rolesFindOne).toHaveBeenCalledWith({ filterByTk: 'root', context: expect.anything() });
      expect(usersFindOne).toHaveBeenCalledTimes(1);
    } finally {
      rolesFindOne.mockRestore();
      usersFindOne.mockRestore();
    }
  });

  it('resolves root, parent, and child exact slots through the batch action without post-prefetch queries', async () => {
    const uid = 'provider-tree-batch';
    const template = {
      root: '{{ ctx.formValues.nickname }}',
      role: '{{ ctx.formValues.roles.name }}',
      user: '{{ ctx.formValues.roles.users.nickname }}',
    };
    const reverseTemplate = {
      user: '{{ ctx.formValues.roles.users.nickname }}',
      role: '{{ ctx.formValues.roles.name }}',
      root: '{{ ctx.formValues.nickname }}',
    };
    await insertFlowModel(formModel(uid, template, ['roles', { associationPathName: 'roles', fieldPath: 'users' }]));
    const rolesFindOne = vi.spyOn(app.db.getRepository('roles'), 'findOne');
    const usersFindOne = vi.spyOn(app.db.getRepository('users'), 'findOne');

    try {
      const response = await execResolve({
        batch: [
          {
            id: 'forward',
            contextParams: {
              formValues: { collection: 'users', fields: ['nickname'], filterByTk: 1 },
              'formValues.roles': parentContext(),
              'formValues.roles.users': childContext(),
            },
            rd: session.rd(uid),
            template,
          },
          {
            id: 'reverse',
            contextParams: Object.fromEntries(
              Object.entries({
                formValues: { collection: 'users', fields: ['nickname'], filterByTk: 1 },
                'formValues.roles': parentContext(),
                'formValues.roles.users': childContext(),
              }).reverse(),
            ),
            rd: session.rd(uid),
            template: reverseTemplate,
          },
        ],
      });
      const results = response.results || [];
      const forward = results.find((item) => item.id === 'forward')?.data;
      const reverse = results.find((item) => item.id === 'reverse')?.data;

      expect(forward).toEqual({ root: expect.any(String), role: 'root', user: childNickname });
      expect(reverse).toEqual({ root: forward?.root, role: 'root', user: childNickname });
      expect(rolesFindOne).toHaveBeenCalledTimes(1);
      expect(usersFindOne).toHaveBeenCalledTimes(2);
    } finally {
      rolesFindOne.mockRestore();
      usersFindOne.mockRestore();
    }
  });
});
