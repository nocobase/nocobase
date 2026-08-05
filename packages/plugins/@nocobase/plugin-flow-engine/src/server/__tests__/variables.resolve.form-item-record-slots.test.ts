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

type ResolveResult = Record<string, unknown>;

describe('variables:resolve persisted Form and item Record slots', () => {
  let app: MockServer;
  const leafUid = 'form-item-record-slots-leaf';
  const session = (() => {
    const signInTime = 'form-item-record-slots';
    const payload = Buffer.from(JSON.stringify({ userId: 1, signInTime })).toString('base64url');
    return {
      rd: generateFlowModelRd(leafUid, `1:${signInTime}`),
      token: `test.${payload}.sig`,
    };
  })();
  const template = {
    currentRole: '{{ ctx.item.value.roles.name }}',
    formRole: '{{ ctx.formValues.roles.name }}',
    grandRole: '{{ ctx.item.parentItem.parentItem.value.roles.name }}',
    parentUser: '{{ ctx.item.parentItem.value.users.nickname }}',
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

  beforeAll(async () => {
    resetVariablesRegistryForTest();
    app = await createFlowEngineMockServer({
      plugins: ['error-handler', 'auth', 'users', 'acl', 'data-source-manager', 'field-sort', 'flow-engine'],
    });
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: 'form-item-record-slots-form',
      use: 'CustomFormProvider',
      stepParams: { resourceSettings: { init: { collectionName: 'users', dataSourceKey: 'main' } } },
      subModels: {
        grid: {
          uid: 'form-item-record-slots-grid',
          use: 'CustomFormGrid',
          subModels: {
            items: [
              {
                uid: 'form-item-record-slots-roles',
                use: 'CustomSubtableField',
                stepParams: {
                  fieldSettings: { init: { collectionName: 'users', dataSourceKey: 'main', fieldPath: 'roles' } },
                },
                subModels: {
                  grid: {
                    uid: 'form-item-record-slots-roles-grid',
                    use: 'CustomSubtableGrid',
                    subModels: {
                      items: [
                        {
                          uid: 'form-item-record-slots-users',
                          use: 'CustomPopupField',
                          stepParams: {
                            fieldSettings: {
                              init: { collectionName: 'roles', dataSourceKey: 'main', fieldPath: 'users' },
                            },
                          },
                          subModels: {
                            popup: {
                              uid: leafUid,
                              use: 'CustomPopupItem',
                              props: template,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('resolves Form, current item, and recursive parent item slots through persisted provenance', async () => {
    const response = await execResolve({
      contextParams: {
        'formValues.roles': { collection: 'roles', fields: ['name'], filterByTk: 'root' },
        'item.parentItem.parentItem.value.roles': { collection: 'roles', fields: ['name'], filterByTk: 'root' },
        'item.parentItem.value.users': { collection: 'users', fields: ['nickname'], filterByTk: 1 },
        'item.value.roles': { collection: 'roles', fields: ['name'], filterByTk: 'root' },
      },
      rd: session.rd,
      template,
    });

    expect(response).toEqual({
      currentRole: 'root',
      formRole: 'root',
      grandRole: 'root',
      parentUser: expect.any(String),
    });
  });

  it('does not query when descriptors are moved below the proven slots', async () => {
    const rolesFindOne = vi.spyOn(app.db.getRepository('roles'), 'findOne');
    try {
      const response = await execResolve({
        contextParams: {
          'formValues.roles.name': { collection: 'roles', filterByTk: 'root' },
          'item.value.roles.name': { collection: 'roles', filterByTk: 'root' },
        },
        rd: session.rd,
        template: {
          currentRole: template.currentRole,
          formRole: template.formRole,
        },
      });

      expect(response).toEqual({ currentRole: template.currentRole, formRole: template.formRole });
      expect(rolesFindOne).not.toHaveBeenCalled();
    } finally {
      rolesFindOne.mockRestore();
    }
  });
});
