/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const FLOW_SURFACES_ACTION_NAMES = [
  'catalog',
  'context',
  'get',
  'compose',
  'configure',
  'createMenu',
  'updateMenu',
  'createPage',
  'destroyPage',
  'addTab',
  'updateTab',
  'moveTab',
  'removeTab',
  'addPopupTab',
  'updatePopupTab',
  'movePopupTab',
  'removePopupTab',
  'addBlock',
  'addBlocks',
  'addField',
  'addFields',
  'addAction',
  'addActions',
  'addRecordAction',
  'addRecordActions',
  'updateSettings',
  'setEventFlows',
  'setLayout',
  'moveNode',
  'removeNode',
  'mutate',
  'apply',
] as const;

export type FlowSurfacesActionName = (typeof FLOW_SURFACES_ACTION_NAMES)[number];

export const FLOW_SURFACES_READ_ACTION_NAMES = [
  'catalog',
  'context',
  'get',
] as const satisfies readonly FlowSurfacesActionName[];

export const FLOW_SURFACE_MUTATE_OP_TYPES = [
  'createMenu',
  'updateMenu',
  'createPage',
  'destroyPage',
  'addTab',
  'updateTab',
  'moveTab',
  'removeTab',
  'addPopupTab',
  'updatePopupTab',
  'movePopupTab',
  'removePopupTab',
  'addBlock',
  'addField',
  'addAction',
  'addRecordAction',
  'updateSettings',
  'setEventFlows',
  'setLayout',
  'moveNode',
  'removeNode',
] as const;

export const FLOW_SURFACES_ACTION_METHODS: Record<FlowSurfacesActionName, 'get' | 'post'> = {
  catalog: 'post',
  context: 'post',
  get: 'get',
  compose: 'post',
  configure: 'post',
  createMenu: 'post',
  updateMenu: 'post',
  createPage: 'post',
  destroyPage: 'post',
  addTab: 'post',
  updateTab: 'post',
  moveTab: 'post',
  removeTab: 'post',
  addPopupTab: 'post',
  updatePopupTab: 'post',
  movePopupTab: 'post',
  removePopupTab: 'post',
  addBlock: 'post',
  addBlocks: 'post',
  addField: 'post',
  addFields: 'post',
  addAction: 'post',
  addActions: 'post',
  addRecordAction: 'post',
  addRecordActions: 'post',
  updateSettings: 'post',
  setEventFlows: 'post',
  setLayout: 'post',
  moveNode: 'post',
  removeNode: 'post',
  mutate: 'post',
  apply: 'post',
};
