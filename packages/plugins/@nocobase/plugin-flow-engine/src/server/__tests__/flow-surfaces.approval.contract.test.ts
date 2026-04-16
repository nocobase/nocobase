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
import type FlowModelRepository from '../repository';
import {
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getComposeBlock,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const APPROVAL_CONTRACT_REAL_PLUGIN_ALIASES = [
  'notification-manager',
  'notification-in-app-message',
  'workflow',
  'workflow-approval',
] as const;
const APPROVAL_CONTRACT_REAL_PLUGIN_ALIAS_SET = new Set<string>(APPROVAL_CONTRACT_REAL_PLUGIN_ALIASES);

const APPROVAL_CONTRACT_TEST_ENABLED_PLUGIN_ALIASES = [
  ...FLOW_SURFACES_TEST_PLUGINS,
  'notification-manager',
  'notification-in-app-message',
  'workflow-approval',
] as const;

const APPROVAL_CONTRACT_TEST_PLUGIN_INSTALLS = [
  ...FLOW_SURFACES_TEST_PLUGIN_INSTALLS.filter((pluginInstall) => {
    if (!Array.isArray(pluginInstall)) {
      return true;
    }
    const pluginName = typeof pluginInstall[1]?.name === 'string' ? pluginInstall[1].name : '';
    return !APPROVAL_CONTRACT_REAL_PLUGIN_ALIAS_SET.has(pluginName);
  }),
  'notification-manager',
  'notification-in-app-message',
  'workflow',
  'workflow-approval',
] as const;

async function createApprovalSurface(
  flowRepo: FlowModelRepository,
  options: {
    pageUse: 'TriggerChildPageModel' | 'ApprovalChildPageModel';
    tabUse: 'TriggerChildPageTabModel' | 'ApprovalChildPageTabModel';
    gridUse: 'TriggerBlockGridModel' | 'ApprovalBlockGridModel';
  },
) {
  const pageUid = uid();
  const tabUid = uid();
  const gridUid = uid();

  await flowRepo.insertModel({
    uid: pageUid,
    use: options.pageUse,
    props: {
      title: `${options.pageUse} title`,
    },
    subModels: {
      tabs: [
        {
          uid: tabUid,
          use: options.tabUse,
          props: {
            title: `${options.tabUse} title`,
          },
          subModels: {
            grid: {
              uid: gridUid,
              use: options.gridUse,
            },
          },
        },
      ],
    },
  });

  return {
    pageUid,
    tabUid,
    gridUid,
  };
}

describe('flowSurfaces approval API contract', () => {
  let context: FlowSurfacesContractContext;
  let flowRepo: FlowModelRepository;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext({
      enabledPluginAliases: APPROVAL_CONTRACT_TEST_ENABLED_PLUGIN_ALIASES,
      plugins: APPROVAL_CONTRACT_TEST_PLUGIN_INSTALLS,
    });
    ({ flowRepo, rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should expose approval-only block catalogs and reject approval blocks on regular page grids', async () => {
    const page = await createPage(rootAgent, {
      title: 'Approval contract page',
      tabTitle: 'Approval contract tab',
    });
    const triggerSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'TriggerChildPageModel',
      tabUse: 'TriggerChildPageTabModel',
      gridUse: 'TriggerBlockGridModel',
    });
    const approvalSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'ApprovalChildPageModel',
      tabUse: 'ApprovalChildPageTabModel',
      gridUse: 'ApprovalBlockGridModel',
    });

    const regularCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: page.gridUid,
        },
      },
    });
    expect(regularCatalogRes.status).toBe(200);
    const regularCatalog = getData(regularCatalogRes);
    expect(regularCatalog.blocks.map((item: any) => item.key)).not.toContain('approvalInitiator');

    const triggerCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: triggerSurface.gridUid,
        },
      },
    });
    expect(triggerCatalogRes.status).toBe(200);
    const triggerCatalog = getData(triggerCatalogRes);
    expect(triggerCatalog.blocks.map((item: any) => item.key)).toContain('approvalInitiator');
    expect(triggerCatalog.blocks.map((item: any) => item.key)).not.toContain('approvalApprover');
    expect(triggerCatalog.blocks.map((item: any) => item.key)).not.toContain('markdown');

    const approvalCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: approvalSurface.gridUid,
        },
      },
    });
    expect(approvalCatalogRes.status).toBe(200);
    const approvalCatalog = getData(approvalCatalogRes);
    expect(approvalCatalog.blocks.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['approvalApprover', 'approvalInformation']),
    );
    expect(approvalCatalog.blocks.map((item: any) => item.key)).not.toContain('markdown');

    const invalidAddRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: page.gridUid,
        },
        type: 'approvalInitiator',
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'employees',
        },
      },
    });
    expect(invalidAddRes.status).toBe(400);
    expect(readErrorMessage(invalidAddRes)).toContain('not allowed');

    const invalidGenericApprovalBlockRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: approvalSurface.gridUid,
        },
        type: 'markdown',
      },
    });
    expect(invalidGenericApprovalBlockRes.status).toBe(400);
    expect(readErrorMessage(invalidGenericApprovalBlockRes)).toContain('not allowed');

    const applyForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: triggerSurface.gridUid,
          },
          type: 'approvalInitiator',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const processForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: approvalSurface.gridUid,
          },
          type: 'approvalApprover',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const approvalDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: approvalSurface.gridUid,
          },
          type: 'approvalInformation',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const applyFormReadback = await getSurface(rootAgent, { uid: applyForm.uid });
    const processFormReadback = await getSurface(rootAgent, { uid: processForm.uid });
    const approvalDetailsReadback = await getSurface(rootAgent, { uid: approvalDetails.uid });

    expect(applyFormReadback.tree).toMatchObject({
      use: 'ApplyFormModel',
      subModels: {
        grid: {
          use: 'PatternFormGridModel',
        },
      },
    });
    expect((applyFormReadback.tree.subModels?.actions as any[])?.[0]).toMatchObject({
      use: 'ApplyFormSubmitModel',
    });
    expect(processFormReadback.tree).toMatchObject({
      use: 'ProcessFormModel',
      subModels: {
        grid: {
          use: 'PatternFormGridModel',
        },
      },
    });
    expect(processFormReadback.tree.subModels?.actions).toBeUndefined();
    expect(approvalDetailsReadback.tree).toMatchObject({
      use: 'ApprovalDetailsModel',
      subModels: {
        grid: {
          use: 'ApprovalDetailsGridModel',
        },
      },
    });
  });

  it('should persist approval-specific field wrappers and action models through addField and addAction', async () => {
    const triggerSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'TriggerChildPageModel',
      tabUse: 'TriggerChildPageTabModel',
      gridUse: 'TriggerBlockGridModel',
    });
    const approvalSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'ApprovalChildPageModel',
      tabUse: 'ApprovalChildPageTabModel',
      gridUse: 'ApprovalBlockGridModel',
    });

    const applyForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: triggerSurface.gridUid,
          },
          type: 'approvalInitiator',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const processForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: approvalSurface.gridUid,
          },
          type: 'approvalApprover',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );
    const approvalDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: approvalSurface.gridUid,
          },
          type: 'approvalInformation',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const applyCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: applyForm.uid,
        },
      },
    });
    expect(applyCatalogRes.status).toBe(200);
    const applyCatalog = getData(applyCatalogRes);
    expect(applyCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['approvalSaveDraft', 'approvalWithdraw']),
    );
    expect(applyCatalog.actions.map((item: any) => item.key)).not.toContain('approvalSubmit');

    const processCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: processForm.uid,
        },
      },
    });
    expect(processCatalogRes.status).toBe(200);
    const processCatalog = getData(processCatalogRes);
    expect(processCatalog.actions.map((item: any) => item.key)).toEqual(
      expect.arrayContaining([
        'approvalApprove',
        'approvalReject',
        'approvalReturn',
        'approvalDelegate',
        'approvalAddAssignee',
      ]),
    );

    const applyField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: applyForm.uid,
          },
          fieldPath: 'nickname',
        },
      }),
    );
    const approvalInfoField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: approvalDetails.uid,
          },
          fieldPath: 'status',
        },
      }),
    );
    const saveDraftAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: applyForm.uid,
          },
          type: 'approvalSaveDraft',
        },
      }),
    );
    const applyCatalogAfterSaveDraftRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: applyForm.uid,
        },
      },
    });
    expect(applyCatalogAfterSaveDraftRes.status).toBe(200);
    const applyCatalogAfterSaveDraft = getData(applyCatalogAfterSaveDraftRes);
    expect(applyCatalogAfterSaveDraft.actions.map((item: any) => item.key)).not.toContain('approvalSubmit');
    expect(applyCatalogAfterSaveDraft.actions.map((item: any) => item.key)).not.toContain('approvalSaveDraft');

    const approveAction = getData(
      await rootAgent.resource('flowSurfaces').addAction({
        values: {
          target: {
            uid: processForm.uid,
          },
          type: 'approvalApprove',
        },
      }),
    );
    const processCatalogAfterApproveRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: processForm.uid,
        },
      },
    });
    expect(processCatalogAfterApproveRes.status).toBe(200);
    const processCatalogAfterApprove = getData(processCatalogAfterApproveRes);
    expect(processCatalogAfterApprove.actions.map((item: any) => item.key)).not.toContain('approvalApprove');

    const applyFieldWrapperReadback = await getSurface(rootAgent, {
      uid: applyField.wrapperUid,
    });
    const applyFieldInnerReadback = await getSurface(rootAgent, {
      uid: applyField.fieldUid,
    });
    const approvalInfoFieldWrapperReadback = await getSurface(rootAgent, {
      uid: approvalInfoField.wrapperUid,
    });
    const saveDraftActionReadback = await getSurface(rootAgent, {
      uid: saveDraftAction.uid,
    });
    const approveActionReadback = await getSurface(rootAgent, {
      uid: approveAction.uid,
    });

    expect(applyFieldWrapperReadback.tree.use).toBe('PatternFormItemModel');
    expect(applyFieldInnerReadback.tree).toMatchObject({
      use: 'PatternFormFieldModel',
      stepParams: {
        fieldBinding: {
          use: 'InputFieldModel',
        },
      },
    });
    expect(approvalInfoFieldWrapperReadback.tree.use).toBe('ApprovalDetailsItemModel');
    expect(saveDraftActionReadback.tree).toMatchObject({
      use: 'ApplyFormSaveDraftModel',
      props: {
        title: 'Save draft',
      },
    });
    expect(approveActionReadback.tree).toMatchObject({
      use: 'ProcessFormApproveModel',
      props: {
        title: 'Approve',
      },
    });
  });

  it('should keep PatternFormFieldModel semantics on approval forms and reject jsItem standalone fields', async () => {
    const triggerSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'TriggerChildPageModel',
      tabUse: 'TriggerChildPageTabModel',
      gridUse: 'TriggerBlockGridModel',
    });

    const applyForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: triggerSurface.gridUid,
          },
          type: 'approvalInitiator',
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      }),
    );

    const fieldCatalogRes = await rootAgent.resource('flowSurfaces').catalog({
      values: {
        target: {
          uid: applyForm.uid,
        },
        sections: ['fields'],
      },
    });
    expect(fieldCatalogRes.status).toBe(200);
    const fieldCatalog = getData(fieldCatalogRes);
    expect(fieldCatalog.fields.map((item: any) => item.key)).not.toContain('jsItem');

    const rejectedJsItemRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: applyForm.uid,
        },
        type: 'jsItem',
        settings: {
          version: '1.0.0',
          code: 'await ctx.render(null);',
        },
      },
    });
    expect(rejectedJsItemRes.status).toBe(400);
    expect(readErrorMessage(rejectedJsItemRes)).toContain('not allowed under approval form');

    const applyField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: applyForm.uid,
          },
          fieldPath: 'nickname',
        },
      }),
    );

    const configureRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: applyField.wrapperUid,
        },
        changes: {
          fieldComponent: 'InputFieldModel',
        },
      },
    });
    expect(configureRes.status).toBe(200);

    const applyFieldWrapperReadback = await getSurface(rootAgent, {
      uid: applyField.wrapperUid,
    });
    const applyFieldInnerReadback = await getSurface(rootAgent, {
      uid: applyField.fieldUid,
    });

    expect(applyFieldWrapperReadback.tree.stepParams?.editItemSettings?.model?.use).toBe('InputFieldModel');
    expect(applyFieldInnerReadback.tree).toMatchObject({
      use: 'PatternFormFieldModel',
      stepParams: {
        fieldBinding: {
          use: 'InputFieldModel',
        },
      },
    });
  });

  it('should compose approval blocks with approval-specific fields and actions and reject invalid containers', async () => {
    const page = await createPage(rootAgent, {
      title: 'Approval compose page',
      tabTitle: 'Approval compose tab',
    });
    const triggerSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'TriggerChildPageModel',
      tabUse: 'TriggerChildPageTabModel',
      gridUse: 'TriggerBlockGridModel',
    });
    const approvalSurface = await createApprovalSurface(flowRepo, {
      pageUse: 'ApprovalChildPageModel',
      tabUse: 'ApprovalChildPageTabModel',
      gridUse: 'ApprovalBlockGridModel',
    });

    const invalidComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.gridUid,
        },
        blocks: [
          {
            key: 'bad',
            type: 'approvalInitiator',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          },
        ],
      },
    });
    expect(invalidComposeRes.status).toBe(400);
    expect(readErrorMessage(invalidComposeRes)).toContain('not allowed');

    const triggerComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: triggerSurface.gridUid,
        },
        blocks: [
          {
            key: 'initiator',
            type: 'approvalInitiator',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname'],
            actions: ['approvalSaveDraft', 'approvalWithdraw'],
          },
        ],
      },
    });
    expect(triggerComposeRes.status).toBe(200);

    const triggerComposed = getData(triggerComposeRes);
    const initiatorBlock = getComposeBlock(triggerComposed, 'initiator');
    expect(initiatorBlock.fields.map((item: any) => item.fieldPath)).toEqual(['nickname']);
    expect(initiatorBlock.actions.map((item: any) => item.type)).toEqual(['approvalSaveDraft', 'approvalWithdraw']);

    const initiatorReadback = await getSurface(rootAgent, {
      uid: initiatorBlock.uid,
    });
    expect(initiatorReadback.tree).toMatchObject({
      use: 'ApplyFormModel',
      subModels: {
        grid: {
          use: 'PatternFormGridModel',
        },
      },
    });
    expect((initiatorReadback.tree.subModels?.actions as any[])?.map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ApplyFormSubmitModel', 'ApplyFormSaveDraftModel', 'ApplyFormWithdrawModel']),
    );

    const initiatorFieldWrapper = await getSurface(rootAgent, {
      uid: initiatorBlock.fields[0].wrapperUid,
    });
    const initiatorFieldInner = await getSurface(rootAgent, {
      uid: initiatorBlock.fields[0].fieldUid,
    });
    expect(initiatorFieldWrapper.tree.use).toBe('PatternFormItemModel');
    expect(initiatorFieldInner.tree).toMatchObject({
      use: 'PatternFormFieldModel',
      stepParams: {
        fieldBinding: {
          use: 'InputFieldModel',
        },
      },
    });

    const approvalComposeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: approvalSurface.gridUid,
        },
        blocks: [
          {
            key: 'approver',
            type: 'approvalApprover',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            fields: ['nickname'],
            actions: ['approvalApprove', 'approvalReject'],
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
      },
    });
    expect(approvalComposeRes.status).toBe(200);

    const approvalComposed = getData(approvalComposeRes);
    const approverBlock = getComposeBlock(approvalComposed, 'approver');
    const informationBlock = getComposeBlock(approvalComposed, 'information');
    expect(approverBlock.fields.map((item: any) => item.fieldPath)).toEqual(['nickname']);
    expect(approverBlock.actions.map((item: any) => item.type)).toEqual(['approvalApprove', 'approvalReject']);
    expect(informationBlock.fields.map((item: any) => item.fieldPath)).toEqual(['status']);

    const approverReadback = await getSurface(rootAgent, {
      uid: approverBlock.uid,
    });
    const informationReadback = await getSurface(rootAgent, {
      uid: informationBlock.uid,
    });
    expect(approverReadback.tree).toMatchObject({
      use: 'ProcessFormModel',
      subModels: {
        grid: {
          use: 'PatternFormGridModel',
        },
      },
    });
    expect((approverReadback.tree.subModels?.actions as any[])?.map((item: any) => item?.use)).toEqual(
      expect.arrayContaining(['ProcessFormApproveModel', 'ProcessFormRejectModel']),
    );
    expect(informationReadback.tree).toMatchObject({
      use: 'ApprovalDetailsModel',
      subModels: {
        grid: {
          use: 'ApprovalDetailsGridModel',
        },
      },
    });

    const informationFieldWrapper = await getSurface(rootAgent, {
      uid: informationBlock.fields[0].wrapperUid,
    });
    expect(informationFieldWrapper.tree.use).toBe('ApprovalDetailsItemModel');
  });
});
