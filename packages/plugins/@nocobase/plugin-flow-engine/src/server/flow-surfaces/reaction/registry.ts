/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceFieldLinkageScene,
  FlowSurfaceReactionKind,
  FlowSurfaceReactionScene,
  FlowSurfaceReactionSlot,
} from './types';

export const FLOW_SURFACE_REACTION_SLOT_REGISTRY = {
  fieldValue: {
    form: {
      flowKey: 'formModelSettings',
      stepKey: 'assignRules',
      valuePath: 'value',
    },
  },
  blockLinkage: {
    block: {
      flowKey: 'cardSettings',
      stepKey: 'linkageRules',
      valuePath: null,
    },
  },
  fieldLinkage: {
    form: {
      flowKey: 'eventSettings',
      stepKey: 'linkageRules',
      valuePath: 'value',
    },
    details: {
      flowKey: 'detailsSettings',
      stepKey: 'linkageRules',
      valuePath: 'value',
    },
    subForm: {
      flowKey: 'eventSettings',
      stepKey: 'linkageRules',
      valuePath: 'value',
    },
  },
  actionLinkage: {
    action: {
      flowKey: 'buttonSettings',
      stepKey: 'linkageRules',
      valuePath: null,
    },
  },
} as const satisfies Record<
  FlowSurfaceReactionKind,
  Partial<Record<FlowSurfaceReactionScene, FlowSurfaceReactionSlot>>
>;

export const FLOW_SURFACE_REACTION_SUPPORTED_KINDS_BY_USE = {
  CreateFormModel: ['fieldValue', 'blockLinkage', 'fieldLinkage'],
  EditFormModel: ['fieldValue', 'blockLinkage', 'fieldLinkage'],
  FormBlockModel: ['blockLinkage', 'fieldLinkage'],
  ApplyFormModel: ['fieldValue', 'blockLinkage', 'fieldLinkage'],
  ProcessFormModel: ['fieldValue', 'blockLinkage', 'fieldLinkage'],
  DetailsBlockModel: ['blockLinkage', 'fieldLinkage'],
  ApprovalDetailsModel: ['blockLinkage', 'fieldLinkage'],
  ApplyTaskCardDetailsModel: ['blockLinkage', 'fieldLinkage'],
  ApprovalTaskCardDetailsModel: ['blockLinkage', 'fieldLinkage'],
  TableBlockModel: ['blockLinkage'],
  ListBlockModel: ['blockLinkage'],
  GridCardBlockModel: ['blockLinkage'],
  MapBlockModel: ['blockLinkage'],
  CommentsBlockModel: ['blockLinkage'],
  ChartBlockModel: ['blockLinkage'],
  ActionPanelBlockModel: ['blockLinkage'],
  AddNewActionModel: ['actionLinkage'],
  ViewActionModel: ['actionLinkage'],
  EditActionModel: ['actionLinkage'],
  PopupCollectionActionModel: ['actionLinkage'],
  DeleteActionModel: ['actionLinkage'],
  UpdateRecordActionModel: ['actionLinkage'],
  BulkUpdateActionModel: ['actionLinkage'],
  BulkDeleteActionModel: ['actionLinkage'],
  BulkEditActionModel: ['actionLinkage'],
  DuplicateActionModel: ['actionLinkage'],
  AddChildActionModel: ['actionLinkage'],
  MailSendActionModel: ['actionLinkage'],
  JSCollectionActionModel: ['actionLinkage'],
  JSRecordActionModel: ['actionLinkage'],
  JSFormActionModel: ['actionLinkage'],
  JSItemActionModel: ['actionLinkage'],
  FilterFormJSActionModel: ['actionLinkage'],
  JSActionModel: ['actionLinkage'],
  LinkActionModel: ['actionLinkage'],
  ExportActionModel: ['actionLinkage'],
  ExportAttachmentActionModel: ['actionLinkage'],
  ImportActionModel: ['actionLinkage'],
  CollectionTriggerWorkflowActionModel: ['actionLinkage'],
  RecordTriggerWorkflowActionModel: ['actionLinkage'],
  FormTriggerWorkflowActionModel: ['actionLinkage'],
  WorkbenchTriggerWorkflowActionModel: ['actionLinkage'],
  RefreshActionModel: ['actionLinkage'],
  FilterActionModel: ['actionLinkage'],
  ExpandCollapseActionModel: ['actionLinkage'],
  FormSubmitActionModel: ['actionLinkage'],
  ApplyFormSubmitModel: ['actionLinkage'],
  ApplyFormSaveDraftModel: ['actionLinkage'],
  ApplyFormWithdrawModel: ['actionLinkage'],
  ProcessFormApproveModel: ['actionLinkage'],
  ProcessFormRejectModel: ['actionLinkage'],
  ProcessFormReturnModel: ['actionLinkage'],
  ProcessFormDelegateModel: ['actionLinkage'],
  ProcessFormAddAssigneeModel: ['actionLinkage'],
  FilterFormSubmitActionModel: ['actionLinkage'],
  FilterFormResetActionModel: ['actionLinkage'],
  FilterFormCollapseActionModel: ['actionLinkage'],
  SubFormFieldModel: ['fieldLinkage'],
  SubFormListFieldModel: ['fieldLinkage'],
} as const satisfies Record<string, readonly FlowSurfaceReactionKind[]>;

export const FLOW_SURFACE_BLOCK_LINKAGE_STATES = ['visible', 'hidden'] as const;

export const FLOW_SURFACE_ACTION_LINKAGE_STATES = ['visible', 'hidden', 'hiddenText', 'enabled', 'disabled'] as const;

export const FLOW_SURFACE_FIELD_LINKAGE_STATES_BY_SCENE = {
  form: ['visible', 'hidden', 'hiddenReservedValue', 'required', 'notRequired', 'disabled', 'enabled'],
  details: ['visible', 'hidden', 'hiddenReservedValue'],
  subForm: ['visible', 'hidden', 'hiddenReservedValue', 'required', 'notRequired', 'disabled', 'enabled'],
} as const satisfies Record<FlowSurfaceFieldLinkageScene, readonly string[]>;

export const FLOW_SURFACE_FIELD_LINKAGE_ACTION_TYPES_BY_SCENE = {
  form: ['setFieldState', 'assignField', 'setFieldDefaultValue', 'runjs'],
  details: ['setFieldState', 'runjs'],
  subForm: ['setFieldState', 'assignField', 'runjs'],
} as const satisfies Record<FlowSurfaceFieldLinkageScene, readonly string[]>;

export const FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES = {
  block: {
    setBlockState: 'linkageSetBlockProps',
    runjs: 'linkageRunjs',
  },
  action: {
    setActionState: 'linkageSetActionProps',
    runjs: 'linkageRunjs',
  },
  form: {
    setFieldState: 'linkageSetFieldProps',
    assignField: 'linkageAssignField',
    setFieldDefaultValue: 'setFieldsDefaultValue',
    runjs: 'linkageRunjs',
  },
  details: {
    setFieldState: 'linkageSetDetailsFieldProps',
    runjs: 'linkageRunjs',
  },
  subForm: {
    setFieldState: 'subFormLinkageSetFieldProps',
    assignField: 'subFormLinkageAssignField',
    runjs: 'linkageRunjs',
  },
} as const;

export function getReactionKindsForUse(use?: string): FlowSurfaceReactionKind[] {
  if (!use) {
    return [];
  }
  return [...(FLOW_SURFACE_REACTION_SUPPORTED_KINDS_BY_USE[use] || [])];
}

export function getReactionSlot(
  kind: FlowSurfaceReactionKind,
  scene: FlowSurfaceReactionScene,
): FlowSurfaceReactionSlot | undefined {
  return FLOW_SURFACE_REACTION_SLOT_REGISTRY[kind]?.[scene];
}
