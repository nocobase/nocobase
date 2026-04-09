/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FlowSurfacePlanSelectorMode = 'target' | 'rootUidTarget' | 'sourceTarget';
export type FlowSurfacePlanPayloadProjection = 'target' | 'uid' | 'sourceTargetUids';

export const FLOW_SURFACE_PLAN_STEP_ACTIONS = [
  'compose',
  'configure',
  'updateSettings',
  'setEventFlows',
  'setLayout',
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
  'moveNode',
  'removeNode',
  'convertTemplateToCopy',
  'destroyPage',
] as const;

export type FlowSurfacePlanStepActionName = (typeof FLOW_SURFACE_PLAN_STEP_ACTIONS)[number];

export type FlowSurfacePlanActionSpec = {
  action: FlowSurfacePlanStepActionName;
  selectorMode: FlowSurfacePlanSelectorMode;
  payloadProjection: FlowSurfacePlanPayloadProjection;
  requiresTarget: boolean;
  requiresSource: boolean;
  mutateOpType?: string;
  planOnly?: true;
};

export const FLOW_SURFACE_PLAN_ACTION_SPECS = {
  compose: {
    action: 'compose',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    planOnly: true,
  },
  configure: {
    action: 'configure',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    planOnly: true,
  },
  updateSettings: {
    action: 'updateSettings',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'updateSettings',
  },
  setEventFlows: {
    action: 'setEventFlows',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'setEventFlows',
  },
  setLayout: {
    action: 'setLayout',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'setLayout',
  },
  addTab: {
    action: 'addTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'addTab',
  },
  updateTab: {
    action: 'updateTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'updateTab',
  },
  moveTab: {
    action: 'moveTab',
    selectorMode: 'sourceTarget',
    payloadProjection: 'sourceTargetUids',
    requiresTarget: true,
    requiresSource: true,
    mutateOpType: 'moveTab',
  },
  removeTab: {
    action: 'removeTab',
    selectorMode: 'rootUidTarget',
    payloadProjection: 'uid',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'removeTab',
  },
  addPopupTab: {
    action: 'addPopupTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'addPopupTab',
  },
  updatePopupTab: {
    action: 'updatePopupTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'updatePopupTab',
  },
  movePopupTab: {
    action: 'movePopupTab',
    selectorMode: 'sourceTarget',
    payloadProjection: 'sourceTargetUids',
    requiresTarget: true,
    requiresSource: true,
    mutateOpType: 'movePopupTab',
  },
  removePopupTab: {
    action: 'removePopupTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'removePopupTab',
  },
  addBlock: {
    action: 'addBlock',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'addBlock',
  },
  addField: {
    action: 'addField',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'addField',
  },
  addAction: {
    action: 'addAction',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'addAction',
  },
  addRecordAction: {
    action: 'addRecordAction',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'addRecordAction',
  },
  moveNode: {
    action: 'moveNode',
    selectorMode: 'sourceTarget',
    payloadProjection: 'sourceTargetUids',
    requiresTarget: true,
    requiresSource: true,
    mutateOpType: 'moveNode',
  },
  removeNode: {
    action: 'removeNode',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'removeNode',
  },
  convertTemplateToCopy: {
    action: 'convertTemplateToCopy',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    planOnly: true,
  },
  destroyPage: {
    action: 'destroyPage',
    selectorMode: 'rootUidTarget',
    payloadProjection: 'uid',
    requiresTarget: true,
    requiresSource: false,
    mutateOpType: 'destroyPage',
  },
} as const satisfies Record<FlowSurfacePlanStepActionName, FlowSurfacePlanActionSpec>;

export function getFlowSurfacePlanActionSpec(action: string): FlowSurfacePlanActionSpec | undefined {
  return FLOW_SURFACE_PLAN_ACTION_SPECS[action as FlowSurfacePlanStepActionName];
}
