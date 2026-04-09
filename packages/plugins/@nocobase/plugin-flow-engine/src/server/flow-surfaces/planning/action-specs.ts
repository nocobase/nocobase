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
};

export type FlowSurfacePlanMutateActionSpec = FlowSurfacePlanActionSpec & {
  executionKind: 'mutate';
  mutateOpType: string;
};

export type FlowSurfacePlanOnlyActionSpec = FlowSurfacePlanActionSpec & {
  executionKind: 'planOnly';
  planOnlyMethod: FlowSurfacePlanStepActionName;
};

export type FlowSurfaceResolvedPlanActionSpec = FlowSurfacePlanMutateActionSpec | FlowSurfacePlanOnlyActionSpec;

export const FLOW_SURFACE_PLAN_ACTION_SPECS = {
  compose: {
    action: 'compose',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'planOnly',
    planOnlyMethod: 'compose',
  },
  configure: {
    action: 'configure',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'planOnly',
    planOnlyMethod: 'configure',
  },
  updateSettings: {
    action: 'updateSettings',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'updateSettings',
  },
  setEventFlows: {
    action: 'setEventFlows',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'setEventFlows',
  },
  setLayout: {
    action: 'setLayout',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'setLayout',
  },
  addTab: {
    action: 'addTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'addTab',
  },
  updateTab: {
    action: 'updateTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'updateTab',
  },
  moveTab: {
    action: 'moveTab',
    selectorMode: 'sourceTarget',
    payloadProjection: 'sourceTargetUids',
    requiresTarget: true,
    requiresSource: true,
    executionKind: 'mutate',
    mutateOpType: 'moveTab',
  },
  removeTab: {
    action: 'removeTab',
    selectorMode: 'rootUidTarget',
    payloadProjection: 'uid',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'removeTab',
  },
  addPopupTab: {
    action: 'addPopupTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'addPopupTab',
  },
  updatePopupTab: {
    action: 'updatePopupTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'updatePopupTab',
  },
  movePopupTab: {
    action: 'movePopupTab',
    selectorMode: 'sourceTarget',
    payloadProjection: 'sourceTargetUids',
    requiresTarget: true,
    requiresSource: true,
    executionKind: 'mutate',
    mutateOpType: 'movePopupTab',
  },
  removePopupTab: {
    action: 'removePopupTab',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'removePopupTab',
  },
  addBlock: {
    action: 'addBlock',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'addBlock',
  },
  addField: {
    action: 'addField',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'addField',
  },
  addAction: {
    action: 'addAction',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'addAction',
  },
  addRecordAction: {
    action: 'addRecordAction',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'addRecordAction',
  },
  moveNode: {
    action: 'moveNode',
    selectorMode: 'sourceTarget',
    payloadProjection: 'sourceTargetUids',
    requiresTarget: true,
    requiresSource: true,
    executionKind: 'mutate',
    mutateOpType: 'moveNode',
  },
  removeNode: {
    action: 'removeNode',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'removeNode',
  },
  convertTemplateToCopy: {
    action: 'convertTemplateToCopy',
    selectorMode: 'target',
    payloadProjection: 'target',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'planOnly',
    planOnlyMethod: 'convertTemplateToCopy',
  },
  destroyPage: {
    action: 'destroyPage',
    selectorMode: 'rootUidTarget',
    payloadProjection: 'uid',
    requiresTarget: true,
    requiresSource: false,
    executionKind: 'mutate',
    mutateOpType: 'destroyPage',
  },
} as const satisfies Record<FlowSurfacePlanStepActionName, FlowSurfaceResolvedPlanActionSpec>;

export function getFlowSurfacePlanActionSpec(action: string): FlowSurfaceResolvedPlanActionSpec | undefined {
  return FLOW_SURFACE_PLAN_ACTION_SPECS[action as FlowSurfacePlanStepActionName];
}
