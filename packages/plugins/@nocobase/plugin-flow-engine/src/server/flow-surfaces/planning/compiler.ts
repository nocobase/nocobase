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
  loadResolvedSurfaceTree?: (resolved: FlowSurfaceResolvedTarget, transaction?: any) => Promise<any>;
  buildPlanKeyKind: (node: any, resolvedKind?: string) => string;
};

type FlowSurfaceCreatedKeySelector = {
  key: string;
  summary: { source: 'created'; key: string };
};

type FlowSurfaceSystemResolvedSelector = FlowSurfaceResolvedKey & {
  node?: any;
  resolved?: FlowSurfaceResolvedTarget;
};

type FlowSurfaceResolvedSelector =
  | FlowSurfaceSystemResolvedSelector
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
    node: node || resolved.node,
    resolved,
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

function getResolvedSelectorUid(selector: FlowSurfaceResolvedSelector | undefined) {
  if (!selector || 'summary' in selector) {
    return undefined;
  }
  return selector.uid;
}

function isReplaceComposeStep(step: FlowSurfacePlanStep) {
  return step.action === 'compose' && String(step.values?.mode || '').trim() === 'replace';
}

function assertReplaceComposeTargetSupportsScopeResolution(
  actionName: string,
  index: number,
  step: FlowSurfacePlanStep,
  target: FlowSurfaceResolvedSelector | undefined,
) {
  if (!isReplaceComposeStep(step) || !target || !('summary' in target) || target.summary.source !== 'step') {
    return;
  }
  throwBadRequest(
    `flowSurfaces ${actionName} plan.steps[${index}] compose replace does not support selectors.target.step; use a concrete locator or key for the existing replace target`,
  );
}

function collectDescendantUids(node: any, carry = new Set<string>()) {
  if (!node || typeof node !== 'object') {
    return carry;
  }
  for (const value of Object.values(node.subModels || {})) {
    for (const child of _.castArray(value as any)) {
      if (child?.uid) {
        carry.add(child.uid);
      }
      collectDescendantUids(child, carry);
    }
  }
  return carry;
}

function collectNodeAndDescendantUids(node: any, carry = new Set<string>()) {
  if (!node || typeof node !== 'object') {
    return carry;
  }
  if (node.uid) {
    carry.add(node.uid);
  }
  return collectDescendantUids(node, carry);
}

function findNodeInTreeByUid(node: any, uid: string | undefined): any {
  if (!node || typeof node !== 'object' || !uid) {
    return undefined;
  }
  if (node.uid === uid) {
    return node;
  }
  for (const value of Object.values(node.subModels || {})) {
    for (const child of _.castArray(value as any)) {
      const matched = findNodeInTreeByUid(child, uid);
      if (matched) {
        return matched;
      }
    }
  }
  return undefined;
}

function getContextNodeByUid(context: FlowSurfacePlanSurfaceContext, uid: string | undefined) {
  if (!uid) {
    return undefined;
  }
  return findNodeInTreeByUid(context.publicTree, uid) || findNodeInTreeByUid(context.rawTree, uid);
}

function getSingleSubModel(node: any, key: string) {
  const value = node?.subModels?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSubModelList(node: any, key: string) {
  return _.castArray(node?.subModels?.[key] || []).filter((item) => item && typeof item === 'object');
}

function isGridNode(node: any) {
  return typeof node?.use === 'string' && node.use.endsWith('GridModel');
}

function resolveReplaceComposeGridNode(targetNode: any): any {
  if (!targetNode || typeof targetNode !== 'object') {
    return undefined;
  }
  if (isGridNode(targetNode)) {
    return targetNode;
  }
  const directGrid = getSingleSubModel(targetNode, 'grid');
  if (directGrid) {
    return directGrid;
  }
  const firstTab = getSubModelList(targetNode, 'tabs')[0];
  const firstTabGrid = getSingleSubModel(firstTab, 'grid');
  if (firstTabGrid) {
    return firstTabGrid;
  }
  const popupPage = getSingleSubModel(targetNode, 'page');
  const firstPopupTab = getSubModelList(popupPage, 'tabs')[0];
  return getSingleSubModel(firstPopupTab, 'grid');
}

async function collectReplaceScopeExistingKeys(
  step: FlowSurfacePlanStep,
  context: FlowSurfacePlanSurfaceContext,
  target: FlowSurfaceResolvedSelector | undefined,
  deps: CompilePlanStepDeps,
  options: { transaction?: any } = {},
) {
  if (!isReplaceComposeStep(step)) {
    return new Set<string>();
  }
  let targetNode =
    getContextNodeByUid(context, getResolvedSelectorUid(target)) ||
    (!target || 'summary' in target ? undefined : target.node);
  if (!targetNode && target && !('summary' in target) && target.resolved && deps.loadResolvedSurfaceTree) {
    targetNode = await deps.loadResolvedSurfaceTree(target.resolved, options.transaction);
  }
  if (!targetNode) {
    return new Set<string>();
  }
  const gridNode = resolveReplaceComposeGridNode(targetNode);
  if (!gridNode) {
    return new Set<string>();
  }
  const replacedUids = new Set<string>();
  for (const item of getSubModelList(gridNode, 'items')) {
    collectNodeAndDescendantUids(item, replacedUids);
  }
  const keys = new Set<string>();
  context.keyMap.forEach((info, key) => {
    if (replacedUids.has(info.uid)) {
      keys.add(key);
    }
  });
  return keys;
}

function buildExistingKeysForConflict(
  context: FlowSurfacePlanSurfaceContext,
  priorCreatedKeys: Set<string>,
  allowedExistingKeys: Set<string>,
) {
  const existing = new Set<string>();
  context.keyMap.forEach((_info, key) => {
    if (!allowedExistingKeys.has(key)) {
      existing.add(key);
    }
  });
  priorCreatedKeys.forEach((key) => existing.add(key));
  return existing;
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

  const targetSelectorKey = isFlowSurfacePureKeyObject(step.selectors?.target)
    ? String(step.selectors.target.key || '').trim()
    : undefined;
  const createdKeys = collectFlowSurfaceCreatedKeys(step.action, step.values || {}, {
    targetSelectorKey,
  });

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

  let resolvedTarget: FlowSurfaceResolvedSelector | undefined;
  let resolvedSource: FlowSurfaceResolvedSelector | undefined;
  if (selectorRequirements.requiresTarget) {
    const targetSelector = step.selectors?.target;
    if (!targetSelector) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.target`);
    }
    resolvedTarget = await resolvePlanSelectorInContext(
      actionName,
      targetSelector,
      context,
      deps,
      `plan.steps[${index}].selectors.target`,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
  }
  if (selectorRequirements.requiresSource) {
    const sourceSelector = step.selectors?.source;
    if (!sourceSelector) {
      throwBadRequest(`flowSurfaces ${actionName} plan.steps[${index}] requires selectors.source`);
    }
    resolvedSource = await resolvePlanSelectorInContext(
      actionName,
      sourceSelector,
      context,
      deps,
      `plan.steps[${index}].selectors.source`,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
  }

  assertReplaceComposeTargetSupportsScopeResolution(actionName, index, step, resolvedTarget);
  const allowedExistingKeys = await collectReplaceScopeExistingKeys(step, context, resolvedTarget, deps, options);
  assertNoDuplicateFlowSurfaceCreatedKeys(createdKeys, `flowSurfaces ${actionName} plan.steps[${index}]`, {
    existingKeys: buildExistingKeysForConflict(context, priorCreatedKeys, allowedExistingKeys),
    reservedNames: [...priorStepIds, ...(step.id ? [step.id] : [])],
  });

  const payload = replaceFlowSurfacePlanStepLinks(
    actionName,
    runtimeValues,
    `plan.steps[${index}].values`,
    priorStepIds,
    new Set<string>([...context.keyMap.keys(), ...priorCreatedKeys]),
    allowedExistingKeys,
  );

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

  if (spec.selectorMode === 'none') {
    compiled.payload = payload;
  } else if (spec.selectorMode === 'target') {
    const target = resolvedTarget as FlowSurfaceResolvedSelector;
    compiled.payload = {
      ...payload,
      target: {
        uid: buildSelectorRuntimeValue(target),
      },
    };
    compiled.resolvedSelectors.target = addUsedKey(target);
  } else if (spec.selectorMode === 'rootUidTarget') {
    const target = resolvedTarget as FlowSurfaceResolvedSelector;
    compiled.payload = {
      ...payload,
      uid: buildSelectorRuntimeValue(target),
    };
    compiled.resolvedSelectors.target = addUsedKey(target);
  } else if (spec.selectorMode === 'sourceTarget') {
    const source = resolvedSource as FlowSurfaceResolvedSelector;
    const target = resolvedTarget as FlowSurfaceResolvedSelector;
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
