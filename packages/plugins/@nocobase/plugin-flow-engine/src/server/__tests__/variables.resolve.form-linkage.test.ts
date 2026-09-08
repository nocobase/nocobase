/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer } from '@nocobase/test';
import { generateFlowModelRdFromToken } from '@nocobase/utils';
import {
  MAX_RUNJS_SOURCES_PER_REQUEST,
  MAX_RUNJS_SOURCE_LENGTH,
  MAX_RUNJS_TOTAL_SOURCE_LENGTH,
} from '../flow-surfaces/runjs-authoring/runtime/constants';
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
  let memberToken: string;
  let rootToken: string;
  const formUid = 'popup-edit-form';
  const configured = '{{ ctx.popup.record.staffseq }}';
  const unconfigured = '{{ ctx.popup.record.staffname }}';

  beforeAll(async () => {
    resetVariablesRegistryForTest();
    app = await createFlowEngineMockServer({
      acl: true,
      resourcer: { prefix: '/api' },
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
    const root = await app.db.getRepository('users').findOne({ filter: { 'roles.name': 'root' } });
    const member = await app.db
      .getRepository('users')
      .create({ values: { nickname: 'linkage-member', roles: ['member'] } });
    rootToken = await app.authManager.jwt.sign({ userId: root.id, roleName: 'root', signInTime: 'linkage-root' });
    memberToken = await app.authManager.jwt.sign({
      userId: member.id,
      roleName: 'member',
      signInTime: 'linkage-member',
    });
    expect(app.acl.getRole('member').getStrategy().allowConfigure).not.toBe(true);
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
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: 'popup_staff',
            dataSourceKey: 'main',
            filterByTk: '{{ ctx.popup.record.id }}',
          },
        },
      },
      subModels: {
        grid: {
          uid: `${formUid}-grid`,
          use: 'FormGridModel',
          variableContractType: { type: 'formGrid', use: 'FormGridModel' },
        },
      },
    });
    await repository.insertModel({
      uid: 'form-event-reference',
      use: 'ReferenceBlockModel',
      stepParams: {
        referenceSettings: { target: { targetUid: formUid } },
        instanceEvent: { configure: { value: '{{ ctx.popup.record.staffname }}' } },
      },
    });
    const grid = await repository.findModelById(`${formUid}-grid`);
    const saved = await app
      .agent()
      .post('/api/flowModels:save')
      .auth(rootToken, { type: 'bearer' })
      .set('X-Authenticator', 'basic')
      .set('X-Role', 'root')
      .send({ ...grid, stepParams: { eventSettings: { linkageRules: linkageRules(configured) } } });
    expect(saved.status).toBe(200);

    for (const legacy of [false, true]) {
      const hostUid = legacy ? 'legacy-reference-form' : 'reference-form';
      const targetUid = `${hostUid}-template`;
      const rules = { eventSettings: { linkageRules: linkageRules(configured) } };
      await repository.insertModel({
        uid: targetUid,
        use: 'EditFormModel',
        stepParams: legacy ? rules : {},
        subModels: {
          grid: { uid: `${targetUid}-grid`, use: 'FormGridModel', stepParams: legacy ? {} : rules },
        },
      });
      await repository.insertModel({
        uid: hostUid,
        use: 'EditFormModel',
        subModels: {
          grid: {
            uid: `${hostUid}-grid`,
            use: 'ReferenceFormGridModel',
            stepParams: {
              referenceSettings: {
                useTemplate: { templateUid: `${hostUid}-template-id`, targetUid, targetPath: 'subModels.grid' },
              },
            },
          },
        },
      });
    }
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it.each([formUid, 'reference-form', 'legacy-reference-form'])(
    'resolves configured popup fields for member from %s without allowing unconfigured fields',
    async (modelUid) => {
      const response = await app
        .agent()
        .post('/api/variables:resolve')
        .auth(memberToken, { type: 'bearer' })
        .set('X-Authenticator', 'basic')
        .set('X-Role', 'member')
        .send({
          values: {
            batch: [configured, unconfigured].map((value, id) => ({
              id,
              rd: generateFlowModelRdFromToken(modelUid, memberToken),
              template: linkageRules(value),
              contextParams: {
                'popup.record': { collection: 'popup_staff', dataSourceKey: 'main', filterByTk: String(filterByTk) },
              },
            })),
          },
        });
      expect(response.status).toBe(200);

      expect(response.body.data).toEqual({
        results: [
          { id: 0, data: linkageRules('STAFF-001') },
          { id: 1, data: linkageRules(unconfigured) },
        ],
      });
    },
  );

  it.each(['option', 'events'])('resolves member variables in a saved 70 KiB chart %s script', async (source) => {
    const modelUid = 'large-chart-' + source;
    const independent = '{{ ctx.popup.record.id }}';
    const code = ('// ' + unconfigured + "\nconst value = '" + configured + "';").padEnd(70 * 1024);
    const saved = await app
      .agent()
      .post('/api/flowModels:save')
      .auth(rootToken, { type: 'bearer' })
      .set('X-Authenticator', 'basic')
      .set('X-Role', 'root')
      .send({
        uid: modelUid,
        use: 'ChartBlockModel',
        props: { value: independent },
        stepParams: { chartSettings: { configure: { chart: { [source]: { raw: code } } } } },
      });
    expect(saved.status).toBe(200);

    const response = await app
      .agent()
      .post('/api/variables:resolve')
      .auth(memberToken, { type: 'bearer' })
      .set('X-Authenticator', 'basic')
      .set('X-Role', 'member')
      .send({
        values: {
          batch: [independent, configured, unconfigured].map((template, id) => ({
            id,
            rd: generateFlowModelRdFromToken(modelUid, memberToken),
            template,
            contextParams: {
              'popup.record': { collection: 'popup_staff', dataSourceKey: 'main', filterByTk: String(filterByTk) },
            },
          })),
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.results).toEqual([
      { id: 0, data: filterByTk },
      { id: 1, data: 'STAFF-001' },
      { id: 2, data: unconfigured },
    ]);
  });

  it.each([
    ['single-source', 1, MAX_RUNJS_SOURCE_LENGTH + 1],
    ['source-count', MAX_RUNJS_SOURCES_PER_REQUEST + 1, 100],
    ['total-length', 5, Math.floor(MAX_RUNJS_TOTAL_SOURCE_LENGTH / 5) + 1],
  ])(
    'resolves independent member variables when saved event scripts exceed the %s AST budget',
    async (name, count, length) => {
      const modelUid = 'event-budget-' + name;
      const independent = '{{ ctx.popup.record.id }}';
      const code = ("const value = '" + unconfigured + "';").padEnd(length);
      const steps = Object.fromEntries(
        Array.from({ length: count }, (_, index) => [
          'script' + index,
          { use: 'runjs', defaultParams: { code, version: 'v2' } },
        ]),
      );
      const saved = await app
        .agent()
        .post('/api/flowModels:save')
        .auth(rootToken, { type: 'bearer' })
        .set('X-Authenticator', 'basic')
        .set('X-Role', 'root')
        .send({
          uid: modelUid,
          use: 'EditFormModel',
          flowRegistry: { custom: { on: { eventName: 'beforeRender' }, steps } },
          stepParams: {
            resourceSettings: {
              init: { collectionName: 'popup_staff', dataSourceKey: 'main', filterByTk: independent },
            },
          },
        });
      expect(saved.status).toBe(200);

      const response = await app
        .agent()
        .post('/api/variables:resolve')
        .auth(memberToken, { type: 'bearer' })
        .set('X-Authenticator', 'basic')
        .set('X-Role', 'member')
        .send({
          values: {
            batch: [independent, unconfigured].map((template, id) => ({
              id,
              rd: generateFlowModelRdFromToken(modelUid, memberToken),
              template,
              contextParams: {
                'popup.record': { collection: 'popup_staff', dataSourceKey: 'main', filterByTk: String(filterByTk) },
              },
            })),
          },
        });
      expect(response.status).toBe(200);
      expect(response.body.data.results).toEqual([
        { id: 0, data: filterByTk },
        { id: 1, data: unconfigured },
      ]);
    },
  );

  it('keeps administrator popup resolution working through HTTP', async () => {
    const response = await app
      .agent()
      .post('/api/variables:resolve')
      .auth(rootToken, { type: 'bearer' })
      .set('X-Authenticator', 'basic')
      .set('X-Role', 'root')
      .send({
        values: {
          batch: [
            {
              id: 'root',
              rd: generateFlowModelRdFromToken(formUid, rootToken),
              template: linkageRules(configured),
              contextParams: {
                'popup.record': { collection: 'popup_staff', dataSourceKey: 'main', filterByTk: String(filterByTk) },
              },
            },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.results).toEqual([{ id: 'root', data: linkageRules('STAFF-001') }]);
  });

  it('preserves both instance and target form variables in forwarded reference events', async () => {
    const template = {
      instance: '{{ ctx.popup.record.staffname }}',
      form: '{{ ctx.popup.record.id }}',
      grid: '{{ ctx.popup.record.staffseq }}',
    };
    const response = await app
      .agent()
      .post('/api/variables:resolve')
      .auth(memberToken, { type: 'bearer' })
      .set('X-Authenticator', 'basic')
      .set('X-Role', 'member')
      .send({
        values: {
          batch: [
            {
              id: 'reference',
              rd: generateFlowModelRdFromToken(formUid, memberToken),
              contractRd: generateFlowModelRdFromToken('form-event-reference', memberToken),
              template,
              contextParams: {
                'popup.record': { collection: 'popup_staff', dataSourceKey: 'main', filterByTk: String(filterByTk) },
              },
            },
          ],
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.results).toEqual([
      {
        id: 'reference',
        data: {
          instance: 'Example',
          form: filterByTk,
          grid: 'STAFF-001',
        },
      },
    ]);
  });
});
