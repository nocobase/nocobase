/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

export const FLOW_SURFACE_SINGLE_SCOPE_TITLE_CLEANUP_DATA_BLOCK_TYPES = new Set([
  'table',
  'calendar',
  'kanban',
  'details',
  'list',
  'gridCard',
]);

export function isFlowSurfaceNonTemplateTitleCleanupDataBlock(block: any) {
  const blockType = String(block?.type || '').trim();
  return FLOW_SURFACE_SINGLE_SCOPE_TITLE_CLEANUP_DATA_BLOCK_TYPES.has(blockType) && _.isUndefined(block?.template);
}

export function countFlowSurfaceNonTemplateTitleCleanupDataBlocks(blocks: any[]) {
  return _.castArray(blocks || []).filter((block) => isFlowSurfaceNonTemplateTitleCleanupDataBlock(block)).length;
}
