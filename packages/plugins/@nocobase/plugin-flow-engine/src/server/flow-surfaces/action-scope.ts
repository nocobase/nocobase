/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceActionScope } from './types';
import { APPROVAL_ACTION_CONTAINER_USES } from './approval';
import { FlowSurfaceBadRequestError } from './errors';

const ACTION_SCOPE_SET = new Set<FlowSurfaceActionScope>(['block', 'record', 'form', 'filterForm', 'actionPanel']);

export const TABLE_BLOCK_ACTION_CONTAINER_USES = ['TableBlockModel'];
export const TABLE_ROW_ACTION_CONTAINER_USES = ['TableActionsColumnModel'];
export const LIST_BLOCK_ACTION_CONTAINER_USES = ['ListBlockModel', 'GridCardBlockModel'];
export const LIST_RECORD_ACTION_CONTAINER_USES = ['ListItemModel', 'GridCardItemModel'];
export const DETAILS_ACTION_CONTAINER_USES = ['DetailsBlockModel'];
export const FORM_ACTION_CONTAINER_USES = ['FormBlockModel', 'CreateFormModel', 'EditFormModel'];
export const FILTER_FORM_ACTION_CONTAINER_USES = ['FilterFormBlockModel'];
export const ACTION_PANEL_ACTION_CONTAINER_USES = ['ActionPanelBlockModel'];

export const COLLECTION_BLOCK_ACTION_CONTAINER_USES = [
  ...TABLE_BLOCK_ACTION_CONTAINER_USES,
  ...LIST_BLOCK_ACTION_CONTAINER_USES,
];
export const RECORD_ACTION_CONTAINER_USES = [
  ...TABLE_ROW_ACTION_CONTAINER_USES,
  ...DETAILS_ACTION_CONTAINER_USES,
  ...LIST_RECORD_ACTION_CONTAINER_USES,
];

export const ACTION_CONTAINER_SCOPE_BY_USE: Record<string, FlowSurfaceActionScope> = Object.fromEntries([
  ...COLLECTION_BLOCK_ACTION_CONTAINER_USES.map((use) => [use, 'block'] as const),
  ...RECORD_ACTION_CONTAINER_USES.map((use) => [use, 'record'] as const),
  ...FORM_ACTION_CONTAINER_USES.map((use) => [use, 'form'] as const),
  ...FILTER_FORM_ACTION_CONTAINER_USES.map((use) => [use, 'filterForm'] as const),
  ...ACTION_PANEL_ACTION_CONTAINER_USES.map((use) => [use, 'actionPanel'] as const),
  ...APPROVAL_ACTION_CONTAINER_USES.map((use) => [use, 'form'] as const),
]);

export function getActionContainerScope(containerUse?: string): FlowSurfaceActionScope | null {
  return ACTION_CONTAINER_SCOPE_BY_USE[String(containerUse || '').trim()] || null;
}

export function assertKnownActionContainerUse(input: { containerUse?: string; context: string }) {
  if (!input.containerUse) {
    return;
  }
  if (!getActionContainerScope(input.containerUse)) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces ${input.context} container '${input.containerUse}' is not a supported public action container`,
    );
  }
}

export function normalizeActionScope(scope: any): FlowSurfaceActionScope | undefined {
  if (typeof scope === 'undefined' || scope === null || scope === '') {
    return undefined;
  }
  const normalized = String(scope).trim();
  if (!normalized) {
    return undefined;
  }
  if (normalized === 'row') {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces action scope 'row' is no longer supported; use 'record' and place record actions under 'recordActions' or a record action container`,
    );
  }
  if (!ACTION_SCOPE_SET.has(normalized as FlowSurfaceActionScope)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces action scope '${normalized}' is not supported`);
  }
  return normalized as FlowSurfaceActionScope;
}

export function assertActionScopeMatchesContainer(input: {
  actionScope: FlowSurfaceActionScope;
  containerUse?: string;
  context: string;
}) {
  assertKnownActionContainerUse({
    containerUse: input.containerUse,
    context: input.context,
  });
  const expectedScope = getActionContainerScope(input.containerUse);
  if (expectedScope && input.actionScope !== expectedScope) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces ${input.context} scope '${input.actionScope}' is not allowed under '${input.containerUse}', expected '${expectedScope}'`,
    );
  }
}

export function assertRequestedActionScope(input: {
  requestedScope?: FlowSurfaceActionScope;
  resolvedScope: FlowSurfaceActionScope;
  containerUse?: string;
  context: string;
}) {
  assertActionScopeMatchesContainer({
    actionScope: input.resolvedScope,
    containerUse: input.containerUse,
    context: input.context,
  });
  if (input.requestedScope && input.requestedScope !== input.resolvedScope) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces ${input.context} scope '${input.requestedScope}' does not match resolved action scope '${input.resolvedScope}'`,
    );
  }
}
