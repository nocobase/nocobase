import type { Static, TSchema } from '@sinclair/typebox';
import type { WorkflowHandlerContext } from '../shared/handler-context.js';
import type { JsonObject } from '../server/instructions/types.js';

import {
  compileToFlatIr,
  createNodeExpression,
  defineWorkflow,
  type WorkflowNodeExpressionClass,
} from './definition.js';
import type {
  AnyNodeExpression,
  BranchingNodeExpression,
  WorkflowClientSource,
  WorkflowFlatIr,
  WorkflowInputSchema,
  WorkflowOptions,
  WorkflowParametersSchemaInput,
  WorkflowSourceAst,
} from '../server/instructions/types.js';

import {
  attachNode,
  collectNodes,
  nodeDraft,
  type AnyWorkflowNode,
  type CompatibleHandlerContext,
  type NodeHandlerContext,
  type NodeResults,
} from './node.js';
import { toJsonSchema } from './schema.js';

export { defineHandler } from './handler.js';
export {
  createConditionInstruction,
  createRunInstruction,
  createTerminateInstruction,
  createWaitInstruction,
} from './instructions/index.js';
// Reference lowering is a standalone utility for hand-built `defineWorkflow()`
// definitions, not part of the builder: a node reads upstream values from its
// handler context, so no builder method takes a value to bind.
export {
  createReference,
  describeReference,
  inspectReference,
  isReference,
} from './expressions.js';
export { lowerBindingObject, lowerBindings } from './lowering.js';
export { createNode, isWorkflowNode, nodeDraft } from './node.js';
export { toJsonSchema } from './schema.js';
export type { WorkflowHandlerContext } from '../shared/handler-context.js';
export type { WorkflowHandlerFunction, DefinedHandler } from './handler.js';
export type {
  ConditionBranches,
  ConditionBuilder,
  ConditionNode,
  ConditionBranchMethods,
  RunBuilder,
} from './instructions/index.js';
export type { TerminateBuilder } from './instructions/terminate.js';
export type {
  Ref,
  ReferenceMetadata,
  ReferenceNamespace,
  ReferenceOwner,
  ReferenceSource,
  SurfaceRef,
  UntypedRef,
} from './expressions.js';
export type { LoweringScope } from './lowering.js';
export type {
  AnyWorkflowNode,
  CreateNodeOptions,
  NodeDraft,
  WorkflowNode,
} from './node.js';
export type { NodeMeta } from './types.js';

export interface WorkflowSurface<TSchemaValue> {
  readonly schema: TSchemaValue;
  /** Package-relative path to the client form that edits this surface. */
  readonly form?: string;
}

export interface WorkflowSource<
  TInputSchema extends TSchema | WorkflowInputSchema = WorkflowInputSchema,
  TParametersSchema extends TSchema | WorkflowParametersSchemaInput =
    WorkflowParametersSchemaInput,
> {
  /** The workflow package directory name; the stable business trigger key. */
  key: string;
  title: string;
  description?: string;
  options?: WorkflowOptions;
  input?: WorkflowSurface<TInputSchema>;
  parameters?: WorkflowSurface<TParametersSchema>;
  /** Shorthand for `input: { schema }` when there is no client form. */
  inputSchema?: WorkflowInputSchema;
}

declare const WORKFLOW_CONTEXT: unique symbol;

type NormalizedResult<T> = T extends void ? null : T;
type AvailableResults<TResults> = {
  readonly [K in keyof TResults]?: NormalizedResult<TResults[K]>;
};

/** Extract the complete workflow context; results may not have run yet. */
export type ContextOf<TFlow> = TFlow extends {
  readonly [WORKFLOW_CONTEXT]?: infer TContext;
}
  ? TContext
  : never;

/** An incompatible handler makes finalization uncallable without a type error. */
type FinalizeArguments<TContext, TInput, TParameters, TResults> =
  unknown extends CompatibleHandlerContext<
    TContext,
    TInput,
    TParameters,
    AvailableResults<TResults>
  >
    ? []
    : [
        error: CompatibleHandlerContext<
          TContext,
          TInput,
          TParameters,
          AvailableResults<TResults>
        >,
      ];

export interface WorkflowBuilder<
  TInput = unknown,
  TParameters = unknown,
  TResults = Record<never, never>,
  TContext = unknown,
> {
  readonly [WORKFLOW_CONTEXT]?: WorkflowHandlerContext<
    unknown extends TInput ? JsonObject : TInput,
    unknown extends TParameters
      ? WorkflowHandlerContext['parameters']
      : TParameters,
    AvailableResults<TResults>
  >;
  readonly key: string;
  /**
   * Append a node, returning the workflow that contains it.
   *
   * The builder is immutable, so the returned value *is* the workflow with that
   * node in it and this one keeps the node list it already had. Discarding the
   * result therefore drops the node instead of silently keeping it out of the
   * type that `finalize()` checks.
   */
  addNode<TNode extends AnyWorkflowNode>(
    node: TNode,
  ): WorkflowBuilder<
    TInput,
    TParameters,
    TResults & NodeResults<TNode>,
    TContext & NodeHandlerContext<TNode>
  >;
  finalize(
    ...errors: FinalizeArguments<TContext, TInput, TParameters, TResults>
  ): WorkflowSourceAst;
  compile(
    ...errors: FinalizeArguments<TContext, TInput, TParameters, TResults>
  ): WorkflowFlatIr;
}

function surfaceSchema(schema: object | undefined, fallback: object): object {
  if (schema === undefined) return fallback;
  return toJsonSchema(schema);
}

/**
 * Turn one node draft into a node expression, recursing into its branches.
 *
 * The expression metadata comes from the draft rather than from a table of
 * known instruction types, so a node built by an application's own factory
 * compiles exactly like a built-in one. A node's branch structure is decided
 * when the node is built, which is the only thing the expression needs; result
 * schemas are resolved from the registered Instruction classes at build time.
 */
function buildNode(node: AnyWorkflowNode): AnyNodeExpression {
  const draft = nodeDraft(node);
  const branches = draft.branches ?? {};
  const branchKeys = Object.keys(branches);
  const expression = createNodeExpression(
    {
      type: draft.type,
      branches: branchKeys.length ? branchKeys : null,
    } satisfies WorkflowNodeExpressionClass<Record<string, unknown>, string>,
    {
      key: draft.meta.key,
      ...(draft.meta.title === undefined ? {} : { title: draft.meta.title }),
      ...(draft.meta.description === undefined
        ? {}
        : { description: draft.meta.description }),
      config: draft.config,
      ...(draft.options === undefined ? {} : { options: draft.options }),
      ...(draft.result === undefined ? {} : { result: draft.result }),
    },
  );
  if (!branchKeys.length) return expression;
  const built: Record<string, readonly AnyNodeExpression[]> = {};
  for (const [branchKey, block] of Object.entries(branches))
    built[branchKey] = buildBlock(block);
  return (expression as BranchingNodeExpression<string>).branch(built);
}

function buildBlock(nodes: readonly AnyWorkflowNode[]): AnyNodeExpression[] {
  return nodes.map((node) => buildNode(node));
}

/**
 * Start a workflow definition.
 *
 * The returned builder owns the workflow's identity, which every node it claims
 * is tagged with, so a node cannot be shared with a second workflow. Each
 * `addNode()` returns a new builder over its own node list: the accumulated
 * handler contract and the nodes that will be compiled are then the same thing,
 * which is what keeps `finalize()` from checking a workflow nobody built.
 */
export function workflow<
  TInputSchema extends TSchema | WorkflowInputSchema = WorkflowInputSchema,
  TParametersSchema extends TSchema | WorkflowParametersSchemaInput =
    WorkflowParametersSchemaInput,
>(
  source: WorkflowSource<TInputSchema, TParametersSchema>,
): WorkflowBuilder<
  TInputSchema extends TSchema ? Static<TInputSchema> : unknown,
  TParametersSchema extends TSchema ? Static<TParametersSchema> : unknown
> {
  const identity = Object.freeze({ key: source.key });
  // Every node `addNode()` has taken ownership of, including branch children.
  const claimed = new Set<AnyWorkflowNode>();
  const inputSchema = surfaceSchema(
    source.input?.schema ?? source.inputSchema,
    {
      type: 'object',
    },
  ) as WorkflowInputSchema;
  const parameters =
    source.parameters === undefined
      ? undefined
      : (surfaceSchema(source.parameters.schema, {
          type: 'object',
        }) as WorkflowParametersSchemaInput);
  const client: WorkflowClientSource = {
    ...(source.input?.form ? { inputForm: source.input.form } : {}),
    ...(source.parameters?.form
      ? { parameterForm: source.parameters.form }
      : {}),
  };
  /**
   * Reject a definition that is missing a node the builder already claimed.
   *
   * `addNode()` returns the workflow containing the node, so calling it for its
   * side effect and finalizing the receiver silently drops that node — and with
   * it every context requirement `finalize()` would have checked. The claim
   * record is what makes that visible, because the types cannot: the discarded
   * builder is the only value that carries the node.
   */
  const assertNothingDiscarded = (nodes: readonly AnyWorkflowNode[]): void => {
    const built = collectNodes(nodes);
    const dropped = [...claimed].filter((node) => !built.has(node));
    if (!dropped.length) return;
    throw new TypeError(
      `Workflow "${source.key}" never compiled ${dropped
        .map((node) => `"${nodeDraft(node).meta.key}"`)
        .join(
          ', ',
        )}: addNode() returns the workflow containing the node, so keep the builder it returns`,
    );
  };
  const finalizeNodes = (
    nodes: readonly AnyWorkflowNode[],
  ): WorkflowSourceAst => {
    assertNothingDiscarded(nodes);
    return defineWorkflow({
      title: source.title,
      ...(source.description === undefined
        ? {}
        : { description: source.description }),
      inputSchema,
      ...(source.options === undefined ? {} : { options: source.options }),
      ...(parameters === undefined ? {} : { parameters }),
      ...(Object.keys(client).length ? { client } : {}),
      nodes: buildBlock(nodes),
    });
  };
  type Input = TInputSchema extends TSchema ? Static<TInputSchema> : unknown;
  type Parameters = TParametersSchema extends TSchema
    ? Static<TParametersSchema>
    : unknown;
  function view<TResults, TContext>(
    nodes: readonly AnyWorkflowNode[],
  ): WorkflowBuilder<Input, Parameters, TResults, TContext> {
    return {
      key: source.key,
      addNode<TNode extends AnyWorkflowNode>(
        node: TNode,
      ): WorkflowBuilder<
        Input,
        Parameters,
        TResults & NodeResults<TNode>,
        TContext & NodeHandlerContext<TNode>
      > {
        attachNode(node, identity, claimed);
        return view<
          TResults & NodeResults<TNode>,
          TContext & NodeHandlerContext<TNode>
        >([...nodes, node]);
      },
      finalize: (): WorkflowSourceAst => finalizeNodes(nodes),
      compile: (): WorkflowFlatIr => compileToFlatIr(finalizeNodes(nodes)),
    };
  }
  return view<Record<never, never>, unknown>([]);
}

export type { WorkflowSourceAst } from './definition.js';
