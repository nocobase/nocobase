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
import { executeMutateOps, resolveFlowSurfaceValueRefs } from '../executor';
import type {
  FlowSurfaceDescribeValues,
  FlowSurfaceExecutePlanValues,
  FlowSurfaceExecutorContext,
  FlowSurfaceMutateOp,
  FlowSurfaceReadLocator,
  FlowSurfaceReadTarget,
  FlowSurfaceResolvedTarget,
  FlowSurfaceValidatePlanValues,
} from '../types';
import { isFlowSurfacePlanOnlyAction, type FlowSurfacePlanOnlyActionName } from './action-specs';
import { buildPlanSurfaceContext as buildPlanningSurfaceContext } from './context';
import {
  compilePlanStep as compilePlanningStep,
  normalizePlanSelector as normalizePlanningSelector,
  normalizePlanSteps as normalizePlanningSteps,
} from './compiler';
import { assertBindRefKind as assertPlanningBindRefKind, buildPlanRefKind as buildPlanningRefKind } from './ref-kind';
import {
  annotateTreeRef as annotatePlanningTreeRef,
  buildSurfaceRefsObject as buildPlanningSurfaceRefsObject,
  collectDeclaredRefsFromTree as collectPlanningDeclaredRefsFromTree,
  collectRequestRefsToPersist,
  normalizeBindRefs as normalizePlanningBindRefs,
} from './ref-registry';
import { validateFlowSurfacePayloadShape } from '../payload-shape';
import type { FlowSurfaceCompiledPlanStep, FlowSurfacePlanSurfaceContext, FlowSurfaceResolvedRef } from './types';

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
    context: Pick<FlowSurfacePlanSurfaceContext, 'surfaceResolved' | 'publicTree' | 'refMap'>,
  ) => string;
  buildSurfaceReadPayload: (
    target: FlowSurfaceReadLocator,
    resolved: FlowSurfaceResolvedTarget,
    node: any,
    options?: { transaction?: any },
  ) => Promise<any>;
  assertRequestRefsPersistable: (
    actionName: string,
    refs: Map<string, FlowSurfaceResolvedRef>,
    transaction?: any,
  ) => Promise<void>;
  persistDeclaredRefForNode: (refInfo: FlowSurfaceResolvedRef, transaction?: any) => Promise<Record<string, any>>;
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
  bindRefsInput: any,
  actionName: string,
  deps: FlowSurfacePlanningRuntimeDeps,
  options: { transaction?: any } = {},
): Promise<FlowSurfacePlanSurfaceContext> {
  const bindRefs = normalizePlanningBindRefs(actionName, bindRefsInput, {
    normalizeGetTarget: deps.normalizeGetTarget,
  });
  if (_.isUndefined(surfaceSelectorInput) || _.isNil(surfaceSelectorInput)) {
    return buildPlanningSurfaceContext(
      {
        actionName,
        bindRefs,
      },
      {
        resolveLocator: deps.resolveLocator,
        loadResolvedSurfaceTree: deps.loadResolvedSurfaceTree,
        stripInternalSurfaceMetaFromNodeTree: deps.stripInternalSurfaceMetaFromNodeTree,
        buildReadTargetSummary: deps.buildReadTargetSummary,
        buildSurfaceContextFingerprint: deps.buildSurfaceContextFingerprint,
        buildPlanRefKind: buildPlanningRefKind,
        assertBindRefKind: assertPlanningBindRefKind,
        collectDeclaredRefsFromTree: (node) =>
          collectPlanningDeclaredRefsFromTree(
            node,
            {
              actionName,
              buildPlanRefKind: buildPlanningRefKind,
            },
            new Map<string, FlowSurfaceResolvedRef>(),
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
      allowRef: true,
    },
  );
  if ('step' in normalizedSurfaceSelector) {
    throwBadRequest(`flowSurfaces ${actionName} surface only supports { ref } or { locator }`);
  }
  return buildPlanningSurfaceContext(
    {
      actionName,
      surfaceSelector: normalizedSurfaceSelector,
      bindRefs,
    },
    {
      resolveLocator: deps.resolveLocator,
      loadResolvedSurfaceTree: deps.loadResolvedSurfaceTree,
      stripInternalSurfaceMetaFromNodeTree: deps.stripInternalSurfaceMetaFromNodeTree,
      buildReadTargetSummary: deps.buildReadTargetSummary,
      buildSurfaceContextFingerprint: deps.buildSurfaceContextFingerprint,
      buildPlanRefKind: buildPlanningRefKind,
      assertBindRefKind: assertPlanningBindRefKind,
      collectDeclaredRefsFromTree: (node) =>
        collectPlanningDeclaredRefsFromTree(
          node,
          {
            actionName,
            buildPlanRefKind: buildPlanningRefKind,
          },
          new Map<string, FlowSurfaceResolvedRef>(),
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
  const refByUid = new Map<string, string>();
  context.refMap.forEach((value, key) => {
    if (!refByUid.has(value.uid)) {
      refByUid.set(value.uid, key);
    }
  });
  annotatePlanningTreeRef(tree, refByUid);
  const result = await deps.buildSurfaceReadPayload(context.surfaceTarget, context.surfaceResolved, tree, options);
  result.fingerprint = context.fingerprint;
  result.refs = buildPlanningSurfaceRefsObject(context.refMap);
  return result;
}

function normalizePlanSteps(
  actionName: string,
  values: FlowSurfaceValidatePlanValues,
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
      buildPlanRefKind: buildPlanningRefKind,
    },
    priorStepIds,
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
    resolveFlowSurfaceValueRefs(_.cloneDeep(compiled.payload), execCtx.refs),
    transaction,
  );
  if (compiled.id) {
    execCtx.refs.set(compiled.id, result);
  }
  return result;
}

function assertBootstrapPlanConstraints(
  actionName: string,
  values: FlowSurfaceValidatePlanValues,
  compiledSteps: FlowSurfaceCompiledPlanStep[],
) {
  if (!_.isUndefined(values.bindRefs) && (!Array.isArray(values.bindRefs) || values.bindRefs.length > 0)) {
    throwBadRequest(`flowSurfaces ${actionName} bindRefs require surface`);
  }
  if (!_.isUndefined(values.expectedFingerprint) && String(values.expectedFingerprint || '').trim()) {
    throwBadRequest(`flowSurfaces ${actionName} expectedFingerprint requires surface`);
  }
  for (const compiled of compiledSteps) {
    for (const selector of Object.values(compiled.resolvedSelectors)) {
      if (!selector) {
        continue;
      }
      if (selector.source !== 'step') {
        throwBadRequest(`flowSurfaces ${actionName} bootstrap plan only supports step selectors`);
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
  const context = await buildPlanSurfaceContext({ locator }, values.bindRefs, 'describeSurface', deps, options);
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
  const context = await buildPlanSurfaceContext(values.surface, values.bindRefs, 'validatePlan', deps, options);
  if (context.fingerprint) {
    assertPlanFingerprint('validatePlan', values.expectedFingerprint, context.fingerprint);
  }
  const steps = normalizePlanSteps('validatePlan', values, deps);
  const compiledSteps: FlowSurfaceCompiledPlanStep[] = [];
  const priorStepIds = new Set<string>();
  for (const [index, step] of steps.entries()) {
    compiledSteps.push(await compilePlanStep('validatePlan', step, index, context, deps, priorStepIds, options));
    if (step.id) {
      priorStepIds.add(step.id);
    }
  }
  if (!context.surfaceSelector) {
    assertBootstrapPlanConstraints('validatePlan', values, compiledSteps);
  }
  const requestRefsToPersist = collectRequestRefsToPersist(context, compiledSteps);
  await deps.assertRequestRefsPersistable('validatePlan', requestRefsToPersist, options.transaction);

  return {
    target: context.targetSummary,
    fingerprint: context.fingerprint,
    refs: buildPlanningSurfaceRefsObject(context.refMap),
    compiledSteps: serializeCompiledPlanSteps(compiledSteps),
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
  const context = await buildPlanSurfaceContext(values.surface, values.bindRefs, 'executePlan', deps, options);
  if (context.fingerprint) {
    assertPlanFingerprint('executePlan', values.expectedFingerprint, context.fingerprint);
  }
  const steps = normalizePlanSteps('executePlan', values, deps);
  const compiledSteps: FlowSurfaceCompiledPlanStep[] = [];
  const priorStepIds = new Set<string>();
  for (const [index, step] of steps.entries()) {
    compiledSteps.push(await compilePlanStep('executePlan', step, index, context, deps, priorStepIds, options));
    if (step.id) {
      priorStepIds.add(step.id);
    }
  }
  if (!context.surfaceSelector) {
    assertBootstrapPlanConstraints('executePlan', values, compiledSteps);
  }
  const requestRefsToPersist = collectRequestRefsToPersist(context, compiledSteps);
  await deps.assertRequestRefsPersistable('executePlan', requestRefsToPersist, options.transaction);

  const results = [] as Array<Record<string, any>>;
  const execCtx: FlowSurfaceExecutorContext = {
    transaction: options.transaction,
    refs: new Map(),
    clientKeyToUid: {},
  };
  for (const compiled of compiledSteps) {
    const result = await executeCompiledPlanStep(compiled, deps, execCtx, options.transaction);
    results.push({
      index: compiled.index,
      ...(compiled.id ? { id: compiled.id } : {}),
      action: compiled.action,
      result,
    });
  }

  const persistedRefs = [] as Array<Record<string, any>>;
  for (const refInfo of requestRefsToPersist.values()) {
    persistedRefs.push(await deps.persistDeclaredRefForNode(refInfo, options.transaction));
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
    refs: afterDescribe?.refs || {},
    compiledSteps: serializeCompiledPlanSteps(compiledSteps),
    results,
    persistedRefs,
  };
}
