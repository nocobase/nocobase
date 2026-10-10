import type { NodeResultSchema } from '../../server/instructions/types.js';
import type { WaitConfig } from '../../server/instructions/wait/instruction.js';
import { createNode, type WorkflowNode } from '../node.js';
import type { NodeMeta } from '../types.js';

/** The application owns the result shape and the stable key used by its resumer. */
export function createWaitInstruction<
  TOutput = unknown,
  const TKey extends string = string,
>(
  meta: NodeMeta<TKey>,
  result: NodeResultSchema,
  config: WaitConfig = {},
): WorkflowNode<TOutput, unknown, TKey> {
  return createNode<TOutput, unknown, TKey>('wait', meta, config, { result });
}
