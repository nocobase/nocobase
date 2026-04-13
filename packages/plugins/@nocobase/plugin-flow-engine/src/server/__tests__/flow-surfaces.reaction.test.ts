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
import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { compileReactionPlanSteps } from '../flow-surfaces/blueprint/compile-reaction';
import { prepareFlowSurfaceApplyBlueprintDocument } from '../flow-surfaces/blueprint/normalize-document';
import { FLOW_SURFACE_REACTION_FINGERPRINT_CONFLICT } from '../flow-surfaces/reaction/errors';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

describe('flowSurfaces reaction', () => {
  let app: MockServer;
  let db: Database;
  let rootAgent: any;
  let service: FlowSurfacesService;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();
    db = app.db;
    service = new FlowSurfacesService(app.pm.get('flow-engine') as any);
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupReactionFixtureCollections(rootAgent, db);
  }, 120000);

  beforeEach(async () => {
    rootAgent = await loginFlowSurfacesRootAgent(app);
  });

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should expose reaction meta and write form/block/field/action rules through service methods', async () => {
    const page = await createPage(rootAgent, {
      title: 'Reaction page',
      tabTitle: 'Reaction tab',
    });
    const tableUid = await addBlock(rootAgent, page.tabSchemaUid, 'table', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    await addField(rootAgent, formUid, 'nickname');
    await addField(rootAgent, formUid, 'status');
    const refreshAction = await addAction(rootAgent, tableUid, 'refresh');

    const meta = await service.getReactionMeta({
      target: {
        uid: formUid,
      },
    });
    const capabilityKinds = meta.capabilities.map((item) => item.kind).sort();
    const fieldValueCapability = meta.capabilities.find((item) => item.kind === 'fieldValue');

    expect(meta.target.uid).toBe(formUid);
    expect(capabilityKinds).toEqual(expect.arrayContaining(['fieldLinkage', 'fieldValue']));
    expect(meta.unavailable).toEqual(
      expect.arrayContaining([
        {
          kind: 'actionLinkage',
          code: expect.any(String),
          reason: expect.any(String),
        },
      ]),
    );
    expect(fieldValueCapability?.targetFields.map((item: any) => item.path)).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(fieldValueCapability?.valueExprMeta).toMatchObject({
      supportedSources: ['literal', 'path', 'runjs'],
      runjsScene: 'fieldValue',
    });

    const fieldValueResult = await service.transaction((transaction) =>
      service.setFieldValueRules(
        {
          target: {
            uid: formUid,
          },
          rules: [
            {
              key: 'defaultStatus',
              targetPath: 'status',
              mode: 'default',
              when: {
                logic: '$and',
                items: [
                  {
                    path: 'formValues.nickname',
                    operator: '$eq',
                    value: 'Alice',
                  },
                ],
              },
              value: {
                source: 'literal',
                value: 'draft',
              },
            },
          ],
        },
        { transaction },
      ),
    );
    expect(fieldValueResult.resolvedScene).toBe('form');
    expect(fieldValueResult.normalizedRules).toMatchObject([
      {
        key: 'defaultStatus',
        targetPath: 'status',
        mode: 'default',
      },
    ]);

    const fieldLinkageResult = await service.transaction((transaction) =>
      service.setFieldLinkageRules(
        {
          target: {
            uid: formUid,
          },
          rules: [
            {
              key: 'disableStatus',
              when: {
                logic: '$and',
                items: [
                  {
                    path: 'formValues.nickname',
                    operator: '$eq',
                    value: 'readonly',
                  },
                ],
              },
              then: [
                {
                  type: 'setFieldState',
                  fieldPaths: ['status'],
                  state: 'disabled',
                },
              ],
            },
          ],
        },
        { transaction },
      ),
    );
    expect(fieldLinkageResult.resolvedScene).toBe('form');
    expect(fieldLinkageResult.normalizedRules).toMatchObject([
      {
        key: 'disableStatus',
      },
    ]);

    const blockLinkageResult = await service.transaction((transaction) =>
      service.setBlockLinkageRules(
        {
          target: {
            uid: tableUid,
          },
          rules: [
            {
              key: 'hideTable',
              then: [
                {
                  type: 'setBlockState',
                  state: 'hidden',
                },
              ],
            },
          ],
        },
        { transaction },
      ),
    );
    expect(blockLinkageResult.resolvedScene).toBe('block');
    expect(blockLinkageResult.normalizedRules).toMatchObject([
      {
        key: 'hideTable',
      },
    ]);

    const actionLinkageResult = await service.transaction((transaction) =>
      service.setActionLinkageRules(
        {
          target: {
            uid: refreshAction.uid,
          },
          rules: [
            {
              key: 'disableRefresh',
              then: [
                {
                  type: 'setActionState',
                  state: 'disabled',
                },
              ],
            },
          ],
        },
        { transaction },
      ),
    );
    expect(actionLinkageResult.resolvedScene).toBe('action');

    const metaAfterWrite = await service.getReactionMeta({
      target: {
        uid: formUid,
      },
    });
    expect(findCapability(metaAfterWrite, 'fieldValue').normalizedRules).toMatchObject([
      {
        key: 'defaultStatus',
        targetPath: 'status',
        mode: 'default',
      },
    ]);
    expect(findCapability(metaAfterWrite, 'fieldLinkage').normalizedRules).toMatchObject([
      {
        key: 'disableStatus',
      },
    ]);

    const tableReadback = await getSurface(rootAgent, { uid: tableUid });
    const formReadback = await getSurface(rootAgent, { uid: formUid });
    const actionReadback = await getSurface(rootAgent, { uid: refreshAction.uid });

    expect(tableReadback.tree.stepParams?.cardSettings?.linkageRules).toMatchObject([
      {
        key: 'hideTable',
        actions: [
          {
            name: 'linkageSetBlockProps',
            params: {
              value: 'hidden',
            },
          },
        ],
      },
    ]);
    expect(formReadback.tree.stepParams?.formModelSettings?.assignRules?.value).toBeUndefined();
    expect(formReadback.tree.stepParams?.eventSettings?.linkageRules?.value).toBeUndefined();
    expect(formReadback.tree.subModels?.grid?.stepParams?.formModelSettings?.assignRules?.value).toMatchObject([
      {
        key: 'defaultStatus',
        targetPath: 'status',
        mode: 'default',
        value: 'draft',
        condition: {
          logic: '$and',
          items: [
            {
              path: '{{ ctx.formValues.nickname }}',
              operator: '$eq',
              value: 'Alice',
            },
          ],
        },
      },
    ]);
    expect(formReadback.tree.subModels?.grid?.stepParams?.eventSettings?.linkageRules?.value).toMatchObject([
      {
        key: 'disableStatus',
        actions: [
          {
            name: 'linkageSetFieldProps',
            params: {
              value: {
                fields: [expect.any(String)],
                state: 'disabled',
              },
            },
          },
        ],
      },
    ]);
    expect(actionReadback.tree.stepParams?.buttonSettings?.linkageRules).toMatchObject([
      {
        key: 'disableRefresh',
        actions: [
          {
            name: 'linkageSetActionProps',
            params: {
              value: 'disabled',
            },
          },
        ],
      },
    ]);
  });

  it('should reject stale reaction fingerprints on field value writes', async () => {
    const page = await createPage(rootAgent, {
      title: 'Reaction conflict page',
      tabTitle: 'Reaction conflict tab',
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    await addField(rootAgent, formUid, 'status');

    const firstWrite = await service.transaction((transaction) =>
      service.setFieldValueRules(
        {
          target: {
            uid: formUid,
          },
          rules: [
            {
              key: 'draftStatus',
              targetPath: 'status',
              value: {
                source: 'literal',
                value: 'draft',
              },
            },
          ],
        },
        { transaction },
      ),
    );

    await expect(
      service.transaction((transaction) =>
        service.setFieldValueRules(
          {
            target: {
              uid: formUid,
            },
            expectedFingerprint: 'stale-fingerprint',
            rules: [
              {
                key: 'publishedStatus',
                targetPath: 'status',
                value: {
                  source: 'literal',
                  value: 'published',
                },
              },
            ],
          },
          { transaction },
        ),
      ),
    ).rejects.toMatchObject({
      code: FLOW_SURFACE_REACTION_FINGERPRINT_CONFLICT,
    });
  });

  it('should clear field value slots with rules: []', async () => {
    const page = await createPage(rootAgent, {
      title: 'Reaction clear page',
      tabTitle: 'Reaction clear tab',
    });
    const formUid = await addBlock(rootAgent, page.tabSchemaUid, 'createForm', {
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    await addField(rootAgent, formUid, 'status');

    const firstWrite = await service.transaction((transaction) =>
      service.setFieldValueRules(
        {
          target: {
            uid: formUid,
          },
          rules: [
            {
              key: 'draftStatus',
              targetPath: 'status',
              value: {
                source: 'literal',
                value: 'draft',
              },
            },
          ],
        },
        { transaction },
      ),
    );

    await service.transaction((transaction) =>
      service.setFieldValueRules(
        {
          target: {
            uid: formUid,
          },
          expectedFingerprint: firstWrite.fingerprint,
          rules: [],
        },
        { transaction },
      ),
    );

    const formReadback = await getSurface(rootAgent, {
      uid: formUid,
    });
    expect(formReadback.tree.stepParams?.formModelSettings?.assignRules?.value).toBeUndefined();
    expect(formReadback.tree.subModels?.grid?.stepParams?.formModelSettings?.assignRules?.value).toEqual([]);
  });

  it('should reject stale expectedFingerprint in applyBlueprint reaction items', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Reaction fingerprint page ${Date.now()}`,
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              expectedFingerprint: 'stale-fingerprint',
              rules: [
                {
                  key: 'defaultStatus',
                  targetPath: 'status',
                  value: {
                    source: 'literal',
                    value: 'draft',
                  },
                },
              ],
            },
          ],
        },
      },
    });

    expect(response.status).toBe(409);
    expect(response.body?.errors?.[0]?.code).toBe(FLOW_SURFACE_REACTION_FINGERPRINT_CONFLICT);
  });

  it('should clear reaction slots through applyBlueprint reaction rules: []', async () => {
    const created = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: `Reaction clear blueprint page ${Date.now()}`,
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'defaultStatus',
                  targetPath: 'status',
                  value: {
                    source: 'literal',
                    value: 'draft',
                  },
                },
              ],
            },
          ],
        },
      },
    });

    const createdData = getData(created);
    const formNodeBeforeClear = findFirstNode(
      createdData.surface?.tree,
      (node: any) => node?.use === 'CreateFormModel',
    );
    expect(formNodeBeforeClear?.subModels?.grid?.stepParams?.formModelSettings?.assignRules?.value).toHaveLength(1);

    const cleared = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'replace',
        target: {
          pageSchemaUid: createdData.target.pageSchemaUid,
        },
        tabs: [
          {
            key: 'clearMain',
            title: 'Main',
            blocks: [
              {
                key: 'clearEmployeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['status'],
                actions: ['submit'],
              },
            ],
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'clearMain.clearEmployeeForm',
              rules: [],
            },
          ],
        },
      },
    });

    const clearedData = getData(cleared);
    const formNodeAfterClear = findFirstNode(clearedData.surface?.tree, (node: any) => node?.use === 'CreateFormModel');
    expect(formNodeAfterClear?.stepParams?.formModelSettings?.assignRules?.value).toBeUndefined();
    expect(formNodeAfterClear?.subModels?.grid?.stepParams?.formModelSettings?.assignRules?.value).toEqual([]);
  });

  it('should compile applyBlueprint reaction items into plan-only reaction steps', async () => {
    const document = prepareFlowSurfaceApplyBlueprintDocument({
      version: '1',
      mode: 'create',
      navigation: {
        item: {
          title: 'Reaction blueprint',
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              key: 'employeesTable',
              type: 'table',
              collection: 'employees',
            },
          ],
        },
      ],
      reaction: {
        items: [
          {
            type: 'setBlockLinkageRules',
            target: 'employeesTable',
            expectedFingerprint: 'f1',
            rules: [
              {
                key: 'hideTable',
                then: [
                  {
                    type: 'setBlockState',
                    state: 'hidden',
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(document.reaction).toEqual({
      items: [
        {
          type: 'setBlockLinkageRules',
          target: 'employeesTable',
          expectedFingerprint: 'f1',
          rules: [
            {
              key: 'hideTable',
              then: [
                {
                  type: 'setBlockState',
                  state: 'hidden',
                },
              ],
            },
          ],
        },
      ],
    });
    expect(compileReactionPlanSteps(document.reaction)).toEqual([
      {
        id: 'blueprintReaction__1',
        action: 'setBlockLinkageRules',
        selectors: {
          target: {
            key: 'employeesTable',
          },
        },
        values: {
          rules: [
            {
              key: 'hideTable',
              then: [
                {
                  type: 'setBlockState',
                  state: 'hidden',
                },
              ],
            },
          ],
          expectedFingerprint: 'f1',
        },
      },
    ]);
  });

  it('should apply blueprint reaction items end-to-end', async () => {
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: {
        version: '1',
        mode: 'create',
        navigation: {
          item: {
            title: 'Reaction blueprint page',
          },
        },
        tabs: [
          {
            key: 'main',
            title: 'Main',
            blocks: [
              {
                key: 'employeeForm',
                type: 'createForm',
                collection: 'employees',
                fields: ['nickname', 'status'],
                actions: [
                  {
                    key: 'submitAction',
                    type: 'submit',
                  },
                ],
              },
              {
                key: 'employeesTable',
                type: 'table',
                collection: 'employees',
                fields: ['nickname', 'status'],
                actions: [
                  {
                    key: 'refreshAction',
                    type: 'refresh',
                  },
                ],
              },
            ],
            layout: {
              rows: [['main.employeeForm'], ['main.employeesTable']],
            },
          },
        ],
        reaction: {
          items: [
            {
              type: 'setFieldValueRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'defaultStatus',
                  targetPath: 'status',
                  value: {
                    source: 'literal',
                    value: 'draft',
                  },
                },
              ],
            },
            {
              type: 'setBlockLinkageRules',
              target: 'main.employeesTable',
              rules: [
                {
                  key: 'hideTable',
                  then: [
                    {
                      type: 'setBlockState',
                      state: 'hidden',
                    },
                  ],
                },
              ],
            },
            {
              type: 'setFieldLinkageRules',
              target: 'main.employeeForm',
              rules: [
                {
                  key: 'disableStatus',
                  then: [
                    {
                      type: 'setFieldState',
                      fieldPaths: ['status'],
                      state: 'disabled',
                    },
                  ],
                },
              ],
            },
            {
              type: 'setActionLinkageRules',
              target: 'main.employeesTable.refreshAction',
              rules: [
                {
                  key: 'disableRefresh',
                  then: [
                    {
                      type: 'setActionState',
                      state: 'disabled',
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    const result = getData(response);
    const surface = result.surface;
    expect(surface?.target?.uid).toBeTruthy();

    const formNode = findFirstNode(surface?.tree, (node: any) => node?.use === 'CreateFormModel');
    const tableNode = findFirstNode(surface?.tree, (node: any) => node?.use === 'TableBlockModel');
    const refreshActionNode = findFirstNode(surface?.tree, (node: any) => node?.use === 'RefreshActionModel');

    expect(formNode?.stepParams?.formModelSettings?.assignRules?.value).toBeUndefined();
    expect(formNode?.stepParams?.eventSettings?.linkageRules?.value).toBeUndefined();
    expect(formNode?.subModels?.grid?.stepParams?.formModelSettings?.assignRules?.value).toHaveLength(1);
    expect(formNode?.subModels?.grid?.stepParams?.eventSettings?.linkageRules?.value).toHaveLength(1);
    expect(tableNode?.stepParams?.cardSettings?.linkageRules).toHaveLength(1);
    expect(refreshActionNode?.stepParams?.buttonSettings?.linkageRules).toHaveLength(1);
  });
});

function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body.data;
}

function findCapability(meta: any, kind: string) {
  const matched = meta.capabilities.find((item: any) => item.kind === kind);
  expect(matched).toBeTruthy();
  return matched;
}

function findFirstNode(node: any, predicate: (node: any) => boolean): any {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  if (predicate(node)) {
    return node;
  }
  for (const value of Object.values(node.subModels || {})) {
    for (const child of Array.isArray(value) ? value : [value]) {
      const matched = findFirstNode(child, predicate);
      if (matched) {
        return matched;
      }
    }
  }
  return undefined;
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      ...target,
    }),
  );
}

async function addBlock(rootAgent: any, targetUid: string, type: string, resourceInit?: Record<string, any>) {
  let normalizedTargetUid = targetUid;
  const targetReadback = await getSurface(rootAgent, {
    uid: targetUid,
  });
  if (['RootPageTabModel', 'ChildPageTabModel'].includes(targetReadback?.tree?.use)) {
    normalizedTargetUid = targetReadback.tree?.subModels?.grid?.uid || targetUid;
  }
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: normalizedTargetUid,
        },
        type,
        ...(resourceInit ? { resourceInit } : {}),
      },
    }),
  ).uid;
}

async function addField(rootAgent: any, targetUid: string, fieldPath: string) {
  return getData(
    await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: targetUid,
        },
        fieldPath,
      },
    }),
  );
}

async function addAction(rootAgent: any, targetUid: string, type: string) {
  return getData(
    await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: targetUid,
        },
        type,
      },
    }),
  );
}

async function setupReactionFixtureCollections(rootAgent: any, db: Database) {
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
