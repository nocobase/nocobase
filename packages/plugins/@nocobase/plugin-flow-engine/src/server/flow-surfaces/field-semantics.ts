/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeApprovalSemanticUse } from './approval';
import { MULTI_VALUE_ASSOCIATION_INTERFACES } from './association-interfaces';

export { MULTI_VALUE_ASSOCIATION_INTERFACES } from './association-interfaces';

const FORM_FIELD_CONTAINER_USES = new Set([
  'FormBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'FormGridModel',
  'FormItemModel',
  'AssignFormModel',
  'AssignFormGridModel',
]);

const DETAILS_FIELD_CONTAINER_USES = new Set([
  'DetailsBlockModel',
  'DetailsGridModel',
  'DetailsItemModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'KanbanBlockModel',
  'ListItemModel',
  'GridCardItemModel',
  'KanbanCardItemModel',
]);

const FILTER_FIELD_CONTAINER_USES = new Set(['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel']);

const TABLE_FIELD_CONTAINER_USES = new Set(['TableBlockModel', 'TableColumnModel']);

export function normalizeFieldContainerKind(containerUse?: string) {
  const normalized = normalizeApprovalSemanticUse(containerUse);
  if (FORM_FIELD_CONTAINER_USES.has(normalized)) {
    return 'form';
  }
  if (DETAILS_FIELD_CONTAINER_USES.has(normalized)) {
    return 'details';
  }
  if (FILTER_FIELD_CONTAINER_USES.has(normalized)) {
    return 'filter-form';
  }
  if (TABLE_FIELD_CONTAINER_USES.has(normalized)) {
    return 'table';
  }
  return null;
}

export function shouldUseAssociationTitleTextDisplay(input: {
  containerUse?: string;
  associationPathName?: string;
  fieldInterface?: string | null;
}) {
  const containerKind = normalizeFieldContainerKind(input.containerUse);
  return (
    (containerKind === 'table' || containerKind === 'details') &&
    !String(input.associationPathName || '').trim() &&
    MULTI_VALUE_ASSOCIATION_INTERFACES.has(String(input.fieldInterface || '').trim())
  );
}
