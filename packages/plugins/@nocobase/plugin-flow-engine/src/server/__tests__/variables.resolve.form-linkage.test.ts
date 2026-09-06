/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import type { MockServer } from '@nocobase/test';
import { generateFlowModelRd } from '@nocobase/utils';
import type FlowModelRepository from '../repository';
import { createFlowEngineMockServer, resetVariablesRegistryForTest } from './test-utils';

function linkageRules(value: string) {
  return {
    value: [
      {
        key: 'popup-linkage',
        title: 'Popup linkage',
        enable: true,
        condition: { logic: '$and', items: [] },
        actions: [
          {
            key: 'assign-field',
            name: 'linkageAssignField',
            params: {
              value: [
                {
                  key: 'staff-default',
                  enable: true,
                  mode: 'default',
                  condition: { logic: '$and', items: [] },
                  targetPath: 'staffname',
                  value,
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('variables:resolve form grid linkage rules', () => {
  let app: MockServer;
  let filterByTk: number;
  const formUid = 'popup-edit-form';
  const configured = '{{ ctx.popup.record.staffseq }}';
  const unconfigured = '{{ ctx.popup.record.staffname }}';

  beforeAll(async () => {
    resetVariablesRegistryForTest();
    app = await createFlowEngineMockServer({
      plugins: [
        'error-handler',
        'auth',
        'users',
        'acl',
        'data-source-manager',
        'data-source-main',
        'field-sort',
        'flow-engine',
      ],
    });
    app.db.collection({
      name: 'popup_staff',
      fields: [
        { name: 'staffseq', type: 'string' },
        { name: 'staffname', type: 'string' },
      ],
    });
    await app.db.sync();
    const record = await app.db.getRepository('popup_staff').create({
      values: { staffseq: 'STAFF-001', staffname: 'Example' },
    });
    filterByTk = record.get('id');
    const repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    await repository.insertModel({
      uid: formUid,
      use: 'EditFormModel',
      subModels: {
        grid: {
          uid: `${formUid}-grid`,
          use: 'FormGridModel',
          stepParams: { eventSettings: { linkageRules: linkageRules(configured) } },
        },
      },
    });
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('resolves configured popup fields for member without allowing unconfigured fields', async () => {
    const signInTime = 'form-linkage-test';
    const payload = Buffer.from(JSON.stringify({ userId: 1, signInTime })).toString('base64url');
    const token = `test.${payload}.sig`;
    const rd = generateFlowModelRd(formUid, `1:${signInTime}`);
    const values = {
      batch: [configured, unconfigured].map((value, id) => ({
        id,
        rd,
        template: linkageRules(value),
        contextParams: { 'popup.record': { collection: 'popup_staff', dataSourceKey: 'main', filterByTk } },
      })),
    };
    const action = app.resourceManager.getAction('variables', 'resolve').clone();
    action.mergeParams({ values });
    const ctx = {
      app,
      db: app.db,
      action,
      auth: { user: { id: 1 }, role: 'member' },
      state: { currentRole: 'member', currentRoles: ['member'] },
      get: (name: string) => (name.toLowerCase() === 'authorization' ? `Bearer ${token}` : ''),
      getCurrentLocale: () => 'en-US',
      request: { method: 'POST', path: '/api/variables:resolve', query: {}, body: values },
    } as unknown as ResourcerContext;

    await action.execute(ctx, async () => {});

    expect(ctx.body).toEqual({
      results: [
        { id: 0, data: linkageRules('STAFF-001') },
        { id: 1, data: linkageRules(unconfigured) },
      ],
    });
  });
});
