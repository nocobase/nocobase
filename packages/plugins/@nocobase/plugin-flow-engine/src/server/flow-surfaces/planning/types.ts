/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceMutateOp,
  FlowSurfacePlanSelector,
  FlowSurfacePlanStepRef,
  FlowSurfacePlanStepAction,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
  FlowSurfaceSurfaceSelector,
} from '../types';

export type FlowSurfaceResolvedRef = {
  ref: string;
  uid: string;
  source: 'declared' | 'request' | 'system';
  kind: string;
  locator: FlowSurfaceReadLocator;
  rebind?: boolean;
  reboundFromUid?: string;
};

export type FlowSurfaceResolvedSelectorSummary = {
  uid?: string;
  kind?: string;
  ref?: string;
  step?: string;
  path?: string;
  source: FlowSurfaceResolvedRef['source'] | 'step';
};

export type FlowSurfacePlanSurfaceContext = {
  surfaceSelector?: FlowSurfaceSurfaceSelector;
  surfaceTarget?: FlowSurfaceReadLocator;
  surfaceResolved?: FlowSurfaceResolvedTarget;
  rawTree?: any;
  publicTree?: any;
  publicNodeMap: Record<string, any>;
  targetSummary: FlowSurfaceReadTarget | null;
  fingerprint: string | null;
  uidSet: Set<string>;
  refMap: Map<string, FlowSurfaceResolvedRef>;
  requestRefMap: Map<string, FlowSurfaceResolvedRef>;
};

export type FlowSurfaceCompiledPlanStepSelectorRef = FlowSurfacePlanStepRef & {
  summary: FlowSurfaceResolvedSelectorSummary;
};

export type FlowSurfaceCompiledPlanStep = {
  index: number;
  id?: string;
  action: FlowSurfacePlanStepAction;
  payload: Record<string, any>;
  executionPayload?: Record<string, any>;
  resolvedSelectors: Partial<Record<'target' | 'source', FlowSurfaceResolvedSelectorSummary>>;
  usedRefs: FlowSurfaceResolvedRef[];
  usedStepRefs: FlowSurfaceCompiledPlanStepSelectorRef[];
  mutateOp?: FlowSurfaceMutateOp;
};
