/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceActionScope } from '../types';

export const APPROVAL_FLOW_SURFACE_OWNER_PLUGIN = '@nocobase/plugin-workflow-approval';

export type ApprovalFlowSurfaceBlockCatalogSpec = {
  key: string;
  label: string;
  use: string;
  requiredInitParams?: string[];
  allowedContainerUses: string[];
  createSupported?: boolean;
};

export type ApprovalFlowSurfaceActionCatalogSpec = {
  publicKey: string;
  label: string;
  scope: FlowSurfaceActionScope;
  scene?: string;
  use: string;
  allowedContainerUses: string[];
  createSupported?: boolean;
};

export const APPROVAL_BLOCK_CATALOG_SPECS: ApprovalFlowSurfaceBlockCatalogSpec[] = [
  {
    key: 'approvalInitiator',
    label: 'Approval initiator',
    use: 'ApplyFormModel',
    requiredInitParams: ['dataSourceKey', 'collectionName'],
    allowedContainerUses: ['TriggerBlockGridModel'],
    createSupported: true,
  },
  {
    key: 'approvalApprover',
    label: 'Approval approver',
    use: 'ProcessFormModel',
    requiredInitParams: ['dataSourceKey', 'collectionName'],
    allowedContainerUses: ['ApprovalBlockGridModel'],
    createSupported: true,
  },
  {
    key: 'approvalInformation',
    label: 'Approval information',
    use: 'ApprovalDetailsModel',
    requiredInitParams: ['dataSourceKey', 'collectionName'],
    allowedContainerUses: ['ApprovalBlockGridModel'],
    createSupported: true,
  },
];

export const APPROVAL_ACTION_CATALOG_SPECS: ApprovalFlowSurfaceActionCatalogSpec[] = [
  {
    publicKey: 'approvalSubmit',
    label: 'Submit',
    scope: 'form',
    scene: 'form',
    use: 'ApplyFormSubmitModel',
    allowedContainerUses: ['ApplyFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalSaveDraft',
    label: 'Save draft',
    scope: 'form',
    scene: 'form',
    use: 'ApplyFormSaveDraftModel',
    allowedContainerUses: ['ApplyFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalWithdraw',
    label: 'Withdraw',
    scope: 'form',
    scene: 'form',
    use: 'ApplyFormWithdrawModel',
    allowedContainerUses: ['ApplyFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalApprove',
    label: 'Approve',
    scope: 'form',
    scene: 'form',
    use: 'ProcessFormApproveModel',
    allowedContainerUses: ['ProcessFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalReject',
    label: 'Reject',
    scope: 'form',
    scene: 'form',
    use: 'ProcessFormRejectModel',
    allowedContainerUses: ['ProcessFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalReturn',
    label: 'Return',
    scope: 'form',
    scene: 'form',
    use: 'ProcessFormReturnModel',
    allowedContainerUses: ['ProcessFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalDelegate',
    label: 'Delegate',
    scope: 'form',
    scene: 'form',
    use: 'ProcessFormDelegateModel',
    allowedContainerUses: ['ProcessFormModel'],
    createSupported: true,
  },
  {
    publicKey: 'approvalAddAssignee',
    label: 'Add assignee',
    scope: 'form',
    scene: 'form',
    use: 'ProcessFormAddAssigneeModel',
    allowedContainerUses: ['ProcessFormModel'],
    createSupported: true,
  },
];

export const APPROVAL_BLOCK_PUBLIC_KEYS = APPROVAL_BLOCK_CATALOG_SPECS.map((item) => item.key);

export const APPROVAL_ACTION_PUBLIC_KEYS = APPROVAL_ACTION_CATALOG_SPECS.map((item) => item.publicKey);

export const APPROVAL_BLOCK_OWNER_PLUGIN_BY_USE = new Map(
  APPROVAL_BLOCK_CATALOG_SPECS.map((item) => [item.use, APPROVAL_FLOW_SURFACE_OWNER_PLUGIN]),
);

export const APPROVAL_ACTION_OWNER_PLUGIN_BY_USE = new Map(
  APPROVAL_ACTION_CATALOG_SPECS.map((item) => [item.use, APPROVAL_FLOW_SURFACE_OWNER_PLUGIN]),
);
