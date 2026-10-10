import type { ConditionBranchKey } from '../../server/instructions/condition/instruction.js';
import {
  handlerModule,
  type HandlerContext,
  type WorkflowHandlerFunction,
  type DefinedHandler,
} from '../handler.js';
import {
  createNode,
  isWorkflowNode,
  type AnyWorkflowNode,
  type BranchHandlerContext,
  type BranchNodeResults,
  type WorkflowNode,
} from '../node.js';
import type { NodeMeta } from '../types.js';

export type ConditionBranches = Partial<
  Record<ConditionBranchKey, readonly AnyWorkflowNode[]>
>;

export interface ConditionBranchMethods<
  TContext = unknown,
  TKey extends string = string,
  TResults = Record<never, never>,
> {
  branch<TBranches extends ConditionBranches>(
    branches: TBranches,
  ): ConditionNode<
    TContext & BranchHandlerContext<TBranches>,
    TKey,
    TResults & BranchNodeResults<TBranches>
  >;
  yes<TNodes extends readonly AnyWorkflowNode[]>(
    nodes: TNodes,
  ): ConditionNode<
    TContext & BranchHandlerContext<{ yes: TNodes }>,
    TKey,
    TResults & BranchNodeResults<{ yes: TNodes }>
  >;
  no<TNodes extends readonly AnyWorkflowNode[]>(
    nodes: TNodes,
  ): ConditionNode<
    TContext & BranchHandlerContext<{ no: TNodes }>,
    TKey,
    TResults & BranchNodeResults<{ no: TNodes }>
  >;
}

export interface ConditionNode<
  TContext = unknown,
  TKey extends string = string,
  TResults = Record<never, never>,
>
  extends
    WorkflowNode<boolean, TContext, TKey, Record<TKey, boolean> & TResults>,
    ConditionBranchMethods<TContext, TKey, TResults> {}

export interface ConditionBuilder<
  TContext = unknown,
  TKey extends string = string,
> extends ConditionBranchMethods<TContext, TKey> {
  /** The handler receives the workflow context and must return a boolean. */
  check<T extends WorkflowHandlerFunction<never, boolean | Promise<boolean>>>(
    handler: DefinedHandler<T>,
  ): ConditionNode<HandlerContext<T>, TKey>;
}

function branchMethods<TContext, TKey extends string, TResults>(
  meta: NodeMeta<TKey>,
  module: string | undefined,
  branches: Readonly<Record<string, readonly AnyWorkflowNode[]>>,
): ConditionBranchMethods<TContext, TKey, TResults> {
  function branch<TBranches extends ConditionBranches>(
    additions: TBranches,
  ): ConditionNode<
    TContext & BranchHandlerContext<TBranches>,
    TKey,
    TResults & BranchNodeResults<TBranches>
  > {
    if (!module) throw new TypeError('Condition check module is required');
    const next = { ...branches };
    for (const [key, block] of Object.entries(additions)) {
      if (Object.hasOwn(next, key))
        throw new TypeError(`Condition branch "${key}" is already declared`);
      // Keep empty declarations so a later call cannot silently replace them.
      if (block) next[key] = [...block];
    }
    return conditionNode<
      TContext & BranchHandlerContext<TBranches>,
      TKey,
      TResults & BranchNodeResults<TBranches>
    >(meta, module, next);
  }

  function validateBlock(nodes: readonly AnyWorkflowNode[]): void {
    if (!Array.isArray(nodes) || !Array.from(nodes).every(isWorkflowNode))
      throw new TypeError(
        'Condition branch must be an array of workflow nodes',
      );
  }

  return {
    branch,
    yes(nodes) {
      validateBlock(nodes);
      return branch({ yes: nodes });
    },
    no(nodes) {
      validateBlock(nodes);
      return branch({ no: nodes });
    },
  };
}

function conditionNode<
  TContext,
  TKey extends string,
  TResults = Record<never, never>,
>(
  meta: NodeMeta<TKey>,
  module: string,
  branches: Readonly<Record<string, readonly AnyWorkflowNode[]>>,
): ConditionNode<TContext, TKey, TResults> {
  const declared = Object.fromEntries(
    Object.entries(branches).filter(([, block]) => block.length),
  );
  return Object.freeze({
    ...createNode<boolean, TContext, TKey, Record<TKey, boolean> & TResults>(
      'condition',
      meta,
      { module },
      { branches: declared },
    ),
    ...branchMethods<TContext, TKey, TResults>(meta, module, branches),
  });
}

export function createConditionInstruction<const TKey extends string>(
  meta: NodeMeta<TKey>,
): ConditionBuilder<unknown, TKey> {
  return {
    ...branchMethods(meta, undefined, {}),
    check(handler) {
      return conditionNode(meta, handlerModule(handler), {});
    },
  };
}
