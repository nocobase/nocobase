/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import type { FlowSurfacePlanStepRef } from '../types';
import { isFlowSurfacePureRefObject } from './created-refs';

export function isFlowSurfacePlanStepRef(input: any): input is FlowSurfacePlanStepRef {
  return (
    _.isPlainObject(input) &&
    Object.keys(input).every((key) => ['step', 'path'].includes(key)) &&
    typeof input.step === 'string' &&
    !!input.step.trim()
  );
}

export function normalizeFlowSurfacePlanStepRef(
  actionName: string,
  input: any,
  fieldName: string,
): FlowSurfacePlanStepRef {
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName} must be an object`);
  }
  if (Object.keys(input).some((key) => !['step', 'path'].includes(key))) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName} only supports step/path`);
  }
  const step = String(input.step || '').trim();
  if (!step) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName}.step cannot be empty`);
  }
  const path = _.isUndefined(input.path) ? undefined : String(input.path || '').trim();
  if (_.has(input, 'path') && !path) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName}.path cannot be empty`);
  }
  return {
    step,
    ...(path ? { path } : {}),
  };
}

export function toFlowSurfaceStepResultRefPath(input: FlowSurfacePlanStepRef) {
  return input.path ? `${input.step}.${input.path}` : input.step;
}

export function assertFlowSurfaceKnownPlanStepRef(
  actionName: string,
  stepRef: FlowSurfacePlanStepRef,
  fieldName: string,
  knownStepIds?: Set<string>,
) {
  if (!knownStepIds || knownStepIds.has(stepRef.step)) {
    return;
  }
  throwBadRequest(`flowSurfaces ${actionName} ${fieldName}.step '${stepRef.step}' is not a previous step id`);
}

export function replaceFlowSurfacePlanStepRefs(
  actionName: string,
  input: any,
  path: string,
  knownStepIds?: Set<string>,
  knownRuntimeRefs?: Set<string>,
): any {
  if (Array.isArray(input)) {
    return input.map((item, index) =>
      replaceFlowSurfacePlanStepRefs(actionName, item, `${path}[${index}]`, knownStepIds, knownRuntimeRefs),
    );
  }
  if (!_.isPlainObject(input)) {
    return input;
  }
  if (Object.prototype.hasOwnProperty.call(input, '$ref')) {
    throwBadRequest(`flowSurfaces ${actionName} ${path} must use { step, path }; '$ref' is not supported`);
  }
  if (isFlowSurfacePlanStepRef(input)) {
    const stepRef = normalizeFlowSurfacePlanStepRef(actionName, input, path);
    assertFlowSurfaceKnownPlanStepRef(actionName, stepRef, path, knownStepIds);
    return {
      ref: toFlowSurfaceStepResultRefPath(stepRef),
    };
  }
  if (isFlowSurfacePureRefObject(input)) {
    const runtimeRef = String(input.ref || '').trim();
    if (!runtimeRef) {
      throwBadRequest(`flowSurfaces ${actionName} ${path}.ref cannot be empty`);
    }
    const [head] = runtimeRef.split('.');
    if (!knownRuntimeRefs?.has(runtimeRef) && !knownStepIds?.has(head)) {
      throwBadRequest(`flowSurfaces ${actionName} ${path}.ref '${runtimeRef}' is not defined`);
    }
    return {
      ref: runtimeRef,
    };
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      replaceFlowSurfacePlanStepRefs(actionName, value, `${path}.${key}`, knownStepIds, knownRuntimeRefs),
    ]),
  );
}
