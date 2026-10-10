export type {
  AnyNodeExpression,
  BaseNodeExpression,
  BranchingNodeExpression,
  ConfigIssue,
  WorkflowInputSchema,
  JSONSchema,
  JsonObject,
  NodeResultArraySchema,
  NodeResultAnyOfSchema,
  NodeResultBooleanSchema,
  NodeResultNullSchema,
  NodeResultNumberSchema,
  NodeResultSchema,
  NodeResultSchemaBase,
  NodeResultStringSchema,
  NodeResultObjectSchema,
  NodeResultUnionSchema,
  JsonPrimitive,
  JsonValue,
  NodeExpression,
  NodeSourceAst,
  WorkflowDefinition,
  WorkflowFlatIr,
  WorkflowFlatNode,
  WorkflowParameterDeclaration,
  WorkflowParameterOption,
  WorkflowParameterPropertySchema,
  WorkflowParameterSchema,
  WorkflowParametersObjectSchema,
  WorkflowParametersSchemaInput,
  WorkflowSourceAst,
  WorkflowClientSource,
  WorkflowSourceInput,
  WorkflowNodeOptions,
  WorkflowOptions,
  WorkflowNodeSourceInput,
} from '../server/instructions/types.js';

import { validateWorkflowOptions } from '../shared/options.js';

import { normalizeWorkflowParameterSchema } from '../shared/parameters.js';

import type {
  AnyNodeExpression,
  BaseNodeExpression,
  BranchingNodeExpression,
  JsonObject,
  NodeResultSchema,
  NodeExpression,
  NodeSourceAst,
  WorkflowFlatIr,
  WorkflowFlatNode,
  WorkflowSourceAst,
  WorkflowSourceInput,
  WorkflowNodeOptions,
  WorkflowNodeSourceInput,
} from '../server/instructions/types.js';

const EXPRESSION_BRANCHES: unique symbol = Symbol(
  'workflow.expression.branches',
);
type InternalExpression = AnyNodeExpression & {
  readonly [EXPRESSION_BRANCHES]?: Record<string, readonly AnyNodeExpression[]>;
};

export interface WorkflowNodeExpressionClass<
  TConfig,
  TBranch extends string = never,
> {
  readonly type: string;
  readonly branches:
    readonly TBranch[] | null | ((config: TConfig) => readonly string[]);
  readonly result?: NodeResultSchema | null;
}

export function createNodeExpression<TConfig, TBranch extends string = never>(
  instruction: WorkflowNodeExpressionClass<TConfig, TBranch>,
  source: WorkflowNodeSourceInput<TConfig>,
): NodeExpression<TBranch> {
  const base: BaseNodeExpression = Object.freeze({
    key: source.key,
    ...(source.title === undefined ? {} : { title: source.title }),
    ...(source.description === undefined
      ? {}
      : { description: source.description }),
    type: instruction.type,
    config: source.config,
    ...(source.options === undefined ? {} : { options: source.options }),
    ...(source.result === undefined ? {} : { result: source.result }),
  });
  if (instruction.branches === null) {
    return base as NodeExpression<TBranch>;
  }
  const branching: BranchingNodeExpression<TBranch> = {
    ...base,
    branch(
      branches: Partial<Record<TBranch, readonly AnyNodeExpression[]>>,
    ): NodeExpression<TBranch> {
      const next = {
        ...base,
        branch: branching.branch,
      } as BranchingNodeExpression<TBranch> & InternalExpression;
      Object.defineProperty(next, EXPRESSION_BRANCHES, { value: branches });
      return Object.freeze(next);
    },
  };
  return Object.freeze(branching);
}

function validateNodeOptions(
  options: WorkflowNodeOptions | undefined,
  location: string,
): void {
  if (options === undefined) return;
  for (const key of Object.keys(options)) {
    if (key !== 'timeout')
      throw new TypeError(`${location} does not accept field "${key}"`);
  }
  if (
    options.timeout !== undefined &&
    (!Number.isFinite(options.timeout) || options.timeout <= 0)
  ) {
    throw new TypeError(`${location}.timeout must be a finite positive number`);
  }
}

function toJsonObject(value: unknown, location: string): JsonObject {
  assertJsonCompatible(value, location);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${location} must be an object`);
  }
  return value as JsonObject;
}

function assertJsonCompatible(
  value: unknown,
  location: string,
  ancestors: Set<object> = new Set<object>(),
): void {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError(`${location} must contain only finite numbers`);
    return;
  }
  if (typeof value !== 'object')
    throw new TypeError(`${location} must be JSON-compatible`);
  if (ancestors.has(value))
    throw new TypeError(`${location} must not contain a circular reference`);
  if (!Array.isArray(value)) {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(
        `${location} must not contain class instances, Date, or Map values`,
      );
    }
  }
  ancestors.add(value);
  try {
    for (const [key, item] of Object.entries(value))
      assertJsonCompatible(item, `${location}.${key}`, ancestors);
  } finally {
    ancestors.delete(value);
  }
}

function unwrapNode(
  expression: AnyNodeExpression,
  astPath: string,
): NodeSourceAst {
  validateNodeOptions(expression.options, `${astPath}.options`);
  const internal = expression as InternalExpression;
  const branches = internal[EXPRESSION_BRANCHES];
  const normalizedBranches: Record<string, NodeSourceAst[]> = {};
  for (const branchKey of Object.keys(branches ?? {}).sort()) {
    const block = branches?.[branchKey] ?? [];
    if (block.length)
      normalizedBranches[branchKey] = block.map((node, index) =>
        unwrapNode(node, `${astPath}.branches.${branchKey}[${index}]`),
      );
  }
  return {
    key: expression.key,
    ...(expression.title === undefined ? {} : { title: expression.title }),
    ...(expression.description === undefined
      ? {}
      : { description: expression.description }),
    type: expression.type,
    config: toJsonObject(expression.config, `${astPath}.config`),
    ...(expression.options === undefined
      ? {}
      : { options: expression.options }),
    ...(expression.result === undefined ? {} : { result: expression.result }),
    ...(Object.keys(normalizedBranches).length
      ? { branches: normalizedBranches }
      : {}),
  };
}

export function defineWorkflow(source: WorkflowSourceInput): WorkflowSourceAst {
  const optionIssues = validateWorkflowOptions(source.options);
  if (optionIssues.length)
    throw new TypeError(
      optionIssues.map(({ path, message }) => `${path}: ${message}`).join('; '),
    );
  const ast: WorkflowSourceAst = {
    title: source.title,
    ...(source.description === undefined
      ? {}
      : { description: source.description }),
    ...(source.options === undefined ? {} : { options: source.options }),
    ...(source.parameters === undefined
      ? {}
      : { parameters: source.parameters }),
    ...(source.client === undefined ? {} : { client: source.client }),
    inputSchema: source.inputSchema ?? { type: 'object' },
    nodes: source.nodes.map((node, index) =>
      unwrapNode(node, `workflow.nodes[${index}]`),
    ),
  };
  assertJsonCompatible(ast, 'workflow');
  return ast;
}

export type NodeResultSchemaResolver = (
  node: NodeSourceAst,
) => NodeResultSchema | null;

export function compileToFlatIr(
  ast: WorkflowSourceAst,
  resolveResult: NodeResultSchemaResolver = (
    node: NodeSourceAst,
  ): NodeResultSchema | null => node.result ?? null,
): WorkflowFlatIr {
  assertJsonCompatible(ast, 'workflow');
  const keys = new Set<string>();
  const collect = (block: readonly NodeSourceAst[]): void => {
    for (const node of block) {
      if (!node.key)
        throw new Error('Workflow node keys must be non-empty strings');
      if (keys.has(node.key))
        throw new Error(`Duplicate workflow node key "${node.key}"`);
      keys.add(node.key);
      for (const branch of Object.values(node.branches ?? {})) collect(branch);
    }
  };
  collect(ast.nodes);

  const nodes: WorkflowFlatNode[] = [];
  const compileBlock = (
    block: readonly NodeSourceAst[],
    ownerKey: string | null,
    branchKey: string | null,
  ): void => {
    block.forEach((node, index) => {
      const result = resolveResult(node);
      nodes.push({
        key: node.key,
        ...(node.title === undefined ? {} : { title: node.title }),
        ...(node.description === undefined
          ? {}
          : { description: node.description }),
        type: node.type,
        config: node.config,
        ...(node.options === undefined ? {} : { options: node.options }),
        ...(result === null ? {} : { result }),
        upstreamKey: index === 0 ? ownerKey : block[index - 1].key,
        downstreamKey: index + 1 < block.length ? block[index + 1].key : null,
        branchKey: index === 0 ? branchKey : null,
      });
      for (const childBranchKey of Object.keys(node.branches ?? {}).sort()) {
        compileBlock(
          node.branches?.[childBranchKey] ?? [],
          node.key,
          childBranchKey,
        );
      }
    });
  };
  compileBlock(ast.nodes, null, null);
  return {
    title: ast.title,
    ...(ast.description === undefined ? {} : { description: ast.description }),
    ...(ast.options === undefined ? {} : { options: ast.options }),
    // Authoring accepts the JSON Schema object form; everything downstream —
    // the parameter editor, the value resolver, the materializer — reads the
    // flat declaration map, so this is where the two forms meet.
    ...(ast.parameters === undefined
      ? {}
      : {
          parameters: {
            ...normalizeWorkflowParameterSchema(
              ast.parameters,
              'workflow.parameters',
            ),
          },
        }),
    ...(ast.client === undefined ? {} : { client: ast.client }),
    inputSchema: ast.inputSchema,
    start: ast.nodes[0]?.key ?? null,
    nodes,
  };
}

export function restoreFromFlatIr(ir: WorkflowFlatIr): WorkflowSourceAst {
  const byKey = new Map<string, WorkflowFlatNode>(
    ir.nodes.map((node) => [node.key, node]),
  );
  if (byKey.size !== ir.nodes.length)
    throw new Error('Flat IR contains duplicate node keys');
  const children = new Map<string, WorkflowFlatNode[]>();
  for (const node of ir.nodes) {
    if (node.upstreamKey !== null && node.branchKey !== null) {
      const key = `${node.upstreamKey}\u0000${node.branchKey}`;
      children.set(key, [...(children.get(key) ?? []), node]);
    }
  }
  const buildBlock = (startKey: string | null): NodeSourceAst[] => {
    const result: NodeSourceAst[] = [];
    const seen = new Set<string>();
    let key = startKey;
    while (key !== null) {
      if (seen.has(key))
        throw new Error(`Flat IR contains a cycle at node "${key}"`);
      seen.add(key);
      const node = byKey.get(key);
      if (!node) throw new Error(`Flat IR references missing node "${key}"`);
      const branches: Record<string, NodeSourceAst[]> = {};
      for (const childKey of [...children.keys()]
        .filter((candidate) => candidate.startsWith(`${key}\u0000`))
        .sort()) {
        const branchKey = childKey.slice(key.length + 1);
        const roots = children.get(childKey) ?? [];
        if (roots.length !== 1)
          throw new Error(
            `Flat IR branch "${key}.${branchKey}" must have exactly one head`,
          );
        branches[branchKey] = buildBlock(roots[0].key);
      }
      result.push({
        key: node.key,
        ...(node.title === undefined ? {} : { title: node.title }),
        ...(node.description === undefined
          ? {}
          : { description: node.description }),
        type: node.type,
        config: node.config,
        ...(node.options === undefined ? {} : { options: node.options }),
        ...(node.result === undefined ? {} : { result: node.result }),
        ...(Object.keys(branches).length ? { branches } : {}),
      });
      key = node.downstreamKey;
    }
    return result;
  };
  return {
    title: ir.title,
    ...(ir.description === undefined ? {} : { description: ir.description }),
    ...(ir.options === undefined ? {} : { options: ir.options }),
    ...(ir.parameters === undefined ? {} : { parameters: ir.parameters }),
    ...(ir.client === undefined ? {} : { client: ir.client }),
    inputSchema: ir.inputSchema,
    nodes: buildBlock(ir.start),
  };
}
