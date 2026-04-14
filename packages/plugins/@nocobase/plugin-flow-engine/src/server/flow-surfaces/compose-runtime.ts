/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { throwConflict } from './errors';
import { isFlowSurfaceDefaultActionPopupType } from './default-action-popup';
import {
  resolveComposeTargetKey,
  type FlowSurfaceCompiledComposePlan,
  type FlowSurfaceComposeNormalizedActionSpec,
  type FlowSurfaceComposeNormalizedBlockSpec,
  type FlowSurfaceComposeNormalizedFieldSpec,
  type FlowSurfaceComposeObject,
  type FlowSurfaceComposeTargetKey,
} from './compose-compiler';

export type FlowSurfaceComposeBlockResult = {
  uid: string;
  gridUid?: string;
  itemUid?: string;
  itemGridUid?: string;
  actionsColumnUid?: string;
};

export type FlowSurfaceComposeFieldResult = {
  uid?: string;
  wrapperUid?: string;
  fieldUid?: string;
  innerFieldUid?: string;
  popupPageUid?: string;
  popupTabUid?: string;
  popupGridUid?: string;
};

export type FlowSurfaceComposeActionResult = {
  uid: string;
  parentUid?: string;
  scope?: string;
};

export type FlowSurfaceComposeRuntimeBlockState = {
  spec: FlowSurfaceComposeNormalizedBlockSpec;
  result: FlowSurfaceComposeBlockResult;
  fieldResults: Array<Record<string, unknown>>;
  actionResults: Array<Record<string, unknown>>;
  recordActionResults: Array<Record<string, unknown>>;
};

export type FlowSurfaceComposeRuntimeState = {
  keyMap: Record<string, FlowSurfaceComposeTargetKey & Partial<FlowSurfaceComposeBlockResult>>;
  blocks: FlowSurfaceComposeRuntimeBlockState[];
};

export type FlowSurfaceComposeExecutionResult = {
  target: {
    uid: string;
  };
  mode: FlowSurfaceCompiledComposePlan['mode'];
  blocks: Array<{
    key: string;
    type?: string;
    uid: string;
    gridUid?: string;
    itemUid?: string;
    itemGridUid?: string;
    actionsColumnUid?: string;
    fields: Array<Record<string, unknown>>;
    actions: Array<Record<string, unknown>>;
    recordActions: Array<Record<string, unknown>>;
  }>;
  layout?: unknown;
};

export type FlowSurfaceComposeRuntimeDeps = {
  removeExistingItem?: (uid: string) => Promise<void>;
  createBlock: (
    payload: Record<string, unknown>,
    spec: FlowSurfaceComposeNormalizedBlockSpec,
  ) => Promise<FlowSurfaceComposeBlockResult>;
  applyNodeSettings?: (
    actionName: string,
    targetUid: string | undefined,
    settings?: FlowSurfaceComposeObject,
  ) => Promise<void>;
  createField: (
    payload: Record<string, unknown>,
    spec: FlowSurfaceComposeNormalizedFieldSpec,
    blockResult: FlowSurfaceComposeBlockResult,
  ) => Promise<FlowSurfaceComposeFieldResult | null>;
  applyFieldSettings?: (
    actionName: string,
    result: FlowSurfaceComposeFieldResult,
    settings?: FlowSurfaceComposeObject,
  ) => Promise<void>;
  onFieldError?: (input: {
    error: unknown;
    spec: FlowSurfaceComposeNormalizedFieldSpec;
    blockSpec: FlowSurfaceComposeNormalizedBlockSpec;
    blockResult: FlowSurfaceComposeBlockResult;
  }) => Promise<'continue' | void> | 'continue' | void;
  createAction: (
    payload: Record<string, unknown>,
    spec: FlowSurfaceComposeNormalizedActionSpec,
    blockResult: FlowSurfaceComposeBlockResult,
  ) => Promise<FlowSurfaceComposeActionResult>;
  createRecordAction: (
    payload: Record<string, unknown>,
    spec: FlowSurfaceComposeNormalizedActionSpec,
    blockResult: FlowSurfaceComposeBlockResult,
  ) => Promise<FlowSurfaceComposeActionResult>;
  applyActionPopup?: (actionName: string, actionUid: string, popup?: FlowSurfaceComposeObject) => Promise<void>;
  collectActionKeys?: (actionUid: string) => Promise<Record<string, unknown>>;
  buildExplicitLayoutPayload?: (input: {
    layout?: FlowSurfaceComposeObject;
    createdByKey: Record<string, FlowSurfaceComposeTargetKey & Partial<FlowSurfaceComposeBlockResult>>;
    gridUid: string;
  }) => Promise<Record<string, unknown>> | Record<string, unknown>;
  buildAppendLayoutPayload?: (input: {
    gridUid: string;
    appendedItemUids: string[];
  }) => Promise<Record<string, unknown>> | Record<string, unknown>;
  setLayout?: (payload: Record<string, unknown>) => Promise<unknown>;
};

export async function executeComposeRuntime(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
): Promise<FlowSurfaceComposeExecutionResult> {
  assertComposeRuntimeDeps(plan, deps);

  const state = createComposeRuntimeState();

  await removeExistingItemsForReplace(plan, deps);
  await createBlocks(plan, deps, state);
  await applyBlockSettings(deps, state);
  await createFields(plan, deps, state);
  await createActions(plan, deps, state);
  await createRecordActions(plan, deps, state);

  const layoutResult = await applyComposeLayout(plan, deps, state);

  return {
    target: {
      uid: plan.gridUid,
    },
    mode: plan.mode,
    blocks: state.blocks.map((block) => ({
      key: block.spec.key,
      type: block.spec.type,
      uid: block.result.uid,
      gridUid: block.result.gridUid,
      itemUid: block.result.itemUid,
      itemGridUid: block.result.itemGridUid,
      actionsColumnUid: block.result.actionsColumnUid,
      fields: block.fieldResults,
      actions: block.actionResults,
      recordActions: block.recordActionResults,
    })),
    ...(typeof layoutResult === 'undefined' ? {} : { layout: layoutResult }),
  };
}

export function createComposeRuntimeState(): FlowSurfaceComposeRuntimeState {
  return {
    keyMap: {},
    blocks: [],
  };
}

function shouldApplyActionPopupAfterEffect(spec: FlowSurfaceComposeNormalizedActionSpec) {
  return hasPopupAfterEffect(spec.popup) || isFlowSurfaceDefaultActionPopupType(spec.type);
}

function assertComposeRuntimeDeps(plan: FlowSurfaceCompiledComposePlan, deps: FlowSurfaceComposeRuntimeDeps) {
  if (plan.mode === 'replace' && plan.existingItemUids.length) {
    requireComposeRuntimeDep('removeExistingItem', deps.removeExistingItem, 'replace');
  }
  if (plan.blocks.some((block) => hasInlineSettings(block.spec.settings))) {
    requireComposeRuntimeDep('applyNodeSettings', deps.applyNodeSettings, 'block settings');
  }
  if (plan.fields.some((field) => hasInlineSettings(field.spec.settings))) {
    requireComposeRuntimeDep('applyFieldSettings', deps.applyFieldSettings, 'field settings');
  }
  if (
    [...plan.actions, ...plan.recordActions].some(
      (action) => hasInlineSettings(action.spec.settings) || shouldApplyActionPopupAfterEffect(action.spec),
    )
  ) {
    if ([...plan.actions, ...plan.recordActions].some((action) => hasInlineSettings(action.spec.settings))) {
      requireComposeRuntimeDep('applyNodeSettings', deps.applyNodeSettings, 'action settings');
    }
    if ([...plan.actions, ...plan.recordActions].some((action) => shouldApplyActionPopupAfterEffect(action.spec))) {
      requireComposeRuntimeDep('applyActionPopup', deps.applyActionPopup, 'action popup');
    }
  }
}

function requireComposeRuntimeDep<T>(name: string, dep: T | undefined, stage: string): asserts dep is T {
  if (dep) {
    return;
  }
  throwConflict(
    `flowSurfaces compose ${stage} runtime deps missing '${name}'`,
    'FLOW_SURFACE_COMPOSE_RUNTIME_DEPS_MISSING',
  );
}

async function removeExistingItemsForReplace(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
) {
  if (plan.mode !== 'replace' || !plan.existingItemUids.length) {
    return;
  }
  const removeExistingItem = deps.removeExistingItem;
  requireComposeRuntimeDep('removeExistingItem', removeExistingItem, 'replace');
  for (const uid of plan.existingItemUids) {
    await removeExistingItem(uid);
  }
}

async function createBlocks(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
  state: FlowSurfaceComposeRuntimeState,
) {
  for (const blockTask of plan.blocks) {
    const result = await deps.createBlock(blockTask.payload, blockTask.spec);
    state.blocks.push({
      spec: blockTask.spec,
      result,
      fieldResults: [],
      actionResults: [],
      recordActionResults: [],
    });
    state.keyMap[blockTask.key] = {
      uid: result.uid,
      gridUid: result.gridUid,
      itemUid: result.itemUid,
      itemGridUid: result.itemGridUid,
      actionsColumnUid: result.actionsColumnUid,
    };
  }
}

async function applyBlockSettings(deps: FlowSurfaceComposeRuntimeDeps, state: FlowSurfaceComposeRuntimeState) {
  const applyNodeSettings = deps.applyNodeSettings;
  if (!applyNodeSettings) {
    return;
  }
  for (const block of state.blocks) {
    if (!hasInlineSettings(block.spec.settings)) {
      continue;
    }
    await applyNodeSettings('compose block', block.result.uid, block.spec.settings);
  }
}

async function createFields(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
  state: FlowSurfaceComposeRuntimeState,
) {
  for (const fieldTask of plan.fields) {
    const block = requireBlockState(fieldTask.blockKey, state);
    const targetUid =
      fieldTask.containerSource === 'item' ? block.result.itemUid || block.result.uid : block.result.uid;
    let createdField: FlowSurfaceComposeFieldResult | null;
    try {
      createdField = await deps.createField(
        {
          target: {
            uid: targetUid,
          },
          ...fieldTask.payload,
          ...(readComposeFieldTargetKey(fieldTask.spec.target)
            ? {
                defaultTargetUid: resolveComposeTargetKey(
                  readComposeFieldTargetKey(fieldTask.spec.target) as string,
                  state.keyMap,
                  'field',
                ),
              }
            : {}),
        },
        fieldTask.spec,
        block.result,
      );
    } catch (error) {
      const decision = deps.onFieldError
        ? await deps.onFieldError({
            error,
            spec: fieldTask.spec,
            blockSpec: block.spec,
            blockResult: block.result,
          })
        : undefined;
      if (decision === 'continue') {
        continue;
      }
      throw error;
    }
    if (!createdField) {
      continue;
    }

    if (deps.applyFieldSettings && hasInlineSettings(fieldTask.spec.settings)) {
      await deps.applyFieldSettings('compose field', createdField, fieldTask.spec.settings);
    }

    block.fieldResults.push(buildFieldResultSummary(fieldTask.spec, createdField));
  }
}

async function createActions(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
  state: FlowSurfaceComposeRuntimeState,
) {
  for (const actionTask of plan.actions) {
    const block = requireBlockState(actionTask.blockKey, state);
    const createdAction = await deps.createAction(
      {
        target: {
          uid: block.result.uid,
        },
        ...actionTask.payload,
      },
      actionTask.spec,
      block.result,
    );

    if (deps.applyNodeSettings && hasInlineSettings(actionTask.spec.settings)) {
      await deps.applyNodeSettings('compose action', createdAction.uid, actionTask.spec.settings);
    }
    if (deps.applyActionPopup && shouldApplyActionPopupAfterEffect(actionTask.spec)) {
      await deps.applyActionPopup('compose action', createdAction.uid, actionTask.spec.popup);
    }

    const actionKeys = deps.collectActionKeys ? await deps.collectActionKeys(createdAction.uid) : {};
    block.actionResults.push(buildActionResultSummary(actionTask.spec, createdAction, actionKeys));
  }
}

async function createRecordActions(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
  state: FlowSurfaceComposeRuntimeState,
) {
  for (const recordActionTask of plan.recordActions) {
    const block = requireBlockState(recordActionTask.blockKey, state);
    const createdAction = await deps.createRecordAction(
      {
        target: {
          uid: block.result.uid,
        },
        ...recordActionTask.payload,
      },
      recordActionTask.spec,
      block.result,
    );

    if (!block.result.actionsColumnUid && block.spec.type === 'table' && createdAction.parentUid) {
      block.result.actionsColumnUid = createdAction.parentUid;
      state.keyMap[recordActionTask.blockKey] = {
        ...state.keyMap[recordActionTask.blockKey],
        actionsColumnUid: createdAction.parentUid,
      };
    }

    if (deps.applyNodeSettings && hasInlineSettings(recordActionTask.spec.settings)) {
      await deps.applyNodeSettings('compose recordAction', createdAction.uid, recordActionTask.spec.settings);
    }
    if (deps.applyActionPopup && shouldApplyActionPopupAfterEffect(recordActionTask.spec)) {
      await deps.applyActionPopup('compose recordAction', createdAction.uid, recordActionTask.spec.popup);
    }

    const actionKeys = deps.collectActionKeys ? await deps.collectActionKeys(createdAction.uid) : {};
    block.recordActionResults.push(buildActionResultSummary(recordActionTask.spec, createdAction, actionKeys));
  }
}

async function applyComposeLayout(
  plan: FlowSurfaceCompiledComposePlan,
  deps: FlowSurfaceComposeRuntimeDeps,
  state: FlowSurfaceComposeRuntimeState,
) {
  if (plan.layoutPlan.kind === 'none') {
    return undefined;
  }

  if (plan.layoutPlan.kind === 'explicit') {
    const buildExplicitLayoutPayload = deps.buildExplicitLayoutPayload;
    const setLayout = deps.setLayout;
    requireComposeRuntimeDep('buildExplicitLayoutPayload', buildExplicitLayoutPayload, 'explicit layout');
    requireComposeRuntimeDep('setLayout', setLayout, 'explicit layout');
    const layoutPayload = await buildExplicitLayoutPayload({
      layout: plan.layoutPlan.layout,
      createdByKey: state.keyMap,
      gridUid: plan.gridUid,
    });
    return setLayout({
      target: {
        uid: plan.gridUid,
      },
      ...layoutPayload,
    });
  }

  const buildAppendLayoutPayload = deps.buildAppendLayoutPayload;
  const setLayout = deps.setLayout;
  requireComposeRuntimeDep('buildAppendLayoutPayload', buildAppendLayoutPayload, 'append layout');
  requireComposeRuntimeDep('setLayout', setLayout, 'append layout');

  const layoutPayload = await buildAppendLayoutPayload({
    gridUid: plan.gridUid,
    appendedItemUids: state.blocks.map((block) => block.result.uid),
  });
  return setLayout({
    target: {
      uid: plan.gridUid,
    },
    ...layoutPayload,
  });
}

function requireBlockState(blockKey: string, state: FlowSurfaceComposeRuntimeState) {
  const matched = state.blocks.find((block) => block.spec.key === blockKey);
  if (!matched) {
    throwConflict(
      `flowSurfaces compose block '${blockKey}' is missing from runtime state`,
      'FLOW_SURFACE_COMPOSE_BLOCK_MISSING',
    );
  }
  return matched;
}

function buildFieldResultSummary(
  spec: FlowSurfaceComposeNormalizedFieldSpec,
  createdField: FlowSurfaceComposeFieldResult,
) {
  return {
    key: spec.key,
    uid: createdField.uid,
    ...(spec.type ? { type: spec.type } : {}),
    ...(spec.renderer ? { renderer: spec.renderer } : {}),
    fieldPath: spec.fieldPath,
    associationPathName: spec.associationPathName,
    wrapperUid: createdField.wrapperUid,
    fieldUid: createdField.fieldUid,
    innerFieldUid: createdField.innerFieldUid,
    popupPageUid: createdField.popupPageUid,
    popupTabUid: createdField.popupTabUid,
    popupGridUid: createdField.popupGridUid,
    ...(spec.target ? { target: spec.target } : {}),
  };
}

function buildActionResultSummary(
  spec: FlowSurfaceComposeNormalizedActionSpec,
  createdAction: FlowSurfaceComposeActionResult,
  actionKeys: Record<string, unknown>,
) {
  return {
    key: spec.key,
    type: spec.type,
    scope: createdAction.scope,
    uid: createdAction.uid,
    parentUid: createdAction.parentUid,
    ...actionKeys,
  };
}

function hasInlineSettings(value: FlowSurfaceComposeObject | undefined) {
  return !!value && Object.keys(value).length > 0;
}

function hasPopupAfterEffect(value: FlowSurfaceComposeObject | undefined) {
  return typeof value !== 'undefined';
}

function readComposeFieldTargetKey(target: FlowSurfaceComposeNormalizedFieldSpec['target']) {
  if (typeof target === 'string') {
    const normalized = target.trim();
    return normalized || undefined;
  }
  if (!target || typeof target !== 'object') {
    return undefined;
  }
  const key = typeof (target as any).composeKey === 'string' ? (target as any).composeKey : (target as any).key;
  const normalized = typeof key === 'string' ? key.trim() : '';
  return normalized || undefined;
}
