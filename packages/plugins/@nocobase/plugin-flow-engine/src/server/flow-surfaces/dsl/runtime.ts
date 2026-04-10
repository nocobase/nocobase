/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileFlowSurfaceDslToPlanRequest } from './compiler';
import { normalizeFlowSurfaceDslRequest } from './normalizer';
import type { FlowSurfaceExecuteDslValues, FlowSurfacePreparedDslRequest, FlowSurfaceValidateDslValues } from './types';
import { validateFlowSurfaceDslDocument } from './validator';

export function prepareFlowSurfaceDslRequest(
  actionName: 'validateDsl',
  values: FlowSurfaceValidateDslValues | Record<string, any>,
): FlowSurfacePreparedDslRequest;
export function prepareFlowSurfaceDslRequest(
  actionName: 'executeDsl',
  values: FlowSurfaceExecuteDslValues | Record<string, any>,
): FlowSurfacePreparedDslRequest;
export function prepareFlowSurfaceDslRequest(
  actionName: 'validateDsl' | 'executeDsl',
  values: Record<string, any>,
): FlowSurfacePreparedDslRequest {
  const prepared = normalizeFlowSurfaceDslRequest(actionName, values);
  validateFlowSurfaceDslDocument(actionName, prepared.dsl);
  prepared.planValues = {
    ...compileFlowSurfaceDslToPlanRequest(prepared.dsl),
    ...(prepared.expectedFingerprint ? { expectedFingerprint: prepared.expectedFingerprint } : {}),
    ...(prepared.bindRefs ? { bindRefs: prepared.bindRefs } : {}),
  };
  return prepared;
}
