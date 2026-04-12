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
  FlowSurfacePlanRequestValues,
  FlowSurfacePlanStep,
  FlowSurfacePlanStepLink,
  FlowSurfaceReadLocator,
  FlowSurfaceResolvedTarget,
} from '../types';
import { getFlowSurfacePlanActionSpec, getFlowSurfacePlanSelectorRequirements } from './action-specs';
import { normalizeFlowSurfacePlanStepLink, replaceFlowSurfacePlanStepLinks } from './step-link';
import type {
  FlowSurfaceCompiledPlanStep,
  FlowSurfaceCompiledPlanStepSelectorLink,
  FlowSurfacePlanSurfaceContext,
  FlowSurfaceResolvedKey,
} from './types';
import {
  assertNoDuplicateFlowSurfaceCreatedKeys,
  collectFlowSurfaceCreatedKeys,
  isFlowSurfacePureKeyObject,
  normalizeComposeInlineKeysForPlan,
} from './created-keys';

type NormalizePlanSelectorDeps = {
  normalizeGetTarget: (value: any) => FlowSurfaceReadLocator;
};

type NormalizePlanSelectorOptions = {
  allowKey?: boolean;
};

type NormalizePlanStepsDeps = NormalizePlanSelectorDeps & {
  validatePayloadShape: (actionName: string, value: any, path: string) => void;
};

type CompilePlanStepDeps = NormalizePlanSelectorDeps & {
  resolveLocator: (
    target: FlowSurfaceReadLocator,
    options?: { transaction?: any },
  ) => Promise<FlowSurfaceResolvedTarget>;
  buildPlanKeyKind: (node: any, resolvedKind?: string) => string;
};

type FlowSurfaceCreatedKeySelector = {
  key: string;
  summary: { source: 'created'; key: string };
};

type FlowSurfaceResolvedSelector =
  | FlowSurfaceResolvedKey
  | FlowSurfaceCompiledPlanStepSelectorLink
  | FlowSurfaceCreatedKeySelector;

function isFlowSurfaceResolvedStepLink(
  selector: FlowSurfaceResolvedSelector,
): selector is FlowSurfaceCompiledPlanStepSelectorLink {
  return 'step' in selector && selector.summary.source === 'step';
}

export function normalizePlanSelector(
  actionName: string,
  selector: any,
  deps: NormalizePlanSelectorDeps,
  fieldName = 'selector',
  options: NormalizePlanSelectorOptions = {},
): FlowSurfacePlanSelector {
  const allowKey = options.allowKey !== false;
  if (!_.isPlainObject(selector)) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName} must be an object`);
  }
  if (allowKey && Object.keys(selector).length === 1 && typeof selector.key === 'string' && selector.key.trim()) {
    return {
      key: selector.key.trim(),
    };
  }
  if (Object.keys(selector).length === 1 && _.isPlainObject(selector.locator)) {
    return {
      locator: deps.normalizeGetTarget(selector.locator),
    };
  }
  if (Object.keys(selector).every((key) => ['step', 'path'].includes(key)) && typeof selector.step === 'string') {
    return normalizeFlowSurfacePlanStepLink(actionName, selector, fieldName);
  }
  throwBadRequest(
    `flowSurfaces ${actionName} ${fieldName} must be ${
      allowKey ? 'either { key }, { locator } or { step }' : 'either { locator } or { step }'
    }`,
  );
}

export function normalizePlanSteps(
  actionName: string,
  values: FlowSurfacePlanRequestValues,
  deps: NormalizePlanStepsDeps,
) {
  if (!_.isPlainObject(values?.plan) || !Array.isArray(values.plan.steps)) {
    throwBadRequest(`flowSurfaces ${actionName} requires plan.steps[]`);
  }
  const seenIds = new Set<string>();
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
    deps.validatePayloadShape(actionName, stepValues, `plan.steps[${index}].values`);
    const id = typeof rawStep.id === 'string' && rawStep.id.trim() ? rawStep.id.trim() : undefined;
    if (id) {
      if (seenIds.has(id)) {
        throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].id '${id}' is duplicated`);
      }
      seenIds.add(id);
    }
    return {
      id,
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

function buildPlanStepSelectorSummary(stepLink: FlowSurfacePlanStepLink) {
  return {
    source: 'step' as const,
    step: stepLink.step,
    ...(stepLink.path ? { path: stepLink.path } : {}),
  };
}

async function resolvePlanSelectorInContext(
  actionName: string,
  selector: FlowSurfacePlanSelector,
  context: FlowSurfacePlanSurfaceContext,
  deps: CompilePlanStepDeps,
  fieldName: string,
  priorStepIds: Set<string>,
  priorCreatedKeys: Set<string>,
  options: { transaction?: any } = {},
): Promise<FlowSurfaceResolvedSelector> {
  const normalizedSelector = normalizePlanSelector(actionName, selector, deps, fieldName);
  if ('step' in normalizedSelector) {
    if (!priorStepIds.has(normalizedSelector.step)) {
      throwBadRequest(
        `flowSurfaces ${actionName} ${fieldName}.step '${normalizedSelector.step}' is not a previous step id`,
      );
    }
    return {
      ...normalizedSelector,
      summary: buildPlanStepSelectorSummary(normalizedSelector),
    };
  }

  if ('key' in normalizedSelector) {
    const keyInfo = context.keyMap.get(normalizedSelector.key);
    if (keyInfo) {
      return keyInfo;
    }
    if (priorCreatedKeys.has(normalizedSelector.key)) {
      return {
        key: normalizedSelector.key,
        summary: {
          source: 'created',
          key: normalizedSelector.key,
        },
      };
    }
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName}.key '${normalizedSelector.key}' is not defined`);
  }

  const resolved = await deps.resolveLocator(normalizedSelector.locator, options);
  if (!context.surfaceResolved) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldName} locator requires surface`);
  }
  if (!context.uidSet.has(resolved.uid)) {
    throwBadRequest(
      `flowSurfaces ${actionName} ${fieldName} locator must resolve inside the current surface '${context.surfaceResolved.uid}'`,
    );
  }
  const node =
    context.publicNodeMap[resolved.uid] ||
    (resolved.uid === context.surfaceResolved.uid ? context.publicTree : undefined);
  return {
    key: '',
    uid: resolved.uid,
    source: 'system',
    kind: deps.buildPlanKeyKind(node, resolved.kind),
    locator: buildDefinedPayload({
      uid: normalizedSelector.locator.uid,
      pageSchemaUid: normalizedSelector.locator.pageSchemaUid,
      tabSchemaUid: normalizedSelector.locator.tabSchemaUid,
      routeId: normalizedSelector.locator.routeId,
    }),
  };
}

function buildMutateOp(
  type: FlowSurfaceMutateOpType,
  payload: Record<string, any>,
  opId?: string,
): FlowSurfaceMutateOp {
  if (_.isPlainObject(payload.target)) {
    return {
      ...(opId ? { opId } : {}),
      type,
      target: payload.target,
      values: _.omit(payload, ['target']),
    };
  }
  return {
    ...(opId ? { opId } : {}),
    type,
    values: payload,
  };
}

function buildSelectorRuntimeValue(selector: FlowSurfaceResolvedSelector) {
  if ('summary' in selector) {
    if ('step' in selector) {
      return {
        step: selector.step,
        ...(selector.path ? { path: selector.path } : {}),
      };
    }
    return {
      key: selector.key,
    };
  }
  return selector.uid;
}

export async function compilePlanStep(
  actionName: string,
  step: FlowSurfacePlanStep,
  index: number,
  context: FlowSurfacePlanSurfaceContext,
  deps: CompilePlanStepDeps,
  priorStepIds: Set<string>,
  priorCreatedKeys: Set<string>,
  options: { transaction?: any } = {},
): Promise<FlowSurfaceCompiledPlanStep> {
  const runtimeValues =
    step.action === 'compose'
      ? normalizeComposeInlineKeysForPlan(step.values || {}, `plan.steps[${index}].values`)
      : _.cloneDeep(step.values || {});
  const payload = replaceFlowSurfacePlanStepLinks(
    actionName,
    runtimeValues,
    `plan.steps[${index}].values`,
    priorStepIds,
    new Set<string>([...context.keyMap.keys(), ...priorCreatedKeys]),
  );

  const targetSelectorKey = isFlowSurfacePureKeyObject(step.selectors?.target)
    ? String(step.selectors.target.key || '').trim()
    : undefined;
  const createdKeys = collectFlowSurfaceCreatedKeys(step.action, step.values || {}, {
    targetSelectorKey,
  });
  assertNoDuplicateFlowSurfaceCreatedKeys(createdKeys, `flowSurfaces ${actionName} plan.steps[${index}]`, {
    existingKeys: [...context.keyMap.keys(), ...priorCreatedKeys],
    reservedNames: [...priorStepIds, ...(step.id ? [step.id] : [])],
  });

  const compiled: FlowSurfaceCompiledPlanStep = {
    index,
    ...(step.id ? { id: step.id } : {}),
    action: step.action,
    payload,
    resolvedSelectors: {},
    usedKeys: [],
    usedStepLinks: [],
    createdKeys,
  };

  const addUsedKey = (selector: FlowSurfaceResolvedSelector) => {
    if ('summary' in selector) {
      if (isFlowSurfaceResolvedStepLink(selector)) {
        compiled.usedStepLinks.push(selector);
      }
      return selector.summary;
    }
    if (selector.source === 'request' || selector.source === 'declared') {
      compiled.usedKeys.push(selector);
    }
    return {
      uid: selector.uid,
      kind: selector.kind,
      ...(selector.key ? { key: selector.key } : {}),
      source: selector.source,
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

  if (spec.selectorMode === 'none') {
    compiled.payload = payload;
  } else if (spec.selectorMode === 'target') {
    const targetSelector = step.selectors?.target;
    if (!targetSelector) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.target`);
    }
    const target = await resolvePlanSelectorInContext(
      actionName,
      targetSelector,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
    compiled.payload = {
      ...payload,
      target: {
        uid: buildSelectorRuntimeValue(target),
      },
    };
    compiled.resolvedSelectors.target = addUsedKey(target);
  } else if (spec.selectorMode === 'rootUidTarget') {
    const targetSelector = step.selectors?.target;
    if (!targetSelector) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.target`);
    }
    const target = await resolvePlanSelectorInContext(
      actionName,
      targetSelector,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
    compiled.payload = {
      ...payload,
      uid: buildSelectorRuntimeValue(target),
    };
    compiled.resolvedSelectors.target = addUsedKey(target);
  } else if (spec.selectorMode === 'sourceTarget') {
    const sourceSelector = step.selectors?.source;
    const targetSelector = step.selectors?.target;
    if (!sourceSelector || !targetSelector) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.source and selectors.target`);
    }
    const source = await resolvePlanSelectorInContext(
      actionName,
      sourceSelector,
      context,
      deps,
      `plan.steps[${index}].selectors.source`,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
    const target = await resolvePlanSelectorInContext(
      actionName,
      targetSelector,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
    compiled.payload = {
      ...payload,
      sourceUid: buildSelectorRuntimeValue(source),
      targetUid: buildSelectorRuntimeValue(target),
    };
    compiled.resolvedSelectors.source = addUsedKey(source);
    compiled.resolvedSelectors.target = addUsedKey(target);
  } else {
    throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}].action '${step.action}' is not supported`);
  }

  if (spec.executionKind === 'mutate') {
    compiled.mutateOp = buildMutateOp(step.action as FlowSurfaceMutateOpType, compiled.payload, step.id);
  }

  return compiled;
}
