/** Authoring nodes retain handler context types and branch structure until compilation. */

import type {
  NodeResultSchema,
  WorkflowNodeOptions,
} from '../server/instructions/types.js';

import type { NodeMeta } from './types.js';

declare const NODE_CONTEXT: unique symbol;
declare const NODE_RESULTS: unique symbol;

const NODE_DRAFT: unique symbol = Symbol('workflow.dsl.node');

/**
 * Which workflow has claimed this node.
 *
 * Mutable because a node exists before it is added: `attachNode()` fills the
 * identity in, and a second workflow claiming the same node is rejected there.
 */
export interface NodeOwnership {
  identity: object | null;
}

export interface NodeDraft {
  readonly meta: NodeMeta;
  readonly type: string;
  readonly config: Readonly<Record<string, unknown>>;
  readonly options?: WorkflowNodeOptions;
  readonly result?: NodeResultSchema;
  readonly branches?: Readonly<Record<string, readonly AnyWorkflowNode[]>>;
  /** Filled in by `addNode()`; `null` until a workflow claims the node. */
  readonly owner: NodeOwnership;
}

/** Any node, regardless of what it produces or requires. */
export interface AnyWorkflowNode {
  readonly [NODE_DRAFT]: NodeDraft;
  readonly key: string;
}

/**
 * A node added to, or ready to be added to, a workflow.
 *
 * `TOutput` is what the handler returns. It is not exposed as a bindable value:
 * a downstream handler reads it from `context.nodeResults[key]`, so the output
 * type reaches the rest of the workflow through `TResults` rather than through
 * an authoring handle the node would have to hand out.
 */
export interface WorkflowNode<
  TOutput = unknown,
  TContext = unknown,
  TKey extends string = string,
  TResults = Record<TKey, TOutput>,
> extends AnyWorkflowNode {
  readonly key: TKey;
  /** Type-only result map, including results produced inside branches. */
  readonly [NODE_RESULTS]?: TResults;
  /** Type-only context requirement; never serialized or installed at runtime. */
  readonly [NODE_CONTEXT]?: TContext;
}

export interface CreateNodeOptions {
  readonly options?: WorkflowNodeOptions;
  readonly result?: NodeResultSchema;
  readonly branches?: Readonly<Record<string, readonly AnyWorkflowNode[]>>;
}

export function createNode<
  TOutput,
  TContext = unknown,
  TKey extends string = string,
  TResults = Record<TKey, TOutput>,
>(
  type: string,
  meta: NodeMeta<TKey>,
  config: Readonly<Record<string, unknown>>,
  options: CreateNodeOptions = {},
): WorkflowNode<TOutput, TContext, TKey, TResults> {
  const draft: NodeDraft = {
    meta,
    type,
    config,
    owner: { identity: null },
    ...(options.options === undefined ? {} : { options: options.options }),
    ...(options.result === undefined ? {} : { result: options.result }),
    ...(options.branches === undefined ? {} : { branches: options.branches }),
  };
  return Object.freeze({ [NODE_DRAFT]: draft, key: meta.key });
}

export function isWorkflowNode(value: unknown): value is AnyWorkflowNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    NODE_DRAFT in (value as Record<PropertyKey, unknown>)
  );
}

export function nodeDraft(node: AnyWorkflowNode): NodeDraft {
  return node[NODE_DRAFT];
}

/**
 * Claim a node and everything nested in its branches for one workflow.
 *
 * Re-adding a node that already belongs to another workflow is rejected here
 * rather than at lowering time, where the message could only name the
 * reference that happened to be read first.
 *
 * `claimed` collects every node this call takes ownership of. The builder
 * compares that record against the nodes it actually compiles, which is how a
 * discarded `addNode()` result is caught at finalization instead of quietly
 * producing a workflow that is missing the node.
 */
export function attachNode(
  node: AnyWorkflowNode,
  identity: object,
  claimed?: Set<AnyWorkflowNode>,
): void {
  const draft = nodeDraft(node);
  if (draft.owner.identity !== null && draft.owner.identity !== identity) {
    throw new TypeError(
      `Workflow node "${draft.meta.key}" already belongs to another workflow`,
    );
  }
  draft.owner.identity = identity;
  claimed?.add(node);
  for (const branch of Object.values(draft.branches ?? {}))
    for (const child of branch) attachNode(child, identity, claimed);
}

/** Every node in a block, including the ones nested in its branches. */
export function collectNodes(
  nodes: readonly AnyWorkflowNode[],
  into: Set<AnyWorkflowNode> = new Set<AnyWorkflowNode>(),
): Set<AnyWorkflowNode> {
  for (const node of nodes) {
    into.add(node);
    for (const branch of Object.values(nodeDraft(node).branches ?? {}))
      collectNodes(branch, into);
  }
  return into;
}

/** Extract node contracts without inspecting the handler implementation. */
export type NodeHandlerContext<TNode> = TNode extends {
  readonly [NODE_CONTEXT]?: infer TContext;
}
  ? TContext
  : unknown;

export type NodeResults<TNode> = TNode extends {
  readonly [NODE_RESULTS]?: infer TResults;
}
  ? TResults
  : Record<never, never>;

/** Unknown JSON Schema surfaces remain unchecked; known surfaces must satisfy the handler. */
export type CompatibleHandlerContext<TContext, TInput, TParameters, TResults> =
  CompatibleSurface<TContext, 'input', TInput> &
    CompatibleSurface<TContext, 'parameters', TParameters> &
    CompatibleSurface<TContext, 'nodeResults', TResults>;

type CompatibleSurface<
  TContext,
  TKey extends string,
  TProvided,
> = unknown extends TProvided
  ? unknown
  : TContext extends Record<TKey, infer TRequired>
    ? [TProvided] extends [TRequired]
      ? unknown
      : { readonly incompatibleHandlerContext: TKey }
    : unknown;

/** Aggregate every nested branch result; availability is represented by optional context fields. */
export type BranchNodeResults<TBranches> = UnionToIntersection<
  NodeResults<BranchNodes<TBranches>>
>;

type BranchNodes<TBranches> =
  NonNullable<TBranches[keyof TBranches]> extends readonly (infer TNode)[]
    ? TNode
    : never;

type UnionToIntersection<T> = [T] extends [never]
  ? Record<never, never>
  : (T extends unknown ? (value: T) => void : never) extends (
        value: infer TResult,
      ) => void
    ? TResult
    : Record<never, never>;

/** All typed context requirements of a branch must be met by its workflow. */
export type BranchHandlerContext<TBranches> =
  BranchContextFunctions<
    NonNullable<TBranches[keyof TBranches]> extends readonly (infer TNode)[]
      ? TNode
      : never
  > extends (context: infer TContext) => void
    ? TContext
    : unknown;

type BranchContextFunctions<TNode> = TNode extends {
  readonly [NODE_CONTEXT]?: infer TContext;
}
  ? unknown extends TContext
    ? never
    : (context: TContext) => void
  : never;
