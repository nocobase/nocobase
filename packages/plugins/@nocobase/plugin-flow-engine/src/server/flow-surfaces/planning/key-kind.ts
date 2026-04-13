/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ACTION_BUTTON_USES,
  COLLECTION_BLOCK_USES,
  FIELD_WRAPPER_USES,
  JS_BLOCK_USES,
  STANDALONE_FIELD_NODE_USES,
  STATIC_CONTENT_BLOCK_USES,
} from '../node-use-sets';
import { throwBadRequest } from '../errors';
import { isPopupHostUse } from '../placement';
import { isFieldNodeUse } from '../service-utils';
import type { FlowSurfaceBindKey } from '../types';

export function buildPlanKeyKind(node: any, resolvedKind?: string) {
  const use = String(node?.use || '').trim();
  if (use === 'RootPageModel' || resolvedKind === 'page') {
    return 'page';
  }
  if (use === 'RootPageTabModel' || resolvedKind === 'tab') {
    return 'tab';
  }
  if (use === 'ChildPageModel') {
    return 'popupPage';
  }
  if (use === 'ChildPageTabModel') {
    return 'popupTab';
  }
  if (use === 'BlockGridModel' || resolvedKind === 'grid') {
    return 'grid';
  }
  if (isPopupHostUse(use)) {
    return 'popupHost';
  }
  if (ACTION_BUTTON_USES.has(use)) {
    return 'action';
  }
  if (FIELD_WRAPPER_USES.has(use) || STANDALONE_FIELD_NODE_USES.has(use) || isFieldNodeUse(use)) {
    return 'fieldHost';
  }
  if (
    COLLECTION_BLOCK_USES.has(use) ||
    STATIC_CONTENT_BLOCK_USES.has(use) ||
    JS_BLOCK_USES.has(use) ||
    use.endsWith('BlockModel')
  ) {
    return 'block';
  }
  return resolvedKind || 'node';
}

export function assertBindKeyKind(actionName: string, bindKey: FlowSurfaceBindKey, node: any, resolvedKind?: string) {
  if (!bindKey.expectedKind) {
    return;
  }
  const actualKind = buildPlanKeyKind(node, resolvedKind);
  const expectedKind = String(bindKey.expectedKind || '').trim();
  const matched =
    expectedKind === 'node' ||
    expectedKind === actualKind ||
    (expectedKind === 'block' && actualKind === 'block') ||
    (expectedKind === 'fieldHost' && actualKind === 'fieldHost') ||
    (expectedKind === 'popupHost' && actualKind === 'popupHost') ||
    (expectedKind === 'popupTab' && actualKind === 'popupTab') ||
    (expectedKind === 'action' && actualKind === 'action');
  if (matched) {
    return;
  }
  throwBadRequest(
    `flowSurfaces ${actionName} bindKeys key '${bindKey.key}' expected kind '${expectedKind}', got '${actualKind}'`,
  );
}
