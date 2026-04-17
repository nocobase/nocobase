/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createFlowSurfacesContractContext,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import {
  FLOW_SURFACES_APPROVAL_BLUEPRINT_TEST_PLUGIN_INSTALLS,
  FLOW_SURFACES_APPROVAL_TEST_ENABLED_PLUGIN_ALIASES,
} from './flow-surfaces.test-plugins';

async function createApprovalWorkflow(context: FlowSurfacesContractContext) {
  return context.db.getCollection('workflows').repository.create({
    values: {
      title: 'Expense approval',
      type: 'approval',
      config: {
        collection: 'main.employees',
        mode: 0,
        centralized: false,
        audienceType: 1,
        recordShowMode: false,
      },
    },
  });
}

async function createApprovalNode(workflow: any) {
  return workflow.createNode({
    title: 'Manager approval',
    type: 'approval',
    config: {
      branchMode: false,
      assignees: [],
    },
  });
}

describe('flowSurfaces approval blueprint API contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: FLOW_SURFACES_APPROVAL_TEST_ENABLED_PLUGIN_ALIASES,
      plugins: FLOW_SURFACES_APPROVAL_BLUEPRINT_TEST_PLUGIN_INSTALLS,
    });
    ({ rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should apply an initiator approval blueprint on the workflow trigger and persist workflow.config.approvalUid', async () => {
    const workflow = await createApprovalWorkflow(context);

    const result = getData(
      await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
        values: {
          surface: 'initiator',
          workflowId: workflow.id,
          blocks: [
            {
              key: 'applyForm',
              type: 'approvalInitiator',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['nickname'],
              actions: ['approvalSaveDraft', 'approvalWithdraw'],
            },
            {
              key: 'note',
              type: 'markdown',
              settings: {
                title: 'Approval note',
                content: '# Approval',
              },
            },
            {
              key: 'script',
              type: 'jsBlock',
              title: 'Approval script',
              settings: {
                code: "return 'Approval';",
              },
            },
          ],
          layout: {
            rows: [['applyForm'], ['note'], ['script']],
          },
        },
      }),
    );

    expect(result).toMatchObject({
      version: '1',
      mode: 'replace',
      surfaceType: 'initiator',
      binding: {
        resourceName: 'workflows',
        filterByTk: workflow.id,
        configPath: 'config.approvalUid',
      },
    });

    const persistedWorkflow = await context.db.getCollection('workflows').repository.findOne({
      filterByTk: workflow.id,
    });
    expect(persistedWorkflow.config.approvalUid).toBe(result.target.uid);
    expect(persistedWorkflow.config.withdrawable).toBe(true);

    const readback = await getSurface(rootAgent, {
      uid: result.target.uid,
    });
    expect(readback.tree.use).toBe('TriggerChildPageModel');
    const defaultRootReadback = await context.flowRepo.findModelById(result.target.uid);
    expect(defaultRootReadback.subModels?.tabs?.[0]?.subModels?.grid).toBeUndefined();
    expect(defaultRootReadback.subModels?.tabs?.[0]?.parentId).toBe(result.target.uid);
    const defaultGridReadback = await context.flowRepo.findModelByParentId(defaultRootReadback.subModels.tabs[0].uid, {
      subKey: 'grid',
    });
    expect(defaultGridReadback?.parentId).toBe(defaultRootReadback.subModels.tabs[0].uid);
    expect(defaultGridReadback?.subModels?.items?.[0]?.parentId).toBe(defaultGridReadback?.uid);
    const storedNodes = await context.flowRepo.findNodesById(result.target.uid, { includeAsyncNode: true });
    expect(Boolean(findStoredNode(storedNodes, result.target.uid)?.async)).toBe(true);
    expect(readback.tree.stepParams.TriggerChildPageSettings.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
    });
    const tab = readback.tree.subModels.tabs[0];
    expect(tab.use).toBe('TriggerChildPageTabModel');
    expect(tab.subModels.grid.use).toBe('TriggerBlockGridModel');
    expect(tab.subModels.grid.subModels.items[0].use).toBe('ApplyFormModel');
    expect(tab.subModels.grid.subModels.items[1].use).toBe('MarkdownBlockModel');
    expect(tab.subModels.grid.subModels.items[2].use).toBe('JSBlockModel');
    expect(Boolean(findStoredNode(storedNodes, tab.subModels.grid.uid)?.async)).toBe(true);
    expect(tab.subModels.grid.subModels.items[0].stepParams.patternSettings.pattern.pattern).toBe('createNew');
    expect(tab.subModels.grid.subModels.items[0].subModels.actions.map((item: any) => item.use)).toEqual(
      expect.arrayContaining(['ApplyFormSubmitModel', 'ApplyFormSaveDraftModel', 'ApplyFormWithdrawModel']),
    );

    await context.flowRepo.upsertModel(
      {
        uid: uid(),
        parentId: result.target.uid,
        subKey: 'tabs',
        subType: 'array',
        use: 'TriggerChildPageTabModel',
        subModels: {
          grid: {
            uid: uid(),
            use: 'TriggerBlockGridModel',
          },
        },
      },
      {},
    );

    const replacedResult = getData(
      await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
        values: {
          surface: 'initiator',
          workflowId: workflow.id,
          blocks: [
            {
              key: 'applyForm',
              type: 'approvalInitiator',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['nickname'],
              actions: ['approvalSaveDraft'],
            },
          ],
        },
      }),
    );

    expect(replacedResult.target.uid).toBe(result.target.uid);
    const replacedWorkflow = await context.db.getCollection('workflows').repository.findOne({
      filterByTk: workflow.id,
    });
    expect(replacedWorkflow.config.withdrawable).toBe(false);
    const replacedReadback = await getSurface(rootAgent, {
      uid: result.target.uid,
    });
    expect(replacedReadback.tree.subModels.tabs).toHaveLength(1);
    expect(replacedReadback.tree.subModels.tabs[0].subModels.grid.subModels.items).toHaveLength(1);
    expect(
      replacedReadback.tree.subModels.tabs[0].subModels.grid.subModels.items[0].subModels.actions.map(
        (item: any) => item.use,
      ),
    ).not.toContain('ApplyFormWithdrawModel');
  });

  it('should apply a workflow task-card approval blueprint and persist workflow.config.taskCardUid', async () => {
    const workflow = await createApprovalWorkflow(context);

    const invalidBlockRes = await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
      values: {
        surface: 'taskCard',
        workflowId: workflow.id,
        blocks: [
          {
            key: 'bad',
            type: 'markdown',
          },
        ],
      },
    });
    expect(invalidBlockRes.status).toBe(400);
    expect(readErrorMessage(invalidBlockRes)).toContain(`surface 'taskCard' does not accept blocks`);

    const result = getData(
      await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
        values: {
          surface: 'taskCard',
          workflowId: workflow.id,
          fields: [
            {
              key: 'manager',
              fieldPath: 'manager',
            },
            {
              key: 'skills',
              fieldPath: 'skills',
            },
          ],
          layout: {
            rows: [['manager', 'skills']],
          },
        },
      }),
    );

    expect(result).toMatchObject({
      surfaceType: 'taskCard',
      binding: {
        resourceName: 'workflows',
        filterByTk: workflow.id,
        configPath: 'config.taskCardUid',
      },
    });

    const persistedWorkflow = await context.db.getCollection('workflows').repository.findOne({
      filterByTk: workflow.id,
    });
    expect(persistedWorkflow.config.taskCardUid).toBe(result.target.uid);

    const readback = await getSurface(rootAgent, {
      uid: result.target.uid,
    });
    expect(readback.tree.use).toBe('ApplyTaskCardDetailsModel');
    const storedNodes = await context.flowRepo.findNodesById(result.target.uid, { includeAsyncNode: true });
    expect(Boolean(findStoredNode(storedNodes, result.target.uid)?.async)).toBe(true);
    expect(readback.tree.subModels.grid.use).toBe('ApplyTaskCardGridModel');
    expect(readback.tree.subModels.grid.subModels.items.map((item: any) => item.use)).toEqual(
      expect.arrayContaining(['ApplyTaskCardDetailsItemModel']),
    );
    expect(readback.tree.subModels.grid.props.rowOrder).toHaveLength(1);

    const taskCardItems = readback.tree.subModels.grid.subModels.items;
    const taskCardManagerItem = taskCardItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'manager',
    );
    const taskCardSkillsItem = taskCardItems.find(
      (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === 'skills',
    );
    expect(taskCardManagerItem?.use).toBe('ApplyTaskCardDetailsItemModel');
    expect(taskCardSkillsItem?.use).toBe('ApplyTaskCardDetailsItemModel');

    const taskCardCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: readback.tree.subModels.grid.uid,
        },
      },
    });
    expect(taskCardCatalogRes.status).toBe(200);
    const taskCardCatalog = getData(taskCardCatalogRes);
    expect(taskCardCatalog.blocks || []).toEqual([]);

    const taskCardAddBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: readback.tree.subModels.grid.uid,
        },
        type: 'markdown',
      },
    });
    expect(taskCardAddBlockRes.status).toBe(400);
    expect(readErrorMessage(taskCardAddBlockRes)).toContain('does not support blocks');

    const taskCardManagerCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: taskCardManagerItem.uid,
          },
        },
      }),
    );
    const taskCardSkillsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: taskCardSkillsItem.uid,
          },
        },
      }),
    );
    expect(taskCardManagerCatalog.node.configureOptions.fieldComponent.enum).toEqual([
      'DisplayTextFieldModel',
      'DisplaySubItemFieldModel',
    ]);
    expect(taskCardSkillsCatalog.node.configureOptions.fieldComponent.enum).toEqual([
      'DisplayTextFieldModel',
      'DisplaySubListFieldModel',
      'DisplaySubTableFieldModel',
    ]);

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: taskCardManagerItem.uid,
            },
            changes: {
              fieldComponent: 'DisplaySubItemFieldModel',
            },
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: taskCardSkillsItem.uid,
            },
            changes: {
              fieldComponent: 'DisplaySubListFieldModel',
            },
          },
        })
      ).status,
    ).toBe(200);

    const taskCardManagerReadback = await getSurface(rootAgent, {
      uid: taskCardManagerItem.uid,
    });
    const taskCardSkillsReadback = await getSurface(rootAgent, {
      uid: taskCardSkillsItem.uid,
    });
    expect(taskCardManagerReadback.tree.stepParams?.detailItemSettings?.model?.use).toBe('DisplaySubItemFieldModel');
    expect(taskCardManagerReadback.tree.subModels?.field).toMatchObject({
      use: 'DisplaySubItemFieldModel',
      stepParams: {
        fieldBinding: {
          use: 'DisplaySubItemFieldModel',
        },
      },
    });
    expect(taskCardSkillsReadback.tree.stepParams?.detailItemSettings?.model?.use).toBe('DisplaySubListFieldModel');
    expect(taskCardSkillsReadback.tree.subModels?.field).toMatchObject({
      use: 'DisplaySubListFieldModel',
      stepParams: {
        fieldBinding: {
          use: 'DisplaySubListFieldModel',
        },
      },
    });

    const invalidFieldRes = await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
      values: {
        surface: 'taskCard',
        workflowId: workflow.id,
        fields: [
          {
            key: 'missing',
            fieldPath: 'missing_field',
          },
        ],
      },
    });
    expect(invalidFieldRes.status).toBe(400);
  });

  it('should apply approver and node task-card blueprints on approval nodes and reject invalid binding combinations', async () => {
    const workflow = await createApprovalWorkflow(context);
    const node = await createApprovalNode(workflow);

    const invalidRes = await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
      values: {
        surface: 'initiator',
        nodeId: node.id,
      },
    });
    expect(invalidRes.status).toBe(400);
    expect(readErrorMessage(invalidRes)).toContain(`surface 'initiator' requires workflowId`);

    const approverResult = getData(
      await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
        values: {
          surface: 'approver',
          nodeId: node.id,
          blocks: [
            {
              key: 'process',
              type: 'approvalApprover',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['nickname'],
              actions: [
                'approvalApprove',
                'approvalReject',
                {
                  type: 'approvalReturn',
                  settings: {
                    approvalReturn: {
                      type: 'count',
                      count: 2,
                    },
                  },
                },
                {
                  type: 'approvalDelegate',
                  settings: {
                    assigneesScope: {
                      assignees: [1],
                      extraFieldKey: 'departmentId',
                    },
                  },
                },
                {
                  type: 'approvalAddAssignee',
                  settings: {
                    assigneesScope: {
                      assignees: [2],
                    },
                  },
                },
              ],
            },
            {
              key: 'information',
              type: 'approvalInformation',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['status'],
            },
          ],
          layout: {
            rows: [['process'], ['information']],
          },
        },
      }),
    );

    expect(approverResult).toMatchObject({
      surfaceType: 'approver',
      binding: {
        resourceName: 'flow_nodes',
        filterByTk: node.id,
        configPath: 'config.approvalUid',
      },
    });

    const taskCardResult = getData(
      await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
        values: {
          surface: 'taskCard',
          nodeId: node.id,
          fields: ['nickname', 'status'],
          layout: {
            rows: [['nickname'], ['status']],
          },
        },
      }),
    );

    expect(taskCardResult).toMatchObject({
      surfaceType: 'taskCard',
      binding: {
        resourceName: 'flow_nodes',
        filterByTk: node.id,
        configPath: 'config.taskCardUid',
      },
    });

    const persistedNode = await context.db.getCollection('flow_nodes').repository.findOne({
      filterByTk: node.id,
    });
    expect(persistedNode.config.approvalUid).toBe(approverResult.target.uid);
    expect(persistedNode.config.taskCardUid).toBe(taskCardResult.target.uid);
    expect(persistedNode.config.actions).toEqual([2, -1, 1, 8, 99]);
    expect(persistedNode.config.returnTo).toBe(2);
    expect(persistedNode.config.returnToNodeVariable).toBeNull();
    expect(persistedNode.config.toDelegateReassignees).toEqual([1]);
    expect(persistedNode.config.toDelegateReassigneesOptions).toEqual({
      extraFieldKey: 'departmentId',
    });
    expect(persistedNode.config.toAddReassignees).toEqual([2]);

    const approverReadback = await getSurface(rootAgent, {
      uid: approverResult.target.uid,
    });
    expect(approverReadback.tree.use).toBe('ApprovalChildPageModel');
    const defaultApproverReadback = await context.flowRepo.findModelById(approverResult.target.uid);
    expect(defaultApproverReadback.subModels?.tabs?.[0]?.subModels?.grid).toBeUndefined();
    expect(defaultApproverReadback.subModels?.tabs?.[0]?.parentId).toBe(approverResult.target.uid);
    const defaultApproverGridReadback = await context.flowRepo.findModelByParentId(
      defaultApproverReadback.subModels.tabs[0].uid,
      {
        subKey: 'grid',
      },
    );
    expect(defaultApproverGridReadback?.parentId).toBe(defaultApproverReadback.subModels.tabs[0].uid);
    expect(defaultApproverGridReadback?.subModels?.items?.[0]?.parentId).toBe(defaultApproverGridReadback?.uid);
    const approverStoredNodes = await context.flowRepo.findNodesById(approverResult.target.uid, {
      includeAsyncNode: true,
    });
    expect(Boolean(findStoredNode(approverStoredNodes, approverResult.target.uid)?.async)).toBe(true);
    expect(approverReadback.tree.subModels.tabs[0].use).toBe('ApprovalChildPageTabModel');
    expect(approverReadback.tree.subModels.tabs[0].subModels.grid.use).toBe('ApprovalBlockGridModel');
    expect(
      Boolean(findStoredNode(approverStoredNodes, approverReadback.tree.subModels.tabs[0].subModels.grid.uid)?.async),
    ).toBe(true);
    expect(approverReadback.tree.subModels.tabs[0].subModels.grid.subModels.items.map((item: any) => item.use)).toEqual(
      expect.arrayContaining(['ProcessFormModel', 'ApprovalDetailsModel']),
    );

    const taskCardReadback = await getSurface(rootAgent, {
      uid: taskCardResult.target.uid,
    });
    expect(taskCardReadback.tree.use).toBe('ApprovalTaskCardDetailsModel');
    expect(taskCardReadback.tree.subModels.grid.use).toBe('ApprovalTaskCardGridModel');
    expect(taskCardReadback.tree.subModels.grid.subModels.items.map((item: any) => item.use)).toEqual(
      expect.arrayContaining(['ApprovalTaskCardDetailsItemModel']),
    );

    const processBlock = approverReadback.tree.subModels.tabs[0].subModels.grid.subModels.items.find(
      (item: any) => item.use === 'ProcessFormModel',
    );
    expect(processBlock.stepParams.patternSettings.pattern.pattern).toBe('createNew');
    const duplicateSubmitRes = await rootAgent.resource('flowSurfaces').addAction({
      values: {
        target: {
          uid: readbackActionOwnerUid(approverReadback.tree, 'ProcessFormModel') || processBlock.uid,
        },
        type: 'approvalApprove',
      },
    });
    expect(duplicateSubmitRes.status).toBe(400);
  });

  it('should normalize legacy initiator roots to the same async persistence shape as the UI path', async () => {
    const workflow = await createApprovalWorkflow(context);
    const legacyRootUid = uid();
    const legacyTabUid = uid();
    const legacyGridUid = uid();

    await context.flowRepo.insertModel({
      uid: legacyRootUid,
      use: 'TriggerChildPageModel',
      stepParams: {
        pageSettings: {
          general: {
            displayTitle: false,
            enableTabs: false,
            title: `{{t("Initiator's interface", { ns: "workflow" })}}`,
          },
        },
        TriggerChildPageSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      },
      subModels: {
        tabs: [
          {
            uid: legacyTabUid,
            use: 'TriggerChildPageTabModel',
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: `{{t("Details")}}`,
                },
              },
            },
            subModels: {
              grid: {
                uid: legacyGridUid,
                use: 'TriggerBlockGridModel',
              },
            },
          },
        ],
      },
    } as any);

    await context.db.getCollection('workflows').repository.update({
      filterByTk: workflow.id,
      values: {
        config: {
          ...(workflow.config || {}),
          approvalUid: legacyRootUid,
        },
      },
    });

    const result = getData(
      await rootAgent.resource('flowSurfaces').applyApprovalBlueprint({
        values: {
          surface: 'initiator',
          workflowId: workflow.id,
          blocks: [
            {
              key: 'applyForm',
              type: 'approvalInitiator',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['nickname'],
            },
          ],
        },
      }),
    );

    expect(result.target.uid).toBe(legacyRootUid);

    const normalizedNodes = await context.flowRepo.findNodesById(legacyRootUid, { includeAsyncNode: true });
    expect(Boolean(findStoredNode(normalizedNodes, legacyRootUid)?.async)).toBe(true);
    expect(Boolean(findStoredNode(normalizedNodes, legacyGridUid)?.async)).toBe(true);

    const normalizedRootReadback = await context.flowRepo.findModelById(legacyRootUid);
    expect(normalizedRootReadback.subModels?.tabs?.[0]?.subModels?.grid).toBeUndefined();
  });
});

function readbackActionOwnerUid(tree: any, use: string) {
  const items = tree?.subModels?.tabs?.[0]?.subModels?.grid?.subModels?.items || [];
  return items.find((item: any) => item.use === use)?.uid;
}

function findStoredNode(nodes: any[], uid: string) {
  return nodes.find((node: any) => node?.uid === uid);
}
