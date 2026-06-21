/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const APPROVAL_PAGE_MODEL_USES = ['TriggerChildPageModel', 'ApprovalChildPageModel'] as const;
export const APPROVAL_TAB_MODEL_USES = ['TriggerChildPageTabModel', 'ApprovalChildPageTabModel'] as const;
export const APPROVAL_BLOCK_GRID_USES = ['TriggerBlockGridModel', 'ApprovalBlockGridModel'] as const;
export const APPROVAL_FORM_GRID_USES = ['PatternFormGridModel'] as const;
export const APPROVAL_TASK_CARD_GRID_USES = ['ApplyTaskCardGridModel', 'ApprovalTaskCardGridModel'] as const;
export const APPROVAL_DETAILS_GRID_USES = ['ApprovalDetailsGridModel', ...APPROVAL_TASK_CARD_GRID_USES] as const;

export const APPROVAL_FORM_BLOCK_USES = ['ApplyFormModel', 'ProcessFormModel'] as const;
export const APPROVAL_DETAILS_BLOCK_USES = [
  'ApprovalDetailsModel',
  'ApplyTaskCardDetailsModel',
  'ApprovalTaskCardDetailsModel',
] as const;

export const APPROVAL_FIELD_WRAPPER_USES = [
  'PatternFormItemModel',
  'ApprovalDetailsItemModel',
  'ApplyTaskCardDetailsItemModel',
  'ApprovalTaskCardDetailsItemModel',
] as const;

export const APPROVAL_ACTION_CONTAINER_USES = ['ApplyFormModel', 'ProcessFormModel'] as const;

const APPROVAL_FORM_CONTAINER_USE_SET = new Set<string>([
  ...APPROVAL_FORM_BLOCK_USES,
  ...APPROVAL_FORM_GRID_USES,
  'PatternFormItemModel',
]);

const APPROVAL_SEMANTIC_USE_ALIASES: Record<string, string> = {
  TriggerChildPageModel: 'ChildPageModel',
  ApprovalChildPageModel: 'ChildPageModel',
  TriggerChildPageTabModel: 'ChildPageTabModel',
  ApprovalChildPageTabModel: 'ChildPageTabModel',
  TriggerBlockGridModel: 'BlockGridModel',
  ApprovalBlockGridModel: 'BlockGridModel',
  PatternFormGridModel: 'FormGridModel',
  ApprovalDetailsGridModel: 'DetailsGridModel',
  ApplyTaskCardGridModel: 'DetailsGridModel',
  ApprovalTaskCardGridModel: 'DetailsGridModel',
  ApplyFormModel: 'FormBlockModel',
  ProcessFormModel: 'FormBlockModel',
  ApprovalDetailsModel: 'DetailsBlockModel',
  ApplyTaskCardDetailsModel: 'DetailsBlockModel',
  ApprovalTaskCardDetailsModel: 'DetailsBlockModel',
  PatternFormItemModel: 'FormItemModel',
  ApprovalDetailsItemModel: 'DetailsItemModel',
  ApplyTaskCardDetailsItemModel: 'DetailsItemModel',
  ApprovalTaskCardDetailsItemModel: 'DetailsItemModel',
  PatternFormAssociationFieldGroupModel: 'FormAssociationFieldGroupModel',
  ApprovalDetailsAssociationFieldGroupModel: 'DetailsAssociationFieldGroupModel',
  ApplyTaskCardDetailsAssociationFieldGroupModel: 'DetailsAssociationFieldGroupModel',
  ApprovalTaskCardDetailsAssociationFieldGroupModel: 'DetailsAssociationFieldGroupModel',
};

const APPROVAL_DEFAULT_GRID_USE_BY_OWNER_USE: Record<string, string> = {
  TriggerChildPageTabModel: 'TriggerBlockGridModel',
  ApprovalChildPageTabModel: 'ApprovalBlockGridModel',
  ApplyFormModel: 'PatternFormGridModel',
  ProcessFormModel: 'PatternFormGridModel',
  ApprovalDetailsModel: 'ApprovalDetailsGridModel',
  ApplyTaskCardDetailsModel: 'ApplyTaskCardGridModel',
  ApprovalTaskCardDetailsModel: 'ApprovalTaskCardGridModel',
};

const APPROVAL_FIELD_WRAPPER_USE_BY_CONTAINER_USE: Record<string, string> = {
  ApplyFormModel: 'PatternFormItemModel',
  ProcessFormModel: 'PatternFormItemModel',
  PatternFormGridModel: 'PatternFormItemModel',
  ApprovalDetailsModel: 'ApprovalDetailsItemModel',
  ApprovalDetailsGridModel: 'ApprovalDetailsItemModel',
  ApplyTaskCardDetailsModel: 'ApplyTaskCardDetailsItemModel',
  ApplyTaskCardGridModel: 'ApplyTaskCardDetailsItemModel',
  ApprovalTaskCardDetailsModel: 'ApprovalTaskCardDetailsItemModel',
  ApprovalTaskCardGridModel: 'ApprovalTaskCardDetailsItemModel',
};

export function normalizeApprovalSemanticUse(use?: string) {
  const normalized = String(use || '').trim();
  if (!normalized) {
    return normalized;
  }
  return APPROVAL_SEMANTIC_USE_ALIASES[normalized] || normalized;
}

export function getApprovalDefaultGridUse(use?: string) {
  const normalized = String(use || '').trim();
  return normalized ? APPROVAL_DEFAULT_GRID_USE_BY_OWNER_USE[normalized] : undefined;
}

export function getApprovalFieldWrapperUse(containerUse?: string) {
  const normalized = String(containerUse || '').trim();
  return normalized ? APPROVAL_FIELD_WRAPPER_USE_BY_CONTAINER_USE[normalized] : undefined;
}

export function isApprovalFormContainerUse(use?: string) {
  return APPROVAL_FORM_CONTAINER_USE_SET.has(String(use || '').trim());
}

export function isApprovalTaskCardGridUse(use?: string) {
  return APPROVAL_TASK_CARD_GRID_USES.includes(
    String(use || '').trim() as (typeof APPROVAL_TASK_CARD_GRID_USES)[number],
  );
}
