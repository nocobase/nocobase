/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Runtime-neutral resolution of the workflow client plugin and its node
 * instructions, shared by both canvases (ADR-0003).
 *
 * The canvas node card must look up `instructions.get(type)` to know how to
 * render. Resolving the plugin by its concrete class (`pm.get(PluginWorkflowClientV2)`)
 * only hits the v2 runtime; the legacy canvas registers the v1 `PluginWorkflowClient`
 * instead. Both register under the neutral `'workflow'` package alias and expose
 * the same `instructions` registry, so `pm.get('workflow')` feeds the shared
 * `Node` card in either runtime — the same trick the variable aggregator already
 * uses. Kept structural (not a concrete plugin class) so client-v2 never imports
 * the v1 client and the back-imported card stays runtime-agnostic.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import type { Instruction } from './Instruction';

/** The slice of the workflow client plugin the canvas card needs — the
 *  `instructions` registry shared by v1 `PluginWorkflowClient` and v2
 *  `PluginWorkflowClientV2`. */
export type WorkflowInstructionPlugin = {
  instructions: { get(type: string): Instruction | undefined };
};

/** Resolve the current runtime's workflow client plugin via the neutral
 *  `'workflow'` alias — v1's or v2's, whichever this runtime loaded. */
export function useWorkflowPlugin(): WorkflowInstructionPlugin | undefined {
  const flowEngine = useFlowEngine();
  return flowEngine.context.app.pm.get('workflow') as WorkflowInstructionPlugin | undefined;
}

/** Resolve a node type's instruction in a runtime-neutral way. Uses the shared
 *  `instructions` registry (present on both plugins), not v2-only `getInstruction`. */
export function useInstruction(type?: string): Instruction | undefined {
  const plugin = useWorkflowPlugin();
  return type ? plugin?.instructions.get(type) : undefined;
}
