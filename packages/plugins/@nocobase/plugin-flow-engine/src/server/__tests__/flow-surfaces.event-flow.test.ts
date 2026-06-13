/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { compileApplySpec } from '../flow-surfaces/apply/compiler';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

type FlowSurfaceModelOptionsPatcher = {
  patchFlowSurfaceModelOptions(values: Record<string, unknown>): Promise<void>;
};

describe('flowSurfaces event flow', () => {
  let app: MockServer;
  let db: Database;
  let rootAgent: any;
  let service: FlowSurfacesService;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();
    db = app.db;
    service = new FlowSurfacesService(app.pm.get('flow-engine') as any);
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupEventFlowFixtureCollections(rootAgent, db);
  }, 120000);

  beforeEach(async () => {
    rootAgent = await loginFlowSurfacesRootAgent(app);
  });

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should expose event-flow meta with registry, capabilities, variables, step actions and fingerprint', async () => {
    const { formUid } = await createEmployeeForm(rootAgent);

    await service.transaction((transaction) =>
      service.setEventFlows(
        {
          target: {
            uid: formUid,
          },
          flowRegistry: {
            legacyBeforeRender: {
              key: 'legacyBeforeRender',
              on: 'beforeRender',
              steps: {},
            },
          },
        },
        { transaction },
      ),
    );

    const meta = await service.getEventFlowMeta({
      target: {
        uid: formUid,
      },
    });

    expect(meta.target.uid).toBe(formUid);
    expect(meta.flowRegistry.legacyBeforeRender).toMatchObject({
      key: 'legacyBeforeRender',
      on: {
        eventName: 'beforeRender',
        defaultParams: {
          condition: {
            logic: '$and',
            items: [],
          },
        },
      },
    });
    expect(meta.fingerprint).toEqual(expect.any(String));
    expect(meta.events.direct).toEqual(expect.arrayContaining(['beforeRender']));
    expect(meta.events.object).toEqual(expect.arrayContaining(['beforeRender', 'submit']));
    expect(meta.phases.supported).toEqual(
      expect.arrayContaining(['beforeAllFlows', 'afterAllFlows', 'beforeFlow', 'afterFlow', 'beforeStep', 'afterStep']),
    );
    expect(meta.phases.defaultAdd).toBe('beforeAllFlows');
    expect(meta.writeCapabilities.defaultAddPhase).toBe('beforeAllFlows');
    expect(meta.writeCapabilities.fineGrainedActions).toEqual(['addEventFlow', 'setEventFlow', 'removeEventFlow']);
    expect(meta.stepActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          use: 'runjs',
          defaultParamsSchema: expect.objectContaining({
            properties: expect.objectContaining({
              code: expect.objectContaining({
                type: 'string',
              }),
            }),
          }),
        }),
      ]),
    );
    expect(meta.vars.formValues.properties.nickname).toBeTruthy();
  });

  it('should add, set and remove one event flow without replacing neighboring flows', async () => {
    const { formUid } = await createEmployeeForm(rootAgent);

    const initial = await service.transaction((transaction) =>
      service.setEventFlows(
        {
          target: {
            uid: formUid,
          },
          flowRegistry: {
            keepExisting: {
              key: 'keepExisting',
              on: 'beforeRender',
              steps: {},
            },
          },
        },
        { transaction },
      ),
    );

    const added = await service.transaction((transaction) =>
      service.addEventFlow(
        {
          target: {
            uid: formUid,
          },
          key: 'submitGuard',
          eventName: 'submit',
          expectedFingerprint: initial.fingerprint,
          flow: {
            customMeta: {
              source: 'service',
            },
            on: {
              defaultParams: {
                auditLabel: 'retain-me',
              },
            },
          },
          steps: {
            runGuard: {
              use: 'runjs',
              defaultParams: {
                code: 'ctx.logger?.info?.("submit");',
              },
            },
          },
          condition: {
            logic: '$and',
            items: [],
          },
        },
        { transaction },
      ),
    );

    expect(added.flow).toMatchObject({
      key: 'submitGuard',
      customMeta: {
        source: 'service',
      },
      on: {
        eventName: 'submit',
        defaultParams: {
          condition: {
            logic: '$and',
            items: [],
          },
          auditLabel: 'retain-me',
        },
      },
      steps: {
        runGuard: {
          use: 'runjs',
          defaultParams: {
            code: 'ctx.logger?.info?.("submit");',
          },
        },
      },
    });
    expect(added.flowRegistry.keepExisting).toBeTruthy();
    expect(added.flowRegistry.submitGuard).toBeTruthy();

    const duplicate = await rootAgent.resource('flowSurfaces').addEventFlow({
      values: {
        target: {
          uid: formUid,
        },
        key: 'submitGuard',
        eventName: 'submit',
      },
    });
    expect(duplicate.status).toBe(409);

    const updated = await service.transaction((transaction) =>
      service.setEventFlow(
        {
          target: {
            uid: formUid,
          },
          key: 'submitGuard',
          flow: {
            on: 'submit',
            steps: {
              runGuard: {
                use: 'runjs',
                defaultParams: {
                  code: 'ctx.message?.success?.("updated");',
                },
              },
            },
          },
          expectedFingerprint: added.fingerprint,
        },
        { transaction },
      ),
    );

    expect(updated.flowRegistry.keepExisting).toBeTruthy();
    expect(updated.flowRegistry.submitGuard.steps.runGuard).toMatchObject({
      use: 'runjs',
      defaultParams: {
        code: 'ctx.message?.success?.("updated");',
      },
    });
    expect(updated.flowRegistry.submitGuard.steps.runGuard.params).toBeUndefined();
    expect(updated.flowRegistry.submitGuard.on).toMatchObject({
      eventName: 'submit',
      defaultParams: {
        condition: {
          logic: '$and',
          items: [],
        },
      },
    });

    const removed = await service.transaction((transaction) =>
      service.removeEventFlow(
        {
          target: {
            uid: formUid,
          },
          key: 'submitGuard',
          expectedFingerprint: updated.fingerprint,
        },
        { transaction },
      ),
    );

    expect(removed.flowRegistry.keepExisting).toBeTruthy();
    expect(removed.flowRegistry.submitGuard).toBeUndefined();

    const readback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(readback.tree.flowRegistry).toEqual({
      keepExisting: {
        key: 'keepExisting',
        on: {
          eventName: 'beforeRender',
          defaultParams: {
            condition: {
              logic: '$and',
              items: [],
            },
          },
        },
        steps: {},
      },
    });
  });

  it('should normalize string event names to object on values with empty conditions', async () => {
    const { formUid } = await createEmployeeForm(rootAgent);

    const result = await service.transaction((transaction) =>
      service.setEventFlows(
        {
          target: {
            uid: formUid,
          },
          flowRegistry: {
            beforeRenderFlow: {
              key: 'beforeRenderFlow',
              on: 'beforeRender',
              steps: {},
            },
            submitFlow: {
              key: 'submitFlow',
              on: 'submit',
              steps: {},
            },
            existingConditionFlow: {
              key: 'existingConditionFlow',
              on: {
                eventName: 'submit',
                phase: 'beforeAllFlows',
                defaultParams: {
                  condition: {
                    logic: '$or',
                    items: [],
                  },
                  auditLabel: 'keep-me',
                },
              },
              steps: {},
            },
          },
        },
        { transaction },
      ),
    );

    expect(result.flowRegistry.beforeRenderFlow.on).toEqual({
      eventName: 'beforeRender',
      defaultParams: {
        condition: {
          logic: '$and',
          items: [],
        },
      },
    });
    expect(result.flowRegistry.submitFlow.on).toEqual({
      eventName: 'submit',
      defaultParams: {
        condition: {
          logic: '$and',
          items: [],
        },
      },
    });
    expect(result.flowRegistry.existingConditionFlow.on).toEqual({
      eventName: 'submit',
      defaultParams: {
        condition: {
          logic: '$or',
          items: [],
        },
        auditLabel: 'keep-me',
      },
    });

    const readback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(readback.tree.flowRegistry).toEqual(result.flowRegistry);
  });

  it('should tolerate legacy string event names when updating unrelated settings', async () => {
    const { formUid } = await createEmployeeForm(rootAgent);

    await (service as unknown as FlowSurfaceModelOptionsPatcher).patchFlowSurfaceModelOptions({
      uid: formUid,
      flowRegistry: {
        legacySubmit: {
          key: 'legacySubmit',
          on: 'submit',
          steps: {},
        },
      },
    });

    const updateSettings = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: formUid,
        },
        stepParams: {
          formModelSettings: {
            layout: {
              layout: 'vertical',
            },
          },
        },
      },
    });
    expect(updateSettings.status).toBe(200);

    const meta = await service.getEventFlowMeta({
      target: {
        uid: formUid,
      },
    });
    expect(meta.flowRegistry.legacySubmit.on).toEqual({
      eventName: 'submit',
      defaultParams: {
        condition: {
          logic: '$and',
          items: [],
        },
      },
    });
  });

  it('should reject stale event-flow expectedFingerprint and unsupported add phases', async () => {
    const { formUid } = await createEmployeeForm(rootAgent);
    const meta = await service.getEventFlowMeta({
      target: {
        uid: formUid,
      },
    });

    await service.transaction((transaction) =>
      service.addEventFlow(
        {
          target: {
            uid: formUid,
          },
          key: 'firstFlow',
          eventName: 'submit',
          expectedFingerprint: meta.fingerprint,
        },
        { transaction },
      ),
    );

    await expect(
      service.transaction((transaction) =>
        service.addEventFlow(
          {
            target: {
              uid: formUid,
            },
            key: 'staleFlow',
            eventName: 'submit',
            expectedFingerprint: meta.fingerprint,
          },
          { transaction },
        ),
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'FLOW_SURFACE_EVENT_FLOW_FINGERPRINT_CONFLICT',
    });

    await expect(
      service.transaction((transaction) =>
        service.addEventFlow(
          {
            target: {
              uid: formUid,
            },
            key: 'beforeStepFlow',
            eventName: 'submit',
            phase: 'beforeStep',
          },
          { transaction },
        ),
      ),
    ).rejects.toThrow(`flowSurfaces addEventFlow only supports phase 'beforeAllFlows'`);

    await expect(
      service.transaction((transaction) =>
        service.addEventFlow(
          {
            target: {
              uid: formUid,
            },
            key: 'smuggledBeforeStepFlow',
            eventName: 'submit',
            flow: {
              on: {
                eventName: 'submit',
                phase: 'beforeStep',
              },
            },
          },
          { transaction },
        ),
      ),
    ).rejects.toThrow(`flowSurfaces addEventFlow only supports phase 'beforeAllFlows'`);
  });

  it('should reject unsafe RunJS in event-flow registry write paths before persisting', async () => {
    const { formUid } = await createEmployeeForm(rootAgent);

    const setEventFlowsResponse = await rootAgent.resource('flowSurfaces').setEventFlows({
      values: {
        target: {
          uid: formUid,
        },
        flowRegistry: {
          unsafeRegistry: {
            key: 'unsafeRegistry',
            on: 'beforeRender',
            steps: {
              runUnsafe: {
                use: 'runjs',
                defaultParams: {
                  code: 'await fetch("/blocked");',
                },
              },
            },
          },
        },
      },
    });
    expect(setEventFlowsResponse.status).toBe(400);
    expect(setEventFlowsResponse.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.unsafeRegistry.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-global-blocked',
          details: expect.objectContaining({
            global: 'fetch',
          }),
        }),
      ]),
    );

    const setEventFlowResponse = await rootAgent.resource('flowSurfaces').setEventFlow({
      values: {
        target: {
          uid: formUid,
        },
        key: 'unsafeSet',
        flow: {
          on: {
            eventName: 'submit',
            phase: 'beforeAllFlows',
          },
          steps: {
            runUnsafe: {
              use: 'runjs',
              params: {
                code: 'window["localStorage"].getItem("blocked");',
              },
            },
          },
        },
      },
    });
    expect(setEventFlowResponse.status).toBe(400);
    expect(setEventFlowResponse.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.unsafeSet.steps.runUnsafe.params.code',
          ruleId: 'runjs-window-property-blocked',
          details: expect.objectContaining({
            global: 'window',
            member: 'localStorage',
          }),
        }),
      ]),
    );

    const updateSettingsResponse = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: formUid,
        },
        flowRegistry: {
          unsafeUpdateSettings: {
            key: 'unsafeUpdateSettings',
            on: 'beforeRender',
            steps: {
              runUnsafe: {
                use: 'runjs',
                defaultParams: {
                  code: "ctx.resource.setFilter({ status: { in: ['Active'] } });",
                },
              },
            },
          },
        },
      },
    });
    expect(updateSettingsResponse.status).toBe(400);
    expect(updateSettingsResponse.body?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.flowRegistry.unsafeUpdateSettings.steps.runUnsafe.defaultParams.code',
          ruleId: 'runjs-resource-filter-operator-missing-dollar',
          details: expect.objectContaining({
            fieldPath: 'status',
            operator: 'in',
            suggestedOperator: '$in',
          }),
        }),
      ]),
    );

    const readback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(readback.tree.flowRegistry || {}).toEqual({});
  });

  it('should compile flowRegistry diffs to fine-grained event-flow mutate ops', () => {
    const compiled = compileApplySpec(
      {
        uid: 'form-uid',
      },
      {
        uid: 'form-uid',
        use: 'CreateFormModel',
        flowRegistry: {
          removeMe: {
            key: 'removeMe',
            on: 'beforeRender',
            steps: {},
          },
          updateMe: {
            key: 'updateMe',
            on: 'beforeRender',
            steps: {},
          },
        },
      },
      {
        flowRegistry: {
          updateMe: {
            key: 'updateMe',
            on: 'beforeRender',
            steps: {
              runChanged: {
                use: 'runjs',
                defaultParams: {
                  code: 'ctx.changed = true;',
                },
              },
            },
          },
          addMe: {
            key: 'addMe',
            on: {
              eventName: 'submit',
              phase: 'beforeAllFlows',
              defaultParams: {
                condition: {
                  logic: '$and',
                  items: [],
                },
                auditLabel: 'retain-me',
              },
            },
            steps: {
              runAdd: {
                use: 'runjs',
                defaultParams: {
                  code: 'ctx.added = true;',
                },
              },
            },
            customMeta: {
              source: 'compiler',
            },
          },
        },
      },
    );

    expect(compiled.ops).toEqual([
      {
        type: 'removeEventFlow',
        target: {
          uid: 'form-uid',
        },
        values: {
          key: 'removeMe',
        },
      },
      {
        type: 'setEventFlow',
        target: {
          uid: 'form-uid',
        },
        values: {
          key: 'updateMe',
          flow: {
            key: 'updateMe',
            on: {
              eventName: 'beforeRender',
              defaultParams: {
                condition: {
                  logic: '$and',
                  items: [],
                },
              },
            },
            steps: {
              runChanged: {
                use: 'runjs',
                defaultParams: {
                  code: 'ctx.changed = true;',
                },
              },
            },
          },
        },
      },
      {
        type: 'addEventFlow',
        target: {
          uid: 'form-uid',
        },
        values: {
          key: 'addMe',
          flow: {
            key: 'addMe',
            on: {
              eventName: 'submit',
              defaultParams: {
                condition: {
                  logic: '$and',
                  items: [],
                },
                auditLabel: 'retain-me',
              },
            },
            steps: {
              runAdd: {
                use: 'runjs',
                defaultParams: {
                  code: 'ctx.added = true;',
                },
              },
            },
            customMeta: {
              source: 'compiler',
            },
          },
        },
      },
    ]);
  });

  it('should compile canonical event-flow apply specs without repeated mutations', () => {
    const compiled = compileApplySpec(
      {
        uid: 'form-uid',
      },
      {
        uid: 'form-uid',
        use: 'CreateFormModel',
        flowRegistry: {
          beforeRenderApply: {
            key: 'beforeRenderApply',
            on: {
              eventName: 'beforeRender',
              defaultParams: {
                condition: {
                  logic: '$and',
                  items: [],
                },
              },
            },
            steps: {},
          },
        },
      },
      {
        flowRegistry: {
          beforeRenderApply: {
            key: 'beforeRenderApply',
            on: 'beforeRender',
            steps: {},
          },
        },
      },
    );

    expect(compiled.ops).toEqual([]);
  });
});

function getData(response: any) {
  expect(response.status).toBe(200);
  if (response.body && Object.prototype.hasOwnProperty.call(response.body, 'data')) {
    return response.body.data;
  }
  return response.body;
}

async function createEmployeeForm(rootAgent: any) {
  const page = getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values: {
        title: `Event flow page ${Date.now()}`,
        icon: 'FileOutlined',
        tabTitle: 'Event flow tab',
      },
    }),
  );
  const form = getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.gridUid,
        },
        type: 'createForm',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
        fields: ['status'],
      },
    }),
  );
  await rootAgent.resource('flowSurfaces').addField({
    values: {
      target: {
        uid: form.uid,
      },
      fieldPath: 'nickname',
    },
  });
  return {
    page,
    formUid: form.uid,
  };
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      ...target,
    }),
  );
}

async function setupEventFlowFixtureCollections(rootAgent: any, db: Database) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });

  await waitForFixtureCollectionsReady(db, {
    employees: ['nickname', 'status'],
  });
}
