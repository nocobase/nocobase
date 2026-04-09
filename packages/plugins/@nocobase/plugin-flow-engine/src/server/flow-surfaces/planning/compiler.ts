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
import { buildDefinedPayload } from '../service-utils';
import type {
  FlowSurfaceMutateOp,
  FlowSurfaceMutateOpType,
  FlowSurfacePlanSelector,
  FlowSurfacePlanStep,
  FlowSurfaceReadLocator,
  FlowSurfaceResolvedTarget,
  FlowSurfaceValidatePlanValues,
} from '../types';
import { getFlowSurfacePlanActionSpec, getFlowSurfacePlanSelectorRequirements } from './action-specs';
import type { FlowSurfaceCompiledPlanStep, FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedRef } from './types';

type NormalizePlanSelectorDeps = {
  normalizeGetTarget: (value: any) => FlowSurfaceReadLocator;
};

type NormalizePlanStepsDeps = NormalizePlanSelectorDeps & {
  validatePlanPayloadShape: (actionName: string, value: any, path: string) => void;
};

type CompilePlanStepDeps = NormalizePlanSelectorDeps & {
  resolveLocator: (
    target: FlowSurfaceReadLocator,
    options?: { transaction?: any },
  ) => Promise<FlowSurfaceResolvedTarget>;
  buildPlanRefKind: (node: any, resolvedKind?: string) => string;
};

export function normalizePlanSelector(
  actionName: string,
  selector: any,
  deps: NormalizePlanSelectorDeps,
  fieldName = 'selector',
): FlowSurfacePlanSelector {
  if (!_.isPlainObject(selector)) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName} must be an object`);
  }
  if (Object.keys(selector).length === 1 && typeof selector.ref === 'string' && selector.ref.trim()) {
    return {
      ref: selector.ref.trim(),
    };
  }
  if (Object.keys(selector).length === 1 && _.isPlainObject(selector.locator)) {
    return {
      locator: deps.normalizeGetTarget(selector.locator),
    };
  }
  throwBadRequest(`flowSurfaces ${actionName} ${fieldName} must be either { ref } or { locator }`);
}

export function normalizePlanSteps(
  actionName: string,
  values: FlowSurfaceValidatePlanValues,
  deps: NormalizePlanStepsDeps,
) {
  if (!_.isPlainObject(values?.plan) || !Array.isArray(values.plan.steps)) {
    throwBadRequest(`flowSurfaces ${actionName} requires plan.steps[]`);
  }
  return values.plan.steps.map((rawStep, index) => {
    if (!_.isPlainObject(rawStep)) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] must be an object`);
    }
    if (
      Object.prototype.hasOwnProperty.call(rawStep, 'target') ||
      Object.prototype.hasOwnProperty.call(rawStep, 'source')
    ) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] must use selectors.target / selectors.source`);
    }
    const action = String(rawStep.action || '').trim();
    if (!action || !getFlowSurfacePlanActionSpec(action)) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].action is not supported`);
    }
    const selectorsInput = _.isUndefined(rawStep.selectors) ? {} : rawStep.selectors;
    if (!_.isPlainObject(selectorsInput)) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].selectors must be an object`);
    }
    const selectorKeys = Object.keys(selectorsInput || {});
    if (selectorKeys.some((key) => !['target', 'source'].includes(key))) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].selectors only supports target/source`);
    }
    const stepValues = _.isUndefined(rawStep.values) ? {} : rawStep.values;
    if (!_.isPlainObject(stepValues)) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].values must be an object`);
    }
    const forbiddenKeys = ['target', 'uid', 'sourceUid', 'targetUid'].filter((key) =>
      Object.prototype.hasOwnProperty.call(stepValues, key),
    );
    if (forbiddenKeys.length) {
      throwBadRequest(
        `flowSurfaces ${actionName} plan.steps[${index}].values must not include ${forbiddenKeys.join(
          ', ',
        )}; use selectors`,
      );
    }
    deps.validatePlanPayloadShape(actionName, stepValues, `plan.steps[${index}].values`);
    return {
      id: typeof rawStep.id === 'string' && rawStep.id.trim() ? rawStep.id.trim() : undefined,
      action: action as FlowSurfacePlanStep['action'],
      selectors: buildDefinedPayload({
        target: _.isUndefined(selectorsInput.target)
          ? undefined
          : normalizePlanSelector(actionName, selectorsInput.target, deps, `plan.steps[${index}].selectors.target`),
        source: _.isUndefined(selectorsInput.source)
          ? undefined
          : normalizePlanSelector(actionName, selectorsInput.source, deps, `plan.steps[${index}].selectors.source`),
      }),
      values: _.cloneDeep(stepValues),
    } satisfies FlowSurfacePlanStep;
  });
}

async function resolvePlanSelectorInContext(
  actionName: string,
  selector: FlowSurfacePlanSelector,
  context: FlowSurfacePlanSurfaceContext,
  deps: CompilePlanStepDeps,
  fieldName: string,
  options: { transaction?: any } = {},
): Promise<FlowSurfaceResolvedRef> {
  const normalizedSelector = normalizePlanSelector(actionName, selector, deps, fieldName);
  if ('ref' in normalizedSelector) {
    const ref = context.refMap.get(normalizedSelector.ref);
    if (!ref) {
      throwBadRequest(`flowSurfaces ${actionName} ${fieldName} ref '${normalizedSelector.ref}' is not defined`);
    }
    return ref;
  }
  const resolved = await deps.resolveLocator(normalizedSelector.locator, options);
  if (!context.uidSet.has(resolved.uid)) {
    throwBadRequest(
      `flowSurfaces ${actionName} ${fieldName} locator must resolve inside the current surface '${context.surfaceResolved.uid}'`,
    );
  }
  const node =
    context.publicNodeMap[resolved.uid] ||
    (resolved.uid === context.surfaceResolved.uid ? context.publicTree : undefined);
  return {
    ref: '',
    uid: resolved.uid,
    source: 'system',
    kind: deps.buildPlanRefKind(node, resolved.kind),
    locator: buildDefinedPayload({
      uid: normalizedSelector.locator.uid,
      pageSchemaUid: normalizedSelector.locator.pageSchemaUid,
      tabSchemaUid: normalizedSelector.locator.tabSchemaUid,
      routeId: normalizedSelector.locator.routeId,
    }),
  };
}

function buildMutateOp(type: FlowSurfaceMutateOpType, payload: Record<string, any>): FlowSurfaceMutateOp {
  if (_.isPlainObject(payload.target)) {
    return {
      type,
      target: payload.target,
      values: _.omit(payload, ['target']),
    };
  }
  return {
    type,
    values: payload,
  };
}

export async function compilePlanStep(
  actionName: string,
  step: FlowSurfacePlanStep,
  index: number,
  context: FlowSurfacePlanSurfaceContext,
  deps: CompilePlanStepDeps,
  options: { transaction?: any } = {},
): Promise<FlowSurfaceCompiledPlanStep> {
  const payload = _.cloneDeep(step.values || {});
  const compiled: FlowSurfaceCompiledPlanStep = {
    index,
    ...(step.id ? { id: step.id } : {}),
    action: step.action,
    payload,
    resolvedSelectors: {},
    usedRefs: [],
  };
  const addUsedRef = (refInfo: FlowSurfaceResolvedRef) => {
    if (refInfo.source === 'request' || refInfo.source === 'declared') {
      compiled.usedRefs.push(refInfo);
    }
    return {
      uid: refInfo.uid,
      kind: refInfo.kind,
      ...(refInfo.ref ? { ref: refInfo.ref } : {}),
      source: refInfo.source,
    };
  };
  const spec = getFlowSurfacePlanActionSpec(step.action);
  if (!spec) {
    throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].action '${step.action}' is not supported`);
  }
  const selectorRequirements = getFlowSurfacePlanSelectorRequirements(spec.selectorMode);
  if (selectorRequirements.requiresTarget && !step.selectors?.target) {
    throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.target`);
  }
  if (!selectorRequirements.requiresTarget && step.selectors?.target) {
    throwBadRequest(
      `flowSurfaces ${actionName} plan.steps[${index}] action '${step.action}' does not support selectors.target`,
    );
  }
  if (selectorRequirements.requiresSource && !step.selectors?.source) {
    throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.source`);
  }
  if (!selectorRequirements.requiresSource && step.selectors?.source) {
    throwBadRequest(
      `flowSurfaces ${actionName} plan.steps[${index}] action '${step.action}' does not support selectors.source`,
    );
  }

  if (spec.selectorMode === 'target') {
    const target = await resolvePlanSelectorInContext(
      actionName,
      step.selectors!.target!,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      options,
    );
    compiled.payload = {
      ...payload,
      target: {
        uid: target.uid,
      },
    };
    compiled.resolvedSelectors.target = addUsedRef(target);
  } else if (spec.selectorMode === 'rootUidTarget') {
    const target = await resolvePlanSelectorInContext(
      actionName,
      step.selectors!.target!,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      options,
    );
    compiled.payload = {
      ...payload,
      uid: target.uid,
    };
    compiled.resolvedSelectors.target = addUsedRef(target);
  } else if (spec.selectorMode === 'sourceTarget') {
    const source = await resolvePlanSelectorInContext(
      actionName,
      step.selectors!.source!,
      context,
      deps,
      `plan.steps[${index}].selectors.source`,
      options,
    );
    const target = await resolvePlanSelectorInContext(
      actionName,
      step.selectors!.target!,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      options,
    );
    compiled.payload = {
      ...payload,
      sourceUid: source.uid,
      targetUid: target.uid,
    };
    compiled.resolvedSelectors.source = addUsedRef(source);
    compiled.resolvedSelectors.target = addUsedRef(target);
  } else {
    throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].action '${step.action}' is not supported`);
  }

  if (spec.executionKind === 'mutate') {
    compiled.mutateOp = buildMutateOp(step.action as FlowSurfaceMutateOpType, compiled.payload);
  }

  return compiled;
}
