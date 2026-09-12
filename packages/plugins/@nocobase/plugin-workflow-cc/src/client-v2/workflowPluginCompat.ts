/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine, type SubModelItem } from '@nocobase/flow-engine';
import { PluginWorkflowClientV2, type TempAssociationSource } from '@nocobase/plugin-workflow/client-v2';
import { useMemo } from 'react';

export type WorkflowLike = {
  config?: Record<string, unknown>;
  id?: number | string;
  type?: string;
};

export type CanvasNodeLike = {
  config?: Record<string, unknown>;
  id?: number | string;
  key?: string;
  type?: string;
};

type WorkflowTriggerLike = {
  getCreateModelMenuItem?: (args: {
    config: Record<string, unknown>;
    nodeType?: string;
    workflow?: WorkflowLike;
  }) => SubModelItem | SubModelItem[] | null;
  useTempAssociationSource?: (
    config?: Record<string, unknown>,
    workflow?: WorkflowLike,
  ) => TempAssociationSource | null;
};

type WorkflowInstructionLike = {
  getCreateModelMenuItem?: (args: {
    node: CanvasNodeLike;
    workflow?: WorkflowLike;
  }) => SubModelItem | SubModelItem[] | null;
  useTempAssociationSource?: (node: CanvasNodeLike) => TempAssociationSource | null;
};

type RegistryLike<T> = {
  get?: (type?: string) => T | undefined;
};

type WorkflowPluginLike = {
  getInstruction?: (type?: string) => WorkflowInstructionLike | undefined;
  getTriggerOptions?: (type?: string) => WorkflowTriggerLike | undefined;
  instructions?: RegistryLike<WorkflowInstructionLike>;
  triggers?: RegistryLike<WorkflowTriggerLike>;
};

type PluginManagerLike = {
  get?: (key: unknown) => unknown;
};

type FlowEngineLike = {
  context?: {
    app?: {
      pm?: PluginManagerLike;
    };
  };
};

function getPlugin(pm: PluginManagerLike | undefined, key: unknown) {
  try {
    return pm?.get?.(key);
  } catch {
    return undefined;
  }
}

function getWorkflowPluginCandidates(flowEngine?: FlowEngineLike): WorkflowPluginLike[] {
  const pm = flowEngine?.context?.app?.pm;
  const candidates = [
    getPlugin(pm, 'workflow'),
    getPlugin(pm, '@nocobase/plugin-workflow'),
    getPlugin(pm, PluginWorkflowClientV2),
  ];
  return candidates.filter((item, index) => item && candidates.indexOf(item) === index) as WorkflowPluginLike[];
}

function getTrigger(plugin: WorkflowPluginLike, type?: string) {
  return plugin.getTriggerOptions?.(type) ?? plugin.triggers?.get?.(type);
}

function getInstruction(plugin: WorkflowPluginLike, type?: string) {
  return plugin.getInstruction?.(type) ?? plugin.instructions?.get?.(type);
}

function resolveTrigger(flowEngine: FlowEngineLike | undefined, type?: string) {
  for (const plugin of getWorkflowPluginCandidates(flowEngine)) {
    const trigger = getTrigger(plugin, type);
    if (trigger) {
      return trigger;
    }
  }
  return undefined;
}

function resolveInstruction(flowEngine: FlowEngineLike | undefined, type?: string) {
  for (const plugin of getWorkflowPluginCandidates(flowEngine)) {
    const instruction = getInstruction(plugin, type);
    if (instruction) {
      return instruction;
    }
  }
  return undefined;
}

export function useWorkflowPluginCompat() {
  const flowEngine = useFlowEngine() as FlowEngineLike | undefined;

  return useMemo(
    () => ({
      getInstruction: (type?: string) => resolveInstruction(flowEngine, type),
      getTrigger: (type?: string) => resolveTrigger(flowEngine, type),
    }),
    [flowEngine],
  );
}
