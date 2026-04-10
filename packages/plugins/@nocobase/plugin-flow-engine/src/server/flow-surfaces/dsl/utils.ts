/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type {
  FlowSurfaceDslAction,
  FlowSurfaceDslBlock,
  FlowSurfaceDslEntityRef,
  FlowSurfaceDslField,
  FlowSurfacePatchDslChange,
} from './types';

export const FLOW_SURFACE_DSL_DEFAULT_CRUD_ACTION_TYPES = new Set(['addNew', 'view', 'edit']);
export const FLOW_SURFACE_DSL_PATCH_SURFACE_DEFAULT_TARGET_OPS = new Set([
  'page.destroy',
  'tab.add',
  'block.add',
  'settings.update',
  'layout.replace',
]);

export function normalizeFlowSurfaceDslToken(value: any, fallback = 'item') {
  const normalized = String(value || '')
    .trim()
    .replace(/[.[\](){}]+/g, '_')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

export function buildFlowSurfaceDslFieldRef(blockId: string, field: FlowSurfaceDslField, index: number) {
  const explicitId = typeof field.id === 'string' ? field.id.trim() : '';
  if (explicitId) {
    return explicitId;
  }
  const suffix = field.fieldPath || field.type || `field_${index + 1}`;
  return `${blockId}__field__${normalizeFlowSurfaceDslToken(suffix, `field_${index + 1}`)}`;
}

export function buildFlowSurfaceDslActionRef(
  blockId: string,
  scope: 'actions' | 'recordActions',
  action: FlowSurfaceDslAction,
  index: number,
) {
  const explicitId = typeof action.id === 'string' ? action.id.trim() : '';
  if (explicitId) {
    return explicitId;
  }
  const prefix = scope === 'recordActions' ? 'recordAction' : 'action';
  return `${blockId}__${prefix}__${normalizeFlowSurfaceDslToken(action.type, `${prefix}_${index + 1}`)}`;
}

export function buildFlowSurfaceDslChangeStepId(change: FlowSurfacePatchDslChange, index: number) {
  const explicitId = typeof change.id === 'string' ? change.id.trim() : '';
  if (explicitId) {
    return explicitId;
  }
  return `dslChange__${normalizeFlowSurfaceDslToken(change.op, `change_${index + 1}`)}__${index + 1}`;
}

export function isFlowSurfaceDslDefaultCrudActionType(type: any) {
  return FLOW_SURFACE_DSL_DEFAULT_CRUD_ACTION_TYPES.has(String(type || '').trim());
}

export function buildFlowSurfaceDslScopedRef(scopePrefix: string | undefined, ref: string) {
  const normalizedRef = String(ref || '').trim();
  if (!normalizedRef) {
    return '';
  }
  const normalizedPrefix = String(scopePrefix || '').trim();
  return normalizedPrefix ? `${normalizedPrefix}.${normalizedRef}` : normalizedRef;
}

export function buildFlowSurfaceDslPopupScopePrefix(actionRef: string) {
  return buildFlowSurfaceDslScopedRef(actionRef, 'popup');
}

export function buildFlowSurfaceDslPopupStepId(
  kind: 'title' | 'compose',
  actionRef: string,
  popupId: string,
  index: number,
) {
  return `dslPopup__${kind}__${normalizeFlowSurfaceDslToken(
    actionRef,
    `popup_${index + 1}`,
  )}__${normalizeFlowSurfaceDslToken(popupId, `popup_${index + 1}`)}__${index + 1}`;
}

export function buildFlowSurfaceDslEntityRefKey(entityRef: FlowSurfaceDslEntityRef) {
  if (_.isPlainObject(entityRef) && typeof (entityRef as any).id === 'string') {
    const id = String((entityRef as any).id || '').trim();
    const anchor = String((entityRef as any).anchor || '').trim();
    return anchor ? `${id}.${anchor}` : id;
  }
  return '';
}

export function iterateFlowSurfaceDslBlocks(
  pageBlocks: FlowSurfaceDslBlock[],
  popups: Array<{ id: string; blocks?: FlowSurfaceDslBlock[] }>,
) {
  const entries: Array<{ scope: 'page' | 'popup'; popupId?: string; block: FlowSurfaceDslBlock }> = [];
  for (const block of pageBlocks || []) {
    entries.push({ scope: 'page', block });
  }
  for (const popup of popups || []) {
    for (const block of popup.blocks || []) {
      entries.push({ scope: 'popup', popupId: popup.id, block });
    }
  }
  return entries;
}
