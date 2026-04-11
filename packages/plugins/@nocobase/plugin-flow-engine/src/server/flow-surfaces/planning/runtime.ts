/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest, throwConflict, throwInternalError } from '../errors';
import { executeMutateOps, resolveFlowSurfaceValueKeys } from '../executor';
import type {
  FlowSurfaceDescribeValues,
  FlowSurfaceExecutePlanValues,
  FlowSurfaceExecutorContext,
  FlowSurfaceMutateOp,
  FlowSurfacePlanRequestValues,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
  FlowSurfaceValidatePlanValidationResult,
  FlowSurfaceValidatePlanValues,
} from '../types';
import { isFlowSurfacePlanOnlyAction, type FlowSurfacePlanOnlyActionName } from './action-specs';
import { buildPlanSurfaceContext as buildPlanningSurfaceContext } from './context';
import {
  compilePlanStep as compilePlanningStep,
  normalizePlanSelector as normalizePlanningSelector,
  normalizePlanSteps as normalizePlanningSteps,
} from './compiler';
import { assertBindKeyKind as assertPlanningBindKeyKind, buildPlanKeyKind as buildPlanningKeyKind } from './key-kind';
import {
  annotateTreeKey as annotatePlanningTreeKey,
  buildSurfaceKeysObject as buildPlanningSurfaceKeysObject,
  collectDeclaredKeysFromTree as collectPlanningDeclaredKeysFromTree,
  collectRequestKeysToPersist,
  normalizeBindKeys as normalizePlanningBindKeys,
} from './key-registry';
import { collectPersistableFlowSurfaceCreatedKeys, registerFlowSurfaceCreatedKeys } from './created-keys';
import { validateFlowSurfacePayloadShape } from '../payload-shape';
import type { FlowSurfaceCompiledPlanStep, FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedKey } from './types';

type FlowSurfacePlanningRuntimeDeps = {
  normalizeGetTarget: (value: any) => FlowSurfaceReadLocator;
  resolveLocator: (
    target: FlowSurfaceReadLocator,
    options?: { transaction?: any },
  ) => Promise<FlowSurfaceResolvedTarget>;
  loadResolvedSurfaceTree: (resolved: FlowSurfaceResolvedTarget, transaction?: any) => Promise<any>;
  stripInternalSurfaceMetaFromNodeTree: <T = any>(node: T) => T;
  buildReadTargetSummary: (
    target: FlowSurfaceReadLocator,
    resolved: FlowSurfaceResolvedTarget,
  ) => FlowSurfaceReadTarget;
  buildSurfaceContextFingerprint: (
    context: Pick<FlowSurfacePlanSurfaceContext, 'surfaceResolved' | 'publicTree' | 'keyMap'>,
  ) => string;
  buildSurfaceReadPayload: (
    target: FlowSurfaceReadLocator,
    resolved: FlowSurfaceResolvedTarget,
    node: any,
    options?: { transaction?: any },
  ) => Promise<any>;
  assertRequestKeysPersistable: (
    actionName: string,
    keys: Map<string, FlowSurfaceResolvedKey>,
    transaction?: any,
  ) => Promise<void>;
  persistDeclaredKeyForNode: (keyInfo: FlowSurfaceResolvedKey, transaction?: any) => Promise<Record<string, any>>;
  dispatchPlanOnlyAction: (
    action: FlowSurfacePlanOnlyActionName,
    payload: Record<string, any>,
    transaction?: any,
  ) => Promise<any>;
  dispatchOp: (
    op: FlowSurfaceMutateOp,
    resolvedValues: Record<string, any>,
    currentCtx: FlowSurfaceExecutorContext,
  ) => Promise<any>;
  isSurfaceReadbackMissingError: (error: unknown) => boolean;
  collectValidatePlanIssues?: (
    values: FlowSurfaceValidatePlanValues,
    compiledSteps: FlowSurfaceCompiledPlanStep[],
    options?: { transaction?: any },
  ) => Promise<FlowSurfaceValidatePlanValidationResult | undefined>;
};

function assertPlanFingerprint(actionName: string, expectedFingerprint: any, actualFingerprint: string) {
  const expected = typeof expectedFingerprint === 'string' ? expectedFingerprint.trim() : '';
  if (!expected || expected === actualFingerprint) {
    return;
  }
  throwConflict(
    `flowSurfaces ${actionName} expected fingerprint '${expected}' does not match current '${actualFingerprint}'`,
    'FLOW_SURFACE_PLAN_FINGERPRINT_MISMATCH',
  );
}

async function buildPlanSurfaceContext(
  surfaceSelectorInput: any,
  bindKeysInput: any,
  actionName: string,
  deps: FlowSurfacePlanningRuntimeDeps,
  options: { transaction?: any } = {},
): Promise<FlowSurfacePlanSurfaceContext> {
  const bindKeys = normalizePlanningBindKeys(actionName, bindKeysInput, {
    normalizeGetTarget: deps.normalizeGetTarget,
  });
  if (_.isUndefined(surfaceSelectorInput) || _.isNil(surfaceSelectorInput)) {
    return buildPlanningSurfaceContext(
      {
        actionName,
        bindKeys,
      },
      {
        resolveLocator: deps.resolveLocator,
        loadResolvedSurfaceTree: deps.loadResolvedSurfaceTree,
        stripInternalSurfaceMetaFromNodeTree: deps.stripInternalSurfaceMetaFromNodeTree,
        buildReadTargetSummary: deps.buildReadTargetSummary,
        buildSurfaceContextFingerprint: deps.buildSurfaceContextFingerprint,
        buildPlanKeyKind: buildPlanningKeyKind,
        assertBindKeyKind: assertPlanningBindKeyKind,
        collectDeclaredKeysFromTree: (node) =>
          collectPlanningDeclaredKeysFromTree(
            node,
            {
              actionName,
              buildPlanKeyKind: buildPlanningKeyKind,
            },
            new Map<string, FlowSurfaceResolvedKey>(),
          ),
      },
      options,
    );
  }
  const normalizedSurfaceSelector = normalizePlanningSelector(
    actionName,
    surfaceSelectorInput,
    {
      normalizeGetTarget: deps.normalizeGetTarget,
    },
    'surface',
    {
      allowKey: true,
    },
  );
  if ('step' in normalizedSurfaceSelector) {
    throwBadRequest(`flowSurfaces ${actionName} surface only supports { key } or { locator }`);
  }
  return buildPlanningSurfaceContext(
    {
      actionName,
      surfaceSelector: normalizedSurfaceSelector,
      bindKeys,
    },
    {
      resolveLocator: deps.resolveLocator,
      loadResolvedSurfaceTree: deps.loadResolvedSurfaceTree,
      stripInternalSurfaceMetaFromNodeTree: deps.stripInternalSurfaceMetaFromNodeTree,
      buildReadTargetSummary: deps.buildReadTargetSummary,
      buildSurfaceContextFingerprint: deps.buildSurfaceContextFingerprint,
      buildPlanKeyKind: buildPlanningKeyKind,
      assertBindKeyKind: assertPlanningBindKeyKind,
      collectDeclaredKeysFromTree: (node) =>
        collectPlanningDeclaredKeysFromTree(
          node,
          {
            actionName,
            buildPlanKeyKind: buildPlanningKeyKind,
          },
          new Map<string, FlowSurfaceResolvedKey>(),
        ),
    },
    options,
  );
}

async function buildDescribeSurfaceResponse(
  context: FlowSurfacePlanSurfaceContext,
  deps: FlowSurfacePlanningRuntimeDeps,
  options: { transaction?: any } = {},
) {
  if (!context.surfaceTarget || !context.surfaceResolved) {
    throwBadRequest(`flowSurfaces describeSurface requires locator`);
  }
  const tree = _.cloneDeep(context.publicTree);
  const keyByUid = new Map<string, string>();
  context.keyMap.forEach((value, key) => {
    if (!keyByUid.has(value.uid)) {
      keyByUid.set(value.uid, key);
    }
  });
  annotatePlanningTreeKey(tree, keyByUid);
  const result = await deps.buildSurfaceReadPayload(context.surfaceTarget, context.surfaceResolved, tree, options);
  result.fingerprint = context.fingerprint;
  result.keys = buildPlanningSurfaceKeysObject(context.keyMap);
  return result;
}

function normalizePlanSteps(
  actionName: string,
  values: FlowSurfacePlanRequestValues,
  deps: FlowSurfacePlanningRuntimeDeps,
) {
  return normalizePlanningSteps(actionName, values, {
    normalizeGetTarget: deps.normalizeGetTarget,
    validatePayloadShape: validateFlowSurfacePayloadShape,
  });
}

async function compilePlanStep(
  actionName: string,
  step: any,
  index: number,
  context: FlowSurfacePlanSurfaceContext,
  deps: FlowSurfacePlanningRuntimeDeps,
  priorStepIds: Set<string>,
  priorCreatedKeys: Set<string>,
  options: { transaction?: any } = {},
): Promise<FlowSurfaceCompiledPlanStep> {
  return compilePlanningStep(
    actionName,
    step,
    index,
    context,
    {
      normalizeGetTarget: deps.normalizeGetTarget,
      resolveLocator: deps.resolveLocator,
      buildPlanKeyKind: buildPlanningKeyKind,
    },
    priorStepIds,
    priorCreatedKeys,
    options,
  );
}

function serializeCompiledPlanSteps(compiledSteps: FlowSurfaceCompiledPlanStep[]) {
  return compiledSteps.map((item) => ({
    index: item.index,
    ...(item.id ? { id: item.id } : {}),
    action: item.action,
    resolvedSelectors: item.resolvedSelectors,
    payload: item.payload,
  }));
}

async function executeCompiledPlanStep(
  compiled: FlowSurfaceCompiledPlanStep,
  deps: FlowSurfacePlanningRuntimeDeps,
  execCtx: FlowSurfaceExecutorContext,
  transaction?: any,
) {
  if (compiled.mutateOp) {
    const mutateResults = await executeMutateOps([compiled.mutateOp], execCtx, async (op, resolvedValues, currentCtx) =>
      deps.dispatchOp(op, resolvedValues, currentCtx),
    );
    return mutateResults[0]?.result;
  }
  if (!isFlowSurfacePlanOnlyAction(compiled.action)) {
    throwInternalError(`flowSurfaces executePlan action '${compiled.action}' is not supported`);
  }
  const result = await deps.dispatchPlanOnlyAction(
    compiled.action,
    resolveFlowSurfaceValueKeys(_.cloneDeep(compiled.payload), execCtx.keys),
    transaction,
  );
  if (compiled.id) {
    execCtx.keys.set(compiled.id, result);
  }
  return result;
}

function assertBootstrapPlanConstraints(
  actionName: string,
  values: FlowSurfaceValidatePlanValues,
  compiledSteps: FlowSurfaceCompiledPlanStep[],
) {
  if (!_.isUndefined(values.bindKeys) && (!Array.isArray(values.bindKeys) || values.bindKeys.length > 0)) {
    throwBadRequest(`flowSurfaces ${actionName} bindKeys require surface`);
  }
  if (!_.isUndefined(values.expectedFingerprint) && String(values.expectedFingerprint || '').trim()) {
    throwBadRequest(`flowSurfaces ${actionName} expectedFingerprint requires surface`);
  }
  for (const compiled of compiledSteps) {
    for (const selector of Object.values(compiled.resolvedSelectors)) {
      if (!selector) {
        continue;
      }
      if (selector.source !== 'step' && selector.source !== 'created') {
        throwBadRequest(`flowSurfaces ${actionName} bootstrap plan only supports step or created-key selectors`);
      }
    }
  }
}

function findBootstrapAfterLocator(results: Array<Record<string, any>>): FlowSurfaceReadLocator | null {
  for (const item of [...results].reverse()) {
    if (item?.action !== 'createPage') {
      continue;
    }
    const result = item?.result;
    if (_.isPlainObject(result) && typeof result.pageSchemaUid === 'string' && result.pageSchemaUid.trim()) {
      return {
        pageSchemaUid: result.pageSchemaUid.trim(),
      };
    }
  }
  return null;
}

export async function describeSurface(
  values: FlowSurfaceDescribeValues,
  deps: FlowSurfacePlanningRuntimeDeps,
  options: { transaction?: any } = {},
) {
  if (!_.isPlainObject(values) || !_.isPlainObject(values.locator)) {
    throwBadRequest(`flowSurfaces describeSurface requires locator`);
  }
  const locator = deps.normalizeGetTarget(values.locator);
  const context = await buildPlanSurfaceContext({ locator }, values.bindKeys, 'describeSurface', deps, options);
  return buildDescribeSurfaceResponse(context, deps, options);
}

export async function validatePlan(
  values: FlowSurfaceValidatePlanValues,
  deps: FlowSurfacePlanningRuntimeDeps,
  options: { transaction?: any } = {},
) {
  if (!_.isPlainObject(values)) {
    throwBadRequest(`flowSurfaces validatePlan requires plan`);
  }
  const context = await buildPlanSurfaceContext(values.surface, values.bindKeys, 'validatePlan', deps, options);
  if (context.fingerprint) {
    assertPlanFingerprint('validatePlan', values.expectedFingerprint, context.fingerprint);
  }
  const steps = normalizePlanSteps('validatePlan', values, deps);
  const compiledSteps: FlowSurfaceCompiledPlanStep[] = [];
  const priorStepIds = new Set<string>();
  const priorCreatedKeys = new Set<string>();
  for (const [index, step] of steps.entries()) {
    const compiled = await compilePlanStep(
      'validatePlan',
      step,
      index,
      context,
      deps,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
    compiledSteps.push(compiled);
    if (step.id) {
      priorStepIds.add(step.id);
    }
    for (const createdKey of compiled.createdKeys) {
      priorCreatedKeys.add(createdKey.key);
    }
  }
  if (!context.surfaceSelector) {
    assertBootstrapPlanConstraints('validatePlan', values, compiledSteps);
  }
  const requestKeysToPersist = collectRequestKeysToPersist(context, compiledSteps);
  await deps.assertRequestKeysPersistable('validatePlan', requestKeysToPersist, options.transaction);
  const validation =
    values.validation?.collectFieldIssues && deps.collectValidatePlanIssues
      ? await deps.collectValidatePlanIssues(values, compiledSteps, options)
      : undefined;

  return {
    target: context.targetSummary,
    fingerprint: context.fingerprint,
    keys: buildPlanningSurfaceKeysObject(context.keyMap),
    compiledSteps: serializeCompiledPlanSteps(compiledSteps),
    ...(validation ? { validation } : {}),
  };
}

export async function executePlan(
  values: FlowSurfaceExecutePlanValues,
  deps: FlowSurfacePlanningRuntimeDeps,
  options: { transaction?: any } = {},
) {
  if (!_.isPlainObject(values)) {
    throwBadRequest(`flowSurfaces executePlan requires plan`);
  }
  const context = await buildPlanSurfaceContext(values.surface, values.bindKeys, 'executePlan', deps, options);
  if (context.fingerprint) {
    assertPlanFingerprint('executePlan', values.expectedFingerprint, context.fingerprint);
  }
  const steps = normalizePlanSteps('executePlan', values, deps);
  const compiledSteps: FlowSurfaceCompiledPlanStep[] = [];
  const priorStepIds = new Set<string>();
  const priorCreatedKeys = new Set<string>();
  for (const [index, step] of steps.entries()) {
    const compiled = await compilePlanStep(
      'executePlan',
      step,
      index,
      context,
      deps,
      priorStepIds,
      priorCreatedKeys,
      options,
    );
    compiledSteps.push(compiled);
    if (step.id) {
      priorStepIds.add(step.id);
    }
    for (const createdKey of compiled.createdKeys) {
      priorCreatedKeys.add(createdKey.key);
    }
  }
  if (!context.surfaceSelector) {
    assertBootstrapPlanConstraints('executePlan', values, compiledSteps);
  }
  const requestKeysToPersist = collectRequestKeysToPersist(context, compiledSteps);
  await deps.assertRequestKeysPersistable('executePlan', requestKeysToPersist, options.transaction);

  const results = [] as Array<Record<string, any>>;
  const persistedKeys = [] as Array<Record<string, any>>;
  const execCtx: FlowSurfaceExecutorContext = {
    transaction: options.transaction,
    keys: new Map(Array.from(context.keyMap.entries()).map(([key, info]) => [key, info.uid])),
    clientKeyToUid: {},
  };
  for (const compiled of compiledSteps) {
    const result = await executeCompiledPlanStep(compiled, deps, execCtx, options.transaction);
    const createdKeys = registerFlowSurfaceCreatedKeys(result, compiled.createdKeys, execCtx.keys);
    const persistedCreatedKeys = collectPersistableFlowSurfaceCreatedKeys(result, compiled.createdKeys);
    results.push({
      index: compiled.index,
      ...(compiled.id ? { id: compiled.id } : {}),
      action: compiled.action,
      result,
      ...(createdKeys.length ? { createdKeys } : {}),
    });
    persistedCreatedKeys.forEach((item) => {
      persistedKeys.push({
        key: item.key,
        uid: item.uid,
        persisted: true,
      });
    });
  }

  for (const keyInfo of requestKeysToPersist.values()) {
    persistedKeys.push(await deps.persistDeclaredKeyForNode(keyInfo, options.transaction));
  }

  let afterDescribe: any = null;
  let surfaceExistsAfterExecute: boolean | null = context.surfaceTarget ? true : null;
  const afterLocator = context.surfaceTarget || findBootstrapAfterLocator(results);
  if (afterLocator) {
    try {
      const afterContext = await buildPlanSurfaceContext(
        { locator: afterLocator },
        undefined,
        'executePlan',
        deps,
        options,
      );
      afterDescribe = await buildDescribeSurfaceResponse(afterContext, deps, options);
      surfaceExistsAfterExecute = true;
    } catch (error) {
      if (deps.isSurfaceReadbackMissingError(error)) {
        surfaceExistsAfterExecute = false;
      } else {
        throw error;
      }
    }
  }

  return {
    target: afterDescribe?.target || context.targetSummary,
    fingerprintBefore: context.fingerprint,
    surfaceExistsAfterExecute,
    keys: afterDescribe?.keys || {},
    compiledSteps: serializeCompiledPlanSteps(compiledSteps),
    results,
    persistedKeys,
  };
}
