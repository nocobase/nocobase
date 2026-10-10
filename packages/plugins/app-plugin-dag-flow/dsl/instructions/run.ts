import {
  handlerModule,
  type HandlerContext,
  type WorkflowHandlerFunction,
  type DefinedHandler,
} from '../handler.js';
import { createNode, type WorkflowNode } from '../node.js';
import type { NodeMeta } from '../types.js';

export interface RunBuilder<TKey extends string = string> {
  /** The handler reads the workflow context; its signature determines the node's types. */
  run<T extends WorkflowHandlerFunction<never>>(
    handler: DefinedHandler<T>,
  ): WorkflowNode<Awaited<ReturnType<T>>, HandlerContext<T>, TKey>;
}

export function createRunInstruction<const TKey extends string>(
  meta: NodeMeta<TKey>,
): RunBuilder<TKey> {
  return {
    run<T extends WorkflowHandlerFunction<never>>(
      handler: DefinedHandler<T>,
    ): WorkflowNode<Awaited<ReturnType<T>>, HandlerContext<T>, TKey> {
      return createNode<Awaited<ReturnType<T>>, HandlerContext<T>, TKey>(
        'run',
        meta,
        { module: handlerModule(handler) },
      );
    },
  };
}
