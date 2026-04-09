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
  FlowSurfacePlanStepAction,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
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
  uid: string;
  kind: string;
  ref?: string;
  source: FlowSurfaceResolvedRef['source'];
};

export type FlowSurfacePlanSurfaceContext = {
  surfaceSelector: FlowSurfacePlanSelector;
  surfaceTarget: FlowSurfaceReadLocator;
  surfaceResolved: FlowSurfaceResolvedTarget;
  rawTree: any;
  publicTree: any;
  publicNodeMap: Record<string, any>;
  targetSummary: FlowSurfaceReadTarget;
  fingerprint: string;
  uidSet: Set<string>;
  refMap: Map<string, FlowSurfaceResolvedRef>;
  requestRefMap: Map<string, FlowSurfaceResolvedRef>;
};

export type FlowSurfaceCompiledPlanStep = {
  index: number;
  id?: string;
  action: FlowSurfacePlanStepAction;
  payload: Record<string, any>;
  resolvedSelectors: Partial<Record<'target' | 'source', FlowSurfaceResolvedSelectorSummary>>;
  usedRefs: FlowSurfaceResolvedRef[];
  mutateOp?: FlowSurfaceMutateOp;
  planPayload?: Record<string, any>;
};
