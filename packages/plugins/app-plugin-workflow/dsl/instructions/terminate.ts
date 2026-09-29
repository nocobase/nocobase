import type { TerminateOutcome } from '../../server/instructions/terminate/instruction.js';
import { createNode, type WorkflowNode } from '../node.js';
import type { NodeMeta } from '../types.js';

export interface TerminateBuilder<TKey extends string = string> {
  /** Ends the run. A terminate node produces no result to reference. */
  outcome(
    outcome?: TerminateOutcome,
  ): WorkflowNode<undefined, unknown, TKey, Record<never, never>>;
}

export function createTerminateInstruction<const TKey extends string>(
  meta: NodeMeta<TKey>,
): TerminateBuilder<TKey> {
  return {
    outcome: (
      outcome: TerminateOutcome = 'success',
    ): WorkflowNode<undefined, unknown, TKey, Record<never, never>> =>
      createNode<undefined, unknown, TKey, Record<never, never>>(
        'terminate',
        meta,
        { outcome },
      ),
  };
}
