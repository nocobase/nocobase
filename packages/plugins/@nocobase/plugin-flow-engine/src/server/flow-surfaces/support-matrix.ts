/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FormalFlowSurfaceBlockKey =
  | 'js-block'
  | 'table'
  | 'calendar'
  | 'kanban'
  | 'create-form'
  | 'edit-form'
  | 'details'
  | 'filter-form'
  | 'list'
  | 'grid-card'
  | 'markdown'
  | 'iframe'
  | 'map'
  | 'chart'
  | 'comments'
  | 'action-panel';

export type FlowSurfaceBlockSupportEntry = {
  key: string;
  formalKey?: FormalFlowSurfaceBlockKey;
  label: string;
  modelUse: string;
  ownerPlugin: string;
  topLevelAddable: boolean;
  formalBuiltin: boolean;
  fixtureCaptured: boolean;
  readbackSupported: boolean;
  createSupported: boolean;
};

export type FormalFlowSurfaceBlockSupportEntry = FlowSurfaceBlockSupportEntry & {
  formalKey: FormalFlowSurfaceBlockKey;
};

export const FLOW_SURFACE_BLOCK_SUPPORT_MATRIX: FlowSurfaceBlockSupportEntry[] = [
  {
    key: 'jsBlock',
    formalKey: 'js-block',
    label: 'JS block',
    modelUse: 'JSBlockModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'table',
    formalKey: 'table',
    label: 'Table',
    modelUse: 'TableBlockModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'calendar',
    formalKey: 'calendar',
    label: 'Calendar',
    modelUse: 'CalendarBlockModel',
    ownerPlugin: '@nocobase/plugin-calendar',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'kanban',
    formalKey: 'kanban',
    label: 'Kanban',
    modelUse: 'KanbanBlockModel',
    ownerPlugin: '@nocobase/plugin-kanban',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'createForm',
    formalKey: 'create-form',
    label: 'Form (Add new)',
    modelUse: 'CreateFormModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'editForm',
    formalKey: 'edit-form',
    label: 'Form (Edit)',
    modelUse: 'EditFormModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'form',
    label: 'Form',
    modelUse: 'FormBlockModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: false,
    formalBuiltin: false,
    fixtureCaptured: false,
    readbackSupported: true,
    createSupported: false,
  },
  {
    key: 'details',
    formalKey: 'details',
    label: 'Details',
    modelUse: 'DetailsBlockModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'filterForm',
    formalKey: 'filter-form',
    label: 'Filter form',
    modelUse: 'FilterFormBlockModel',
    ownerPlugin: '@nocobase/core/client',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'list',
    formalKey: 'list',
    label: 'List',
    modelUse: 'ListBlockModel',
    ownerPlugin: '@nocobase/plugin-block-list',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'gridCard',
    formalKey: 'grid-card',
    label: 'Grid card',
    modelUse: 'GridCardBlockModel',
    ownerPlugin: '@nocobase/plugin-block-grid-card',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'markdown',
    formalKey: 'markdown',
    label: 'Markdown',
    modelUse: 'MarkdownBlockModel',
    ownerPlugin: '@nocobase/plugin-block-markdown',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'iframe',
    formalKey: 'iframe',
    label: 'Iframe',
    modelUse: 'IframeBlockModel',
    ownerPlugin: '@nocobase/plugin-block-iframe',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'map',
    formalKey: 'map',
    label: 'Map',
    modelUse: 'MapBlockModel',
    ownerPlugin: '@nocobase/plugin-map',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: false,
  },
  {
    key: 'chart',
    formalKey: 'chart',
    label: 'Chart',
    modelUse: 'ChartBlockModel',
    ownerPlugin: '@nocobase/plugin-data-visualization',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
  {
    key: 'comments',
    formalKey: 'comments',
    label: 'Comments',
    modelUse: 'CommentsBlockModel',
    ownerPlugin: '@nocobase/plugin-comments',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: false,
  },
  {
    key: 'actionPanel',
    formalKey: 'action-panel',
    label: 'Action panel',
    modelUse: 'ActionPanelBlockModel',
    ownerPlugin: '@nocobase/plugin-block-workbench',
    topLevelAddable: true,
    formalBuiltin: true,
    fixtureCaptured: true,
    readbackSupported: true,
    createSupported: true,
  },
];

function hasFormalFlowSurfaceBlockKey(
  entry: FlowSurfaceBlockSupportEntry,
): entry is FormalFlowSurfaceBlockSupportEntry {
  return entry.formalBuiltin && !!entry.formalKey;
}

export const FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX =
  FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.filter(hasFormalFlowSurfaceBlockKey);

export const FORMAL_FLOW_SURFACE_BLOCK_KEYS = FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map(
  (entry) => entry.formalKey,
) as FormalFlowSurfaceBlockKey[];

export const FLOW_SURFACE_BLOCK_SUPPORT_BY_KEY = new Map(
  FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => [entry.key, entry]),
);

export const FLOW_SURFACE_BLOCK_SUPPORT_BY_USE = new Map(
  FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => [entry.modelUse, entry]),
);

export const FLOW_SURFACE_SERVICE_KEY_TO_FORMAL_KEY = new Map(
  FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => [entry.key, entry.formalKey]),
);

export const FLOW_SURFACE_FORMAL_KEY_TO_SERVICE_KEY = new Map(
  FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => [entry.formalKey, entry.key]),
);
