/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { throwBadRequest } from './errors';
import type { FlowSurfaceComposeMode } from './types';

export type FlowSurfaceComposeObject = Record<string, unknown>;

export type FlowSurfaceComposeTargetRef = {
  uid?: string;
};

export type FlowSurfaceComposeNormalizedResource =
  | {
      kind: 'semantic' | 'raw';
      value: FlowSurfaceComposeObject;
    }
  | undefined;

export type FlowSurfaceComposeNormalizedFieldSpec = {
  index?: number;
  ref: string;
  fieldPath?: string;
  associationPathName?: string;
  renderer?: string;
  type?: string;
  target?: string | Record<string, unknown>;
  settings?: FlowSurfaceComposeObject;
  popup?: FlowSurfaceComposeObject;
};

export type FlowSurfaceComposeNormalizedActionSpec = {
  ref: string;
  type: string;
  settings?: FlowSurfaceComposeObject;
  popup?: FlowSurfaceComposeObject;
};

export type FlowSurfaceComposeNormalizedBlockSpec = {
  index?: number;
  ref: string;
  type?: string;
  catalogItem?: FlowSurfaceComposeObject | null;
  resource?: FlowSurfaceComposeNormalizedResource;
  template?: FlowSurfaceComposeObject;
  settings?: FlowSurfaceComposeObject;
  fields: FlowSurfaceComposeNormalizedFieldSpec[];
  actions: FlowSurfaceComposeNormalizedActionSpec[];
  recordActions: FlowSurfaceComposeNormalizedActionSpec[];
};

export type FlowSurfaceComposeBlockCreatePayload = {
  target: {
    uid: string;
  };
  type?: string;
  resource?: FlowSurfaceComposeObject;
  resourceInit?: FlowSurfaceComposeObject;
  template?: FlowSurfaceComposeObject;
};

export type FlowSurfaceCompiledComposeBlockTask = {
  ref: string;
  spec: FlowSurfaceComposeNormalizedBlockSpec;
  payload: FlowSurfaceComposeBlockCreatePayload;
};

export type FlowSurfaceCompiledComposeFieldTask = {
  blockRef: string;
  spec: FlowSurfaceComposeNormalizedFieldSpec;
  containerSource: 'block' | 'item';
  payload: FlowSurfaceComposeObject;
};

export type FlowSurfaceCompiledComposeActionTask = {
  blockRef: string;
  spec: FlowSurfaceComposeNormalizedActionSpec;
  payload: FlowSurfaceComposeObject;
};

export type FlowSurfaceCompiledComposeRecordActionTask = {
  blockRef: string;
  spec: FlowSurfaceComposeNormalizedActionSpec;
  payload: FlowSurfaceComposeObject;
};

export type FlowSurfaceComposeLayoutPlan =
  | {
      kind: 'none';
    }
  | {
      kind: 'explicit';
      layout?: FlowSurfaceComposeObject;
    }
  | {
      kind: 'append';
    };

export type FlowSurfaceCompiledComposePlan = {
  gridUid: string;
  mode: FlowSurfaceComposeMode;
  existingItemUids: string[];
  blocks: FlowSurfaceCompiledComposeBlockTask[];
  fields: FlowSurfaceCompiledComposeFieldTask[];
  actions: FlowSurfaceCompiledComposeActionTask[];
  recordActions: FlowSurfaceCompiledComposeRecordActionTask[];
  layoutPlan: FlowSurfaceComposeLayoutPlan;
};

const LIST_LIKE_COMPOSE_BLOCK_TYPES = new Set(['list', 'gridCard']);

export function compileComposeExecutionPlan(input: {
  gridUid: string;
  mode: FlowSurfaceComposeMode;
  normalizedBlocks: FlowSurfaceComposeNormalizedBlockSpec[];
  existingItemUids?: string[];
  layout?: FlowSurfaceComposeObject;
}): FlowSurfaceCompiledComposePlan {
  const blocks = compileComposeBlockTasks(input.gridUid, input.normalizedBlocks);
  const fields = compileComposeFieldTasks(input.normalizedBlocks);
  const actions = compileComposeActionTasks(input.normalizedBlocks);
  const recordActions = compileComposeRecordActionTasks(input.normalizedBlocks);

  return {
    gridUid: input.gridUid,
    mode: input.mode,
    existingItemUids: Array.from(new Set((input.existingItemUids || []).filter(Boolean))),
    blocks,
    fields,
    actions,
    recordActions,
    layoutPlan: buildComposeLayoutPlan({
      mode: input.mode,
      layout: input.layout,
      hasBlocks: blocks.length > 0,
    }),
  };
}

function compileComposeBlockTasks(
  gridUid: string,
  normalizedBlocks: FlowSurfaceComposeNormalizedBlockSpec[],
): FlowSurfaceCompiledComposeBlockTask[] {
  return normalizedBlocks.map((blockSpec) => ({
    ref: blockSpec.ref,
    spec: blockSpec,
    payload: buildComposeBlockCreatePayload(gridUid, blockSpec),
  }));
}

function compileComposeFieldTasks(
  normalizedBlocks: FlowSurfaceComposeNormalizedBlockSpec[],
): FlowSurfaceCompiledComposeFieldTask[] {
  return normalizedBlocks.flatMap((blockSpec) =>
    blockSpec.fields.map((fieldSpec) => ({
      blockRef: blockSpec.ref,
      spec: fieldSpec,
      containerSource: resolveComposeFieldContainerSource(blockSpec),
      payload: buildComposeFieldCreatePayload(fieldSpec),
    })),
  );
}

function compileComposeActionTasks(
  normalizedBlocks: FlowSurfaceComposeNormalizedBlockSpec[],
): FlowSurfaceCompiledComposeActionTask[] {
  return normalizedBlocks.flatMap((blockSpec) =>
    blockSpec.actions.map((actionSpec) => ({
      blockRef: blockSpec.ref,
      spec: actionSpec,
      payload: buildComposeActionCreatePayload(actionSpec),
    })),
  );
}

function compileComposeRecordActionTasks(
  normalizedBlocks: FlowSurfaceComposeNormalizedBlockSpec[],
): FlowSurfaceCompiledComposeRecordActionTask[] {
  return normalizedBlocks.flatMap((blockSpec) =>
    blockSpec.recordActions.map((actionSpec) => ({
      blockRef: blockSpec.ref,
      spec: actionSpec,
      payload: buildComposeRecordActionCreatePayload(actionSpec),
    })),
  );
}

export function resolveComposeFieldContainerSource(
  blockSpec: Pick<FlowSurfaceComposeNormalizedBlockSpec, 'type'>,
): 'block' | 'item' {
  return LIST_LIKE_COMPOSE_BLOCK_TYPES.has(blockSpec.type || '') ? 'item' : 'block';
}

export function resolveComposeTargetRef(
  targetRef: string,
  refRefs: Record<string, FlowSurfaceComposeTargetRef | undefined>,
  kind: 'field' | 'layout',
) {
  const ref = String(targetRef || '').trim();
  if (!ref) {
    throwBadRequest(`flowSurfaces compose ${kind} target reference cannot be empty`);
  }
  if (!refRefs[ref]?.uid) {
    throwBadRequest(`flowSurfaces compose ${kind} target '${ref}' was not created in the current compose call`);
  }
  return refRefs[ref]?.uid as string;
}

function buildComposeBlockCreatePayload(
  gridUid: string,
  blockSpec: FlowSurfaceComposeNormalizedBlockSpec,
): FlowSurfaceComposeBlockCreatePayload {
  return {
    target: {
      uid: gridUid,
    },
    ...(blockSpec.ref ? { ref: blockSpec.ref } : {}),
    ...(blockSpec.type ? { type: blockSpec.type } : {}),
    ...(blockSpec.resource?.kind === 'semantic' ? { resource: blockSpec.resource.value } : {}),
    ...(blockSpec.resource?.kind === 'raw' ? { resourceInit: blockSpec.resource.value } : {}),
    ...(blockSpec.template ? { template: blockSpec.template } : {}),
  };
}

function buildComposeFieldCreatePayload(fieldSpec: FlowSurfaceComposeNormalizedFieldSpec): FlowSurfaceComposeObject {
  return {
    ...(fieldSpec.ref ? { ref: fieldSpec.ref } : {}),
    ...(fieldSpec.fieldPath ? { fieldPath: fieldSpec.fieldPath } : {}),
    ...(fieldSpec.associationPathName ? { associationPathName: fieldSpec.associationPathName } : {}),
    ...(fieldSpec.renderer ? { renderer: fieldSpec.renderer } : {}),
    ...(fieldSpec.type ? { type: fieldSpec.type } : {}),
    ...(fieldSpec.popup ? { popup: fieldSpec.popup } : {}),
  };
}

function buildComposeActionCreatePayload(actionSpec: FlowSurfaceComposeNormalizedActionSpec): FlowSurfaceComposeObject {
  return {
    ...(actionSpec.ref ? { ref: actionSpec.ref } : {}),
    type: actionSpec.type,
  };
}

function buildComposeRecordActionCreatePayload(
  actionSpec: FlowSurfaceComposeNormalizedActionSpec,
): FlowSurfaceComposeObject {
  return {
    ...(actionSpec.ref ? { ref: actionSpec.ref } : {}),
    type: actionSpec.type,
  };
}

function buildComposeLayoutPlan(input: {
  mode: FlowSurfaceComposeMode;
  layout?: FlowSurfaceComposeObject;
  hasBlocks: boolean;
}): FlowSurfaceComposeLayoutPlan {
  if (input.layout?.rows || input.mode === 'replace') {
    return {
      kind: 'explicit',
      layout: input.layout,
    };
  }
  if (input.mode === 'append' && input.hasBlocks) {
    return {
      kind: 'append',
    };
  }
  return {
    kind: 'none',
  };
}
