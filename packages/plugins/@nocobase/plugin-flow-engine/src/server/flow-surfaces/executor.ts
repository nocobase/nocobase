/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowSurfaceBadRequestError } from './errors';
import { assertNoFlowSurfaceLegacyRef, isFlowSurfacePlanStepValue } from './reference-guards';
import { isFlowSurfacePureKeyObject } from './planning/created-keys';
import type { FlowSurfaceExecutorContext, FlowSurfaceMutateOp } from './types';

export async function executeMutateOps(
  ops: FlowSurfaceMutateOp[],
  ctx: FlowSurfaceExecutorContext,
  dispatcher: (op: FlowSurfaceMutateOp, values: Record<string, any>, ctx: FlowSurfaceExecutorContext) => Promise<any>,
) {
  const results: Array<{ opId?: string; result: any }> = [];
  for (const op of ops) {
    const resolvedValues = resolveFlowSurfaceValueKeys(
      _.cloneDeep({
        ...(op.target ? { target: op.target } : {}),
        ...(op.values || {}),
      }),
      ctx.keys,
    );
    const result = await dispatcher(op, resolvedValues, ctx);
    if (op.opId) {
      ctx.keys.set(op.opId, result);
    }
    results.push({ opId: op.opId, result });
  }
  return results;
}

export function resolveFlowSurfaceValueKeys(input: any, keys: Map<string, any>): any {
  if (Array.isArray(input)) {
    return input.map((item) => resolveFlowSurfaceValueKeys(item, keys));
  }
  if (_.isPlainObject(input)) {
    assertNoFlowSurfaceLegacyRef(input, {
      actionName: 'mutate',
      path: 'values',
      dollarRefAllowed: '{ key } or { step, path }',
      refAllowed: '{ key } or { step, path }',
    });
    if (isFlowSurfacePlanStepValue(input)) {
      return readStepResult(input, keys);
    }
    if (isFlowSurfacePureKeyObject(input)) {
      return readKey(input.key, keys);
    }
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, resolveFlowSurfaceValueKeys(value, keys)]),
    );
  }
  return input;
}

export function inspectFlowSurfaceValueKey(path: string, keys: Map<string, any>) {
  const trimmedPath = String(path || '').trim();
  if (!trimmedPath) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate key cannot be empty`);
  }
  if (keys.has(trimmedPath)) {
    return {
      found: true as const,
      value: keys.get(trimmedPath),
    };
  }
  return {
    found: false as const,
    missingHead: trimmedPath,
  };
}

function readKey(path: string, keys: Map<string, any>) {
  const resolved = inspectFlowSurfaceValueKey(path, keys);
  if (!resolved.found) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate key '${resolved.missingHead}' not found`);
  }
  return resolved.value;
}

function readStepResult(input: { step: string; path?: string }, keys: Map<string, any>) {
  const step = String(input.step || '').trim();
  if (!step) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate step cannot be empty`);
  }
  if (!keys.has(step)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate step '${step}' not found`);
  }
  const value = keys.get(step);
  const path = _.isUndefined(input.path) ? undefined : String(input.path || '').trim();
  if (_.has(input, 'path') && !path) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate path cannot be empty`);
  }
  return path ? _.get(value, path) : value;
}
