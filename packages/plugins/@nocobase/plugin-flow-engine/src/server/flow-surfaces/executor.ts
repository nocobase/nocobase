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
    const resolvedValues = resolveRefs(
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

function resolveRefs(input: any, refs: Map<string, any>): any {
  if (Array.isArray(input)) {
    return input.map((item) => resolveRefs(item, refs));
  }
  if (_.isPlainObject(input)) {
    if (Object.prototype.hasOwnProperty.call(input, '$ref')) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces mutate refs must use { ref: "op.path" }; "$ref" is no longer supported`,
      );
    }
    if (Object.prototype.hasOwnProperty.call(input, 'ref')) {
      if (typeof input.ref !== 'string') {
        throw new FlowSurfaceBadRequestError(`flowSurfaces mutate ref must be a string`);
      }
      return readRef(input.ref, refs);
    }
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, resolveRefs(value, refs)]));
  }
  return input;
}

function readRef(path: string, refs: Map<string, any>) {
  const trimmedPath = String(path || '').trim();
  if (!trimmedPath) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate ref cannot be empty`);
  }
  const [opId, ...segments] = trimmedPath.split('.');
  if (!refs.has(opId)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces mutate ref '${opId}' not found`);
  }
  const value = refs.get(opId);
  return segments.length ? _.get(value, segments.join('.')) : value;
}
