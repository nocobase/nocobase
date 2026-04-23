/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildBlockTree, buildFieldTree } from '../flow-surfaces/builder';
import { prepareFlowSurfaceApplyApprovalBlueprintDocument } from '../flow-surfaces/approval/blueprint';
import {
  getAvailableBlockCatalogItems,
  getSupportedFieldComponentUseSet,
  resolveSupportedBlockCatalogItem,
} from '../flow-surfaces/catalog';
import { getConfigureOptionsForUse } from '../flow-surfaces/configure-options';
import { buildPlanKeyKind } from '../flow-surfaces/planning/key-kind';
import { getReactionKindsForUse } from '../flow-surfaces/reaction/registry';

describe('flowSurfaces approval surface', () => {
  it('should expose approval blocks only under approval containers', () => {
    const triggerBlockKeys = getAvailableBlockCatalogItems('TriggerBlockGridModel').map((item) => item.key);
    const approvalBlockKeys = getAvailableBlockCatalogItems('ApprovalBlockGridModel').map((item) => item.key);

    expect(getAvailableBlockCatalogItems().map((item) => item.key)).not.toContain('approvalInitiator');

    expect(triggerBlockKeys).toContain('approvalInitiator');
    expect(triggerBlockKeys).not.toContain('approvalApprover');
    expect(triggerBlockKeys).toContain('markdown');
    expect(triggerBlockKeys).toContain('jsBlock');
    expect(triggerBlockKeys).not.toContain('table');
    expect(triggerBlockKeys).not.toContain('details');
    expect(triggerBlockKeys).not.toContain('list');
    expect(triggerBlockKeys).not.toContain('iframe');

    expect(approvalBlockKeys).toContain('approvalApprover');
    expect(approvalBlockKeys).toContain('approvalInformation');
    expect(approvalBlockKeys).toContain('markdown');
    expect(approvalBlockKeys).toContain('jsBlock');
    expect(approvalBlockKeys).not.toContain('table');
    expect(approvalBlockKeys).not.toContain('details');
    expect(approvalBlockKeys).not.toContain('list');
    expect(approvalBlockKeys).not.toContain('iframe');
    expect(getAvailableBlockCatalogItems('ApplyTaskCardGridModel')).toEqual([]);
    expect(getAvailableBlockCatalogItems('ApprovalTaskCardGridModel')).toEqual([]);
  });

  it('should validate approval block container placement', () => {
    expect(
      resolveSupportedBlockCatalogItem(
        {
          type: 'approvalInitiator',
          containerUse: 'TriggerBlockGridModel',
        },
        {
          requireCreateSupported: true,
        },
      ).use,
    ).toBe('ApplyFormModel');

    expect(() =>
      resolveSupportedBlockCatalogItem(
        {
          type: 'approvalInitiator',
          containerUse: 'ApprovalBlockGridModel',
        },
        {
          requireCreateSupported: true,
        },
      ),
    ).toThrow(/not allowed/);

    expect(
      resolveSupportedBlockCatalogItem(
        {
          type: 'markdown',
          containerUse: 'TriggerBlockGridModel',
        },
        {
          requireCreateSupported: true,
        },
      ).use,
    ).toBe('MarkdownBlockModel');

    expect(
      resolveSupportedBlockCatalogItem(
        {
          type: 'jsBlock',
          containerUse: 'ApprovalBlockGridModel',
        },
        {
          requireCreateSupported: true,
        },
      ).use,
    ).toBe('JSBlockModel');

    expect(() =>
      resolveSupportedBlockCatalogItem(
        {
          type: 'table',
          containerUse: 'TriggerBlockGridModel',
        },
        {
          requireCreateSupported: true,
        },
      ),
    ).toThrow(/not allowed/);

    expect(() =>
      resolveSupportedBlockCatalogItem(
        {
          type: 'approvalInformation',
          containerUse: 'ApplyTaskCardGridModel',
        },
        {
          requireCreateSupported: true,
        },
      ),
    ).toThrow(/not allowed/);
  });

  it('should build approval blocks with approval-specific default subtrees', () => {
    const applyForm = buildBlockTree({
      type: 'approvalInitiator',
      containerUse: 'TriggerBlockGridModel',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'requests',
      },
    });

    expect(applyForm.use).toBe('ApplyFormModel');
    expect(applyForm.subModels?.grid).toMatchObject({
      use: 'PatternFormGridModel',
    });
    expect(applyForm.subModels?.actions).toHaveLength(1);
    expect((applyForm.subModels?.actions as any[])?.[0]).toMatchObject({
      use: 'ApplyFormSubmitModel',
      props: {
        title: '{{t("Submit")}}',
        type: 'primary',
      },
    });

    const approvalDetails = buildBlockTree({
      type: 'approvalInformation',
      containerUse: 'ApprovalBlockGridModel',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'approval_records',
      },
    });

    expect(approvalDetails.use).toBe('ApprovalDetailsModel');
    expect(approvalDetails.subModels?.grid).toMatchObject({
      use: 'ApprovalDetailsGridModel',
    });
  });

  it('should keep buildBlockTree validation when use is provided directly', () => {
    expect(() =>
      buildBlockTree({
        use: 'ApplyFormModel',
        containerUse: 'ApprovalBlockGridModel',
      }),
    ).toThrow(/not allowed/);

    expect(() =>
      buildBlockTree({
        use: 'NotRegisteredApprovalBlockModel',
      }),
    ).toThrow(/registered block types\/uses/);
  });

  it('should build pattern form fields with PatternFormFieldModel and preserve bound field use', () => {
    const fieldTree = buildFieldTree({
      wrapperUse: 'PatternFormItemModel',
      fieldUse: 'InputFieldModel',
      dataSourceKey: 'main',
      collectionName: 'requests',
      fieldPath: 'title',
    });

    expect(fieldTree.model).toMatchObject({
      use: 'PatternFormItemModel',
      subModels: {
        field: {
          use: 'PatternFormFieldModel',
          stepParams: {
            fieldBinding: {
              use: 'InputFieldModel',
            },
          },
        },
      },
    });
  });

  it('should expose approval relation fieldComponent sets that match current frontend wrappers', () => {
    const singleAssociationField = {
      interface: 'm2o',
      targetCollection: {
        template: 'general',
      },
    };
    const multiAssociationField = {
      interface: 'm2m',
      targetCollection: {
        template: 'general',
      },
    };
    const fileAssociationField = {
      interface: 'm2m',
      targetCollection: {
        template: 'file',
      },
    };

    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'PatternFormItemModel', field: singleAssociationField }) || [],
      ),
    ).toEqual(['RecordSelectFieldModel', 'RecordPickerFieldModel', 'SubFormFieldModel']);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'PatternFormItemModel', field: multiAssociationField }) || [],
      ),
    ).toEqual([
      'RecordSelectFieldModel',
      'RecordPickerFieldModel',
      'SubFormListFieldModel',
      'PatternSubTableFieldModel',
    ]);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'PatternFormItemModel', field: fileAssociationField }) || [],
      ),
    ).toEqual(['RecordSelectFieldModel', 'RecordPickerFieldModel', 'UploadFieldModel']);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({ containerUse: 'ApprovalDetailsItemModel', field: singleAssociationField }) ||
          [],
      ),
    ).toEqual(['DisplayTextFieldModel', 'DisplaySubItemFieldModel']);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({
          containerUse: 'ApplyTaskCardDetailsItemModel',
          field: multiAssociationField,
        }) || [],
      ),
    ).toEqual(['DisplayTextFieldModel', 'DisplaySubListFieldModel', 'DisplaySubTableFieldModel']);
    expect(
      Array.from(
        getSupportedFieldComponentUseSet({
          containerUse: 'ApprovalTaskCardDetailsItemModel',
          field: multiAssociationField,
        }) || [],
      ),
    ).toEqual(['DisplayTextFieldModel', 'DisplaySubListFieldModel', 'DisplaySubTableFieldModel']);
  });

  it('should expose configure options for approval blocks, wrappers and actions', () => {
    expect(getConfigureOptionsForUse('ApplyFormModel')).toEqual(
      expect.objectContaining({
        description: expect.any(Object),
        layout: expect.any(Object),
        labelWidth: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ApplyFormModel')).not.toHaveProperty('displayTitle');
    expect(getConfigureOptionsForUse('ApprovalDetailsItemModel')).toEqual(
      expect.objectContaining({
        label: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ProcessFormApproveModel')).toEqual(
      expect.objectContaining({
        title: expect.any(Object),
        commentFormUid: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ProcessFormRejectModel')).toEqual(
      expect.objectContaining({
        commentFormUid: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ApplyFormSubmitModel')).toEqual(
      expect.objectContaining({
        confirm: expect.any(Object),
        assignValues: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ApplyFormSaveDraftModel')).toEqual(
      expect.objectContaining({
        confirm: expect.any(Object),
        assignValues: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ApplyFormWithdrawModel')).toEqual(
      expect.objectContaining({
        confirm: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ProcessFormReturnModel')).toEqual(
      expect.objectContaining({
        commentFormUid: expect.any(Object),
        approvalReturn: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ProcessFormDelegateModel')).toEqual(
      expect.objectContaining({
        assigneesScope: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ProcessFormAddAssigneeModel')).toEqual(
      expect.objectContaining({
        assigneesScope: expect.any(Object),
      }),
    );
  });

  it('should preserve template blocks in approval blueprint page-like documents', () => {
    expect(
      prepareFlowSurfaceApplyApprovalBlueprintDocument({
        surface: 'initiator',
        workflowId: 1,
        blocks: [
          {
            key: 'templated',
            template: {
              uid: 'template-uid',
              mode: 'reference',
            },
          },
        ],
      }),
    ).toMatchObject({
      surface: 'initiator',
      workflowId: 1,
      blocks: [
        {
          key: 'templated',
          template: {
            uid: 'template-uid',
            mode: 'reference',
          },
        },
      ],
    });
  });

  it('should expose details semantics for approval task-card models', () => {
    expect(getConfigureOptionsForUse('ApplyTaskCardDetailsModel')).toEqual(
      expect.objectContaining({
        layout: expect.any(Object),
      }),
    );
    expect(getConfigureOptionsForUse('ApprovalTaskCardDetailsItemModel')).toEqual(
      expect.objectContaining({
        label: expect.any(Object),
      }),
    );
    expect(getReactionKindsForUse('ApplyTaskCardDetailsModel')).toEqual(
      expect.arrayContaining(['blockLinkage', 'fieldLinkage']),
    );
    expect(getReactionKindsForUse('ApprovalTaskCardDetailsModel')).toEqual(
      expect.arrayContaining(['blockLinkage', 'fieldLinkage']),
    );
    expect(buildPlanKeyKind({ use: 'ApplyTaskCardDetailsModel' })).toBe('block');
    expect(buildPlanKeyKind({ use: 'ApprovalTaskCardDetailsItemModel' })).toBe('fieldHost');
  });

  it('should expose reaction capabilities for approval blocks and actions', () => {
    expect(getReactionKindsForUse('ApplyFormModel')).toEqual(
      expect.arrayContaining(['fieldValue', 'blockLinkage', 'fieldLinkage']),
    );
    expect(getReactionKindsForUse('ApprovalDetailsModel')).toEqual(expect.arrayContaining(['blockLinkage']));
    expect(getReactionKindsForUse('MarkdownBlockModel')).toEqual(expect.arrayContaining(['blockLinkage']));
    expect(getReactionKindsForUse('IframeBlockModel')).toEqual(expect.arrayContaining(['blockLinkage']));
    expect(getReactionKindsForUse('ProcessFormApproveModel')).toEqual(expect.arrayContaining(['actionLinkage']));
  });

  it('should classify approval popup nodes and grids in planning key kinds', () => {
    expect(buildPlanKeyKind({ use: 'TriggerChildPageModel' })).toBe('popupPage');
    expect(buildPlanKeyKind({ use: 'ApprovalChildPageTabModel' })).toBe('popupTab');
    expect(buildPlanKeyKind({ use: 'ApprovalBlockGridModel' })).toBe('grid');
  });
});
