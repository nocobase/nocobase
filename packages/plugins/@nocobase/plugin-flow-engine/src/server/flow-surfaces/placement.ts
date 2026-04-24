/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isApprovalTaskCardGridUse, normalizeApprovalSemanticUse } from './approval';
import { FIELD_WRAPPER_USES } from './node-use-sets';
import type { FlowSurfaceResolvedTarget } from './types';

export const FLOW_SURFACE_POPUP_HOST_USES = new Set([
  'AddNewActionModel',
  'ViewActionModel',
  'EditActionModel',
  'PopupCollectionActionModel',
  'CalendarQuickCreateActionModel',
  'CalendarEventViewActionModel',
  'KanbanQuickCreateActionModel',
  'KanbanCardViewActionModel',
  'ClickableFieldModel',
  'DisplayTextFieldModel',
  'DisplayEnumFieldModel',
  'DisplayDateTimeFieldModel',
  'DisplayNumberFieldModel',
  'DisplayPercentFieldModel',
  'DisplayTimeFieldModel',
  'DisplayAssociationFieldModel',
  'DisplayAssociationField',
  'DisplayTitleFieldModel',
  'DisplayURLFieldModel',
]);

export const FLOW_SURFACE_FORM_BLOCK_USES = new Set([
  'FormBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'AssignFormModel',
]);
export const FLOW_SURFACE_DETAILS_BLOCK_USES = new Set(['DetailsBlockModel']);
export const FLOW_SURFACE_FILTER_FORM_BLOCK_USES = new Set(['FilterFormBlockModel']);
export const FLOW_SURFACE_GRID_USES = new Set([
  'BlockGridModel',
  'FormGridModel',
  'DetailsGridModel',
  'FilterFormGridModel',
  'AssignFormGridModel',
]);
export const FLOW_SURFACE_FIELD_WRAPPER_USES = FIELD_WRAPPER_USES;
export const FLOW_SURFACE_PAGE_MODEL_USES = new Set([
  'RootPageModel',
  'ChildPageModel',
  'RootPageTabModel',
  'ChildPageTabModel',
]);
export const FLOW_SURFACE_PAGE_ROUTE_TYPES = new Set(['page', 'flowPage']);

export function isPopupHostUse(use?: string) {
  return FLOW_SURFACE_POPUP_HOST_USES.has(use || '');
}

export function isFormBlockUse(use?: string) {
  return FLOW_SURFACE_FORM_BLOCK_USES.has(normalizeApprovalSemanticUse(use) || '');
}

export function isDetailsBlockUse(use?: string) {
  return FLOW_SURFACE_DETAILS_BLOCK_USES.has(normalizeApprovalSemanticUse(use) || '');
}

export function isFilterFormBlockUse(use?: string) {
  return FLOW_SURFACE_FILTER_FORM_BLOCK_USES.has(normalizeApprovalSemanticUse(use) || '');
}

export function isGridUse(use?: string) {
  return FLOW_SURFACE_GRID_USES.has(normalizeApprovalSemanticUse(use) || '');
}

export function isFieldWrapperUse(use?: string) {
  return FLOW_SURFACE_FIELD_WRAPPER_USES.has(use || '');
}

export function isPageModelUse(use?: string) {
  return FLOW_SURFACE_PAGE_MODEL_USES.has(normalizeApprovalSemanticUse(use) || '');
}

export function isPageRouteType(routeLike?: any) {
  const type = routeLike?.get?.('type') || routeLike?.type;
  return FLOW_SURFACE_PAGE_ROUTE_TYPES.has(type || '');
}

export function isTabsRouteType(routeLike?: any) {
  const type = routeLike?.get?.('type') || routeLike?.type;
  return type === 'tabs';
}

export function canCatalogAddBlock(input: {
  node?: any;
  resolved?: Pick<FlowSurfaceResolvedTarget, 'route' | 'pageRoute' | 'tabRoute'> | null;
}) {
  const node = input.node;
  const resolved = input.resolved;

  if (!node && !resolved) {
    return true;
  }

  if (isApprovalTaskCardGridUse(node?.use)) {
    return false;
  }

  if (isGridUse(node?.use) || isPageModelUse(node?.use)) {
    return true;
  }

  if (isPopupHostUse(node?.use) || normalizeApprovalSemanticUse(node?.subModels?.page?.use) === 'ChildPageModel') {
    return true;
  }

  if (
    (!node?.use && isTabsRouteType(resolved?.tabRoute)) ||
    (node?.use === 'RouteModel' && isTabsRouteType(resolved?.route))
  ) {
    return true;
  }

  if (
    (!node?.use && isPageRouteType(resolved?.pageRoute)) ||
    (node?.use === 'RouteModel' && isPageRouteType(resolved?.route))
  ) {
    return true;
  }

  return false;
}

export function isFieldContainerUse(parentUse?: string, subKey?: string) {
  if (subKey === 'columns' && parentUse === 'TableBlockModel') {
    return true;
  }
  return (
    subKey === 'items' &&
    (isGridUse(parentUse) ||
      isFormBlockUse(parentUse) ||
      isDetailsBlockUse(parentUse) ||
      isFilterFormBlockUse(parentUse))
  );
}

export function isBlockContainerUse(parentUse?: string, subKey?: string) {
  return (
    subKey === 'items' && ((isGridUse(parentUse) && !isApprovalTaskCardGridUse(parentUse)) || isPopupHostUse(parentUse))
  );
}

export function isActionContainerUse(parentUse?: string) {
  return (
    [
      'TableBlockModel',
      'CalendarBlockModel',
      'KanbanBlockModel',
      'TableActionsColumnModel',
      'ListBlockModel',
      'GridCardBlockModel',
      'ListItemModel',
      'GridCardItemModel',
      'ActionPanelBlockModel',
    ].includes(parentUse || '') ||
    isFormBlockUse(parentUse) ||
    isDetailsBlockUse(parentUse) ||
    isFilterFormBlockUse(parentUse)
  );
}
