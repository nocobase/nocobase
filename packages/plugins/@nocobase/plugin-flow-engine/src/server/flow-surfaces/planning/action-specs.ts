/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceMutateOpType } from '../types';

export type FlowSurfacePlanSelectorMode = 'none' | 'target' | 'rootUidTarget' | 'sourceTarget';
export type FlowSurfacePlanActionSpec = {
  selectorMode: FlowSurfacePlanSelectorMode;
};

export type FlowSurfacePlanMutateActionSpec = FlowSurfacePlanActionSpec & {
  executionKind: 'mutate';
};

export type FlowSurfacePlanOnlyActionSpec = FlowSurfacePlanActionSpec & {
  executionKind: 'planOnly';
};

export type FlowSurfaceResolvedPlanActionSpec = FlowSurfacePlanMutateActionSpec | FlowSurfacePlanOnlyActionSpec;

const FLOW_SURFACE_PLAN_SELECTOR_REQUIREMENTS = {
  none: {
    requiresTarget: false,
    requiresSource: false,
  },
  target: {
    requiresTarget: true,
    requiresSource: false,
  },
  rootUidTarget: {
    requiresTarget: true,
    requiresSource: false,
  },
  sourceTarget: {
    requiresTarget: true,
    requiresSource: true,
  },
} as const satisfies Record<FlowSurfacePlanSelectorMode, { requiresTarget: boolean; requiresSource: boolean }>;

function defineFlowSurfacePlanActionSpecs<const T extends Record<string, FlowSurfaceResolvedPlanActionSpec>>(
  specs: T & {
    [K in keyof T]: T[K] extends { executionKind: 'mutate' }
      ? K extends FlowSurfaceMutateOpType
        ? unknown
        : never
      : unknown;
  },
) {
  return specs;
}

export const FLOW_SURFACE_PLAN_ACTION_SPECS = defineFlowSurfacePlanActionSpecs({
  createMenu: {
    selectorMode: 'none',
    executionKind: 'mutate',
  },
  createPage: {
    selectorMode: 'none',
    executionKind: 'mutate',
  },
  compose: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  configure: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  setFieldValueRules: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  setBlockLinkageRules: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  setFieldLinkageRules: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  setActionLinkageRules: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  updateSettings: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  setEventFlows: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  setLayout: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  addTab: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  updateTab: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  moveTab: {
    selectorMode: 'sourceTarget',
    executionKind: 'mutate',
  },
  removeTab: {
    selectorMode: 'rootUidTarget',
    executionKind: 'mutate',
  },
  addPopupTab: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  updatePopupTab: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  movePopupTab: {
    selectorMode: 'sourceTarget',
    executionKind: 'mutate',
  },
  removePopupTab: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  addBlock: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  addField: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  addAction: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  addRecordAction: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  moveNode: {
    selectorMode: 'sourceTarget',
    executionKind: 'mutate',
  },
  removeNode: {
    selectorMode: 'target',
    executionKind: 'mutate',
  },
  convertTemplateToCopy: {
    selectorMode: 'target',
    executionKind: 'planOnly',
  },
  destroyPage: {
    selectorMode: 'rootUidTarget',
    executionKind: 'mutate',
  },
} as const);

export type FlowSurfacePlanStepActionName = keyof typeof FLOW_SURFACE_PLAN_ACTION_SPECS;
export type FlowSurfacePlanOnlyActionName = {
  [K in FlowSurfacePlanStepActionName]: (typeof FLOW_SURFACE_PLAN_ACTION_SPECS)[K] extends { executionKind: 'planOnly' }
    ? K
    : never;
}[FlowSurfacePlanStepActionName];

export const FLOW_SURFACE_PLAN_STEP_ACTIONS = Object.freeze(
  Object.keys(FLOW_SURFACE_PLAN_ACTION_SPECS),
) as FlowSurfacePlanStepActionName[];

export function getFlowSurfacePlanSelectorRequirements(selectorMode: FlowSurfacePlanSelectorMode) {
  return FLOW_SURFACE_PLAN_SELECTOR_REQUIREMENTS[selectorMode];
}

export function getFlowSurfacePlanActionSpec(action: string): FlowSurfaceResolvedPlanActionSpec | undefined {
  if (!Object.prototype.hasOwnProperty.call(FLOW_SURFACE_PLAN_ACTION_SPECS, action)) {
    return undefined;
  }
  return FLOW_SURFACE_PLAN_ACTION_SPECS[action as FlowSurfacePlanStepActionName];
}

export function isFlowSurfacePlanOnlyAction(action: string): action is FlowSurfacePlanOnlyActionName {
  return getFlowSurfacePlanActionSpec(action)?.executionKind === 'planOnly';
}
