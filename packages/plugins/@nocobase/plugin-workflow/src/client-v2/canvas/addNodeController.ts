/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';
import { resolveLegacyPresetRenderMode } from './nodeRenderDispatch';
import type { Instruction } from './Instruction';
import type { SharedAddNodeAnchor } from './AddNodeContext.shared';

export type AddNodeControllerRuntime = {
  workflow: any;
  nodes: any[];
  getInstruction: (type: string) => Instruction | undefined;
  getInstructionAvailable?: (instruction: Instruction, context: Record<string, any>) => string | null;
  translateTitle: (title: string) => string;
  api: any;
  refresh?: () => void;
};

export type AddNodeDraft = {
  key: string;
  type: string;
  upstreamId: any;
  branchIndex: number | null | undefined;
  title: string;
  config: Record<string, any>;
};

export type AddNodeDecision =
  | { kind: 'missing'; type: string }
  | { kind: 'blocked'; message: string; instruction: Instruction }
  | { kind: 'legacy-preset'; instruction: Instruction; draft: AddNodeDraft }
  | { kind: 'modern-preset'; instruction: Instruction; anchor: SharedAddNodeAnchor; hasDownstream: boolean }
  | { kind: 'branch-fallback'; instruction: Instruction; draft: AddNodeDraft }
  | { kind: 'direct'; instruction: Instruction; draft: AddNodeDraft };

export function findDownstream(nodes: any[] = [], upstream?: any, branchIndex?: number | null) {
  const upstreamId = upstream?.id ?? null;
  return upstream?.id
    ? nodes.find((item) => item.upstreamId === upstreamId && item.branchIndex === branchIndex)
    : nodes.find((item) => item.upstreamId == null);
}

export function createNodeDraft({
  instruction,
  anchor,
  translateTitle,
}: {
  instruction: Instruction;
  anchor: SharedAddNodeAnchor;
  translateTitle: (title: string) => string;
}): AddNodeDraft {
  return {
    key: uid(),
    type: instruction.type,
    upstreamId: anchor.upstream?.id ?? null,
    branchIndex: anchor.branchIndex ?? null,
    title: translateTitle(instruction.title as string),
    config: instruction.createDefaultConfig?.() ?? {},
  };
}

export function resolveAddNodeDecision({
  type,
  anchor,
  runtime,
}: {
  type: string;
  anchor: SharedAddNodeAnchor;
  runtime: Pick<
    AddNodeControllerRuntime,
    'workflow' | 'nodes' | 'getInstruction' | 'getInstructionAvailable' | 'translateTitle'
  >;
}): AddNodeDecision {
  const instruction = runtime.getInstruction(type);
  if (!instruction) {
    return { kind: 'missing', type };
  }

  const unavailableMessage = runtime.getInstructionAvailable?.(instruction, {
    engine: null,
    workflow: runtime.workflow,
    upstream: anchor.upstream,
    branchIndex: anchor.branchIndex ?? null,
    branchContext: anchor.branchContext ?? null,
  });

  if (unavailableMessage) {
    return { kind: 'blocked', message: unavailableMessage, instruction };
  }

  const draft = createNodeDraft({
    instruction,
    anchor,
    translateTitle: runtime.translateTitle,
  });
  const downstream = findDownstream(runtime.nodes, anchor.upstream, anchor.branchIndex ?? null);
  const presetMode = resolveLegacyPresetRenderMode(instruction);

  if (presetMode === 'legacy-fieldset') {
    return { kind: 'legacy-preset', instruction, draft };
  }

  if (presetMode === 'modern-loader') {
    return {
      kind: 'modern-preset',
      instruction,
      anchor: { upstream: anchor.upstream, branchIndex: anchor.branchIndex ?? null },
      hasDownstream: Boolean(downstream),
    };
  }

  if (
    (typeof instruction.branching === 'function' ? instruction.branching(draft.config) : instruction.branching) &&
    downstream
  ) {
    return { kind: 'branch-fallback', instruction, draft };
  }

  return { kind: 'direct', instruction, draft };
}

export async function createNodeAndMaybeReparent({
  workflowId,
  api,
  refresh,
  values,
  downstreamBranchIndex,
}: {
  workflowId: any;
  api: any;
  refresh?: () => void;
  values: Record<string, any>;
  downstreamBranchIndex?: number | null;
}) {
  const {
    data: { data: newNode },
  } = await api.resource('workflows.nodes', workflowId).create({ values });
  if (typeof downstreamBranchIndex === 'number' && newNode?.downstreamId) {
    await api.resource('flow_nodes').update({
      filterByTk: newNode.downstreamId,
      values: {
        branchIndex: downstreamBranchIndex,
        upstream: { id: newNode.id, downstreamId: null },
      },
      updateAssociationValues: ['upstream'],
    });
  }
  refresh?.();
  return newNode;
}
