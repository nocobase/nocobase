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
import {
  assertNoFlowSurfaceLegacyRef,
  isFlowSurfacePlanStepValue,
  normalizeFlowSurfacePlanStepValue,
} from '../reference-guards';
import type { FlowSurfacePlanStepLink } from '../types';
import { isFlowSurfacePureKeyObject } from './created-keys';

export const isFlowSurfacePlanStepLink = isFlowSurfacePlanStepValue;

export function normalizeFlowSurfacePlanStepLink(
  actionName: string,
  input: any,
  fieldName: string,
): FlowSurfacePlanStepLink {
  return normalizeFlowSurfacePlanStepValue(actionName, input, fieldName);
}

export function assertFlowSurfaceKnownPlanStepLink(
  actionName: string,
  stepLink: FlowSurfacePlanStepLink,
  fieldName: string,
  knownStepIds?: Set<string>,
) {
  if (!knownStepIds || knownStepIds.has(stepLink.step)) {
    return;
  }
  throwBadRequest(`flowSurfaces ${actionName} ${fieldName}.step '${stepLink.step}' is not a previous step id`);
}

export function replaceFlowSurfacePlanStepLinks(
  actionName: string,
  input: any,
  path: string,
  knownStepIds?: Set<string>,
  knownRuntimeKeys?: Set<string>,
): any {
  if (Array.isArray(input)) {
    return input.map((item, index) =>
      replaceFlowSurfacePlanStepLinks(actionName, item, `${path}[${index}]`, knownStepIds, knownRuntimeKeys),
    );
  }
  if (!_.isPlainObject(input)) {
    return input;
  }
  assertNoFlowSurfaceLegacyRef(input, {
    actionName,
    path,
    dollarRefAllowed: '{ step, path }',
    refAllowed: '{ key } or { step, path }',
  });
  if (isFlowSurfacePlanStepLink(input)) {
    const stepLink = normalizeFlowSurfacePlanStepLink(actionName, input, path);
    assertFlowSurfaceKnownPlanStepLink(actionName, stepLink, path, knownStepIds);
    return stepLink;
  }
  if (isFlowSurfacePureKeyObject(input)) {
    const runtimeKey = String(input.key || '').trim();
    if (!runtimeKey) {
      throwBadRequest(`flowSurfaces ${actionName} ${path}.key cannot be empty`);
    }
    if (!knownRuntimeKeys?.has(runtimeKey)) {
      throwBadRequest(`flowSurfaces ${actionName} ${path}.key '${runtimeKey}' is not defined`);
    }
    return {
      key: runtimeKey,
    };
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      replaceFlowSurfacePlanStepLinks(actionName, value, `${path}.${key}`, knownStepIds, knownRuntimeKeys),
    ]),
  );
}
