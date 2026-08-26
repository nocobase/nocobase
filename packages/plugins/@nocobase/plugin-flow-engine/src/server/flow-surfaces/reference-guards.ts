/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from './errors';
import type { FlowSurfacePlanStepLink } from './types';

export function isFlowSurfacePlanStepValue(input: any): input is FlowSurfacePlanStepLink {
  return (
    _.isPlainObject(input) &&
    Object.keys(input).every((key) => ['step', 'path'].includes(key)) &&
    typeof input.step === 'string' &&
    !!input.step.trim()
  );
}

export function normalizeFlowSurfacePlanStepValue(
  actionName: string,
  input: any,
  fieldName: string,
): FlowSurfacePlanStepLink {
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

export function throwUnsupportedFlowSurfaceDollarRef(actionName: string, path: string, allowed: string): never {
  throwBadRequest(`flowSurfaces ${actionName} ${path} must use ${allowed}; "$ref" is not supported`);
}

export function throwUnsupportedFlowSurfaceRef(actionName: string, path: string, allowed: string): never {
  throwBadRequest(`flowSurfaces ${actionName} ${path} does not support { ref }; use ${allowed}`);
}

export function assertNoFlowSurfaceLegacyRef(
  input: any,
  options: {
    actionName: string;
    path: string;
    dollarRefAllowed?: string;
    refAllowed?: string;
  },
) {
  if (!_.isPlainObject(input)) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(input, '$ref')) {
    throwUnsupportedFlowSurfaceDollarRef(
      options.actionName,
      options.path,
      options.dollarRefAllowed || options.refAllowed || 'key',
    );
  }
  if (Object.prototype.hasOwnProperty.call(input, 'ref')) {
    throwUnsupportedFlowSurfaceRef(
      options.actionName,
      options.path,
      options.refAllowed || options.dollarRefAllowed || 'key',
    );
  }
}
