/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { FLOW_SURFACE_PLAN_STEP_ACTIONS } from './planning/action-specs';

type FlowSurfaceActionMethod = 'get' | 'post';
type FlowSurfaceActionValueSource = 'default' | 'read';

export type FlowSurfaceActionDefinition = {
  method: FlowSurfaceActionMethod;
  read: boolean;
  transaction: boolean;
  mutate: boolean;
  valueSource: FlowSurfaceActionValueSource;
};

export const FLOW_SURFACE_ACTION_DEFINITIONS = {
  catalog: { method: 'post', read: true, transaction: false, mutate: false, valueSource: 'default' },
  context: { method: 'post', read: true, transaction: false, mutate: false, valueSource: 'default' },
  get: { method: 'get', read: true, transaction: false, mutate: false, valueSource: 'read' },
  describeSurface: { method: 'post', read: true, transaction: false, mutate: false, valueSource: 'default' },
  getReactionMeta: { method: 'post', read: true, transaction: false, mutate: false, valueSource: 'default' },
  setFieldValueRules: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  setBlockLinkageRules: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  setFieldLinkageRules: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  setActionLinkageRules: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  applyBlueprint: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  applyApprovalBlueprint: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  listTemplates: { method: 'post', read: true, transaction: false, mutate: false, valueSource: 'default' },
  getTemplate: { method: 'post', read: true, transaction: false, mutate: false, valueSource: 'default' },
  saveTemplate: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  updateTemplate: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  destroyTemplate: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  convertTemplateToCopy: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  compose: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  configure: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  createMenu: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  updateMenu: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  createPage: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  destroyPage: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  updateTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  moveTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  removeTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addPopupTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  updatePopupTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  movePopupTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  removePopupTab: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addBlock: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addBlocks: { method: 'post', read: false, transaction: false, mutate: false, valueSource: 'default' },
  addField: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addFields: { method: 'post', read: false, transaction: false, mutate: false, valueSource: 'default' },
  addAction: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addActions: { method: 'post', read: false, transaction: false, mutate: false, valueSource: 'default' },
  addRecordAction: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  addRecordActions: { method: 'post', read: false, transaction: false, mutate: false, valueSource: 'default' },
  updateSettings: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  setEventFlows: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  setLayout: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  moveNode: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  removeNode: { method: 'post', read: false, transaction: true, mutate: true, valueSource: 'default' },
  mutate: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
  apply: { method: 'post', read: false, transaction: true, mutate: false, valueSource: 'default' },
} as const satisfies Record<string, FlowSurfaceActionDefinition>;

export type FlowSurfacesActionName = keyof typeof FLOW_SURFACE_ACTION_DEFINITIONS;

type SelectFlowSurfaceActionNames<TFlag extends keyof FlowSurfaceActionDefinition> = {
  [K in FlowSurfacesActionName]: (typeof FLOW_SURFACE_ACTION_DEFINITIONS)[K][TFlag] extends true ? K : never;
}[FlowSurfacesActionName];

type FlowSurfaceMutateActionName = SelectFlowSurfaceActionNames<'mutate'>;

export const FLOW_SURFACES_ACTION_NAMES = Object.keys(FLOW_SURFACE_ACTION_DEFINITIONS) as FlowSurfacesActionName[];

export const FLOW_SURFACES_READ_ACTION_NAMES = FLOW_SURFACES_ACTION_NAMES.filter(
  (actionName): actionName is SelectFlowSurfaceActionNames<'read'> =>
    FLOW_SURFACE_ACTION_DEFINITIONS[actionName].read === true,
);

export const FLOW_SURFACE_MUTATE_OP_TYPES = FLOW_SURFACES_ACTION_NAMES.filter(
  (actionName): actionName is FlowSurfaceMutateActionName =>
    FLOW_SURFACE_ACTION_DEFINITIONS[actionName].mutate === true,
);

export const FLOW_SURFACES_ACTION_METHODS = Object.fromEntries(
  FLOW_SURFACES_ACTION_NAMES.map((actionName) => [actionName, FLOW_SURFACE_ACTION_DEFINITIONS[actionName].method]),
) as Record<FlowSurfacesActionName, FlowSurfaceActionMethod>;
