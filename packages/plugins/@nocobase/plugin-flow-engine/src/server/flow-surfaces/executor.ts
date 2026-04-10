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
import type { FlowSurfaceExecutorContext, FlowSurfaceMutateOp } from './types';

export async function executeMutateOps(
  ops: FlowSurfaceMutateOp[],
  ctx: FlowSurfaceExecutorContext,
  dispatcher: (op: FlowSurfaceMutateOp, values: Record<string, any>, ctx: FlowSurfaceExecutorContext) => Promise<any>,
) {
  const results: Array<{ opId?: string; result: any }> = [];
  for (const op of ops) {
    const resolvedValues = resolveFlowSurfaceValueRefs(
      _.cloneDeep({
        ...(op.target ? { target: op.target } : {}),
        ...(op.values || {}),
      }),
      ctx.refs,
    );
    const result = await dispatcher(op, resolvedValues, ctx);
    if (op.opId) {
      ctx.refs.set(op.opId, result);
    }
    results.push({ opId: op.opId, result });
  }
  return results;
}

export function resolveFlowSurfaceValueRefs(input: any, refs: Map<string, any>): any {
  if (Array.isArray(input)) {
    return input.map((item) => resolveFlowSurfaceValueRefs(item, refs));
  }
  if (_.isPlainObject(input)) {
    if (Object.prototype.hasOwnProperty.call(input, '$ref')) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces mutate refs must use { ref: "op.path" }; "$ref" is no longer supported`,
      );
    }
    if (Object.keys(input).length === 1 && Object.prototype.hasOwnProperty.call(input, 'ref')) {
      if (typeof input.ref !== 'string') {
        throw new FlowSurfaceBadRequestError(`flowSurfaces mutate ref must be a string`);
      }
      return readRef(input.ref, refs);
    }
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, resolveFlowSurfaceValueRefs(value, refs)]),
    );
  }
  return input;
}

export function inspectFlowSurfaceValueRef(path: string, refs: Map<string, any>) {
  const trimmedPath = String(path || '').trim();
  if (!trimmedPath) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate ref cannot be empty`);
  }
  if (refs.has(trimmedPath)) {
    return {
      found: true as const,
      value: refs.get(trimmedPath),
    };
  }
  const [opId, ...segments] = trimmedPath.split('.');
  if (!refs.has(opId)) {
    return {
      found: false as const,
      missingHead: opId,
    };
  }
  const value = refs.get(opId);
  return {
    found: true as const,
    value: segments.length ? _.get(value, segments.join('.')) : value,
  };
}

function readRef(path: string, refs: Map<string, any>) {
  const resolved = inspectFlowSurfaceValueRef(path, refs);
  if (!resolved.found) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate ref '${resolved.missingHead}' not found`);
  }
  return resolved.value;
}
