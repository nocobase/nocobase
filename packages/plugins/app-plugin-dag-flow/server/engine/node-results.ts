import type {
  JsonValue,
  NodeResultSchema,
  NodeSourceAst,
  WorkflowFlatIr,
  WorkflowSourceAst,
} from '../instructions/types.js';
import type { WorkflowInstructionClass } from './types.js';

export interface WorkflowNodeSourceContract {
  readonly type: string;
  readonly branches:
    readonly string[] | null | ((config: never) => readonly string[]);
  readonly result?: NodeResultSchema | null;
  readonly validateConfig: (
    config: unknown,
  ) => readonly { path: string; message: string }[];
}

export interface WorkflowSourceContracts {
  nodes: ReadonlyMap<string, WorkflowNodeSourceContract>;
}

export interface WorkflowSourceRuntimeContracts {
  instructions: Map<string, WorkflowInstructionClass>;
}

export type NodeResultScope = ReadonlyMap<string, NodeResultSchema>;

export interface NodeResultBinding {
  readonly nodeKey: string;
  readonly path: `$nodeResults.${string}`;
  readonly title?: string;
  readonly description?: string;
  readonly schema: NodeResultSchema;
}

export interface WorkflowNodeInsertionPoint {
  readonly parentNodeKey: string | null;
  readonly branchKey: string | null;
  readonly index: number;
}

export interface NodeResultSchemaIssue {
  readonly path: string;
  readonly message: string;
}

export interface NodeResultReferenceIssue {
  readonly code:
    | 'NODE_RESULT_NOT_VISIBLE'
    | 'INVALID_NODE_RESULT_PATH'
    | 'INVALID_NODE_RESULT_ACCESS';
  readonly message: string;
}

type WorkflowContracts =
  WorkflowSourceContracts | WorkflowSourceRuntimeContracts;

function contractFor(
  node: NodeSourceAst,
  contracts: WorkflowContracts,
): WorkflowNodeSourceContract | undefined {
  return 'instructions' in contracts
    ? contracts.instructions.get(node.type)
    : contracts.nodes.get(node.type);
}

export function resolveNodeResultSchema(
  node: NodeSourceAst,
  contract?: WorkflowNodeSourceContract,
): NodeResultSchema | null {
  if (node.result !== undefined) return node.result;
  return contract?.result ?? null;
}

export function createNodeResultSchemaResolver(
  contracts: WorkflowContracts,
): (node: NodeSourceAst) => NodeResultSchema | null {
  return (node: NodeSourceAst): NodeResultSchema | null =>
    resolveNodeResultSchema(node, contractFor(node, contracts));
}

export function validateWorkflowFlatIrTopology(ir: WorkflowFlatIr): void {
  const byKey = new Map(ir.nodes.map((node) => [node.key, node]));
  if (byKey.size !== ir.nodes.length)
    throw new Error('Flat IR contains duplicate node keys');
  if (ir.nodes.length === 0) {
    if (ir.start !== null)
      throw new Error('Flat IR start must be null when there are no nodes');
    return;
  }
  if (ir.start === null || !byKey.has(ir.start))
    throw new Error('Flat IR start must reference an existing node');
  const incoming = new Map<string, string>();
  const adjacency = new Map<string, string[]>();
  for (const node of ir.nodes) adjacency.set(node.key, []);
  for (const node of ir.nodes) {
    if (node.downstreamKey !== null) {
      if (node.downstreamKey === node.key)
        throw new Error(`Node "${node.key}" cannot reference itself`);
      if (!byKey.has(node.downstreamKey))
        throw new Error(
          `Node "${node.key}" references missing node "${node.downstreamKey}"`,
        );
      if (incoming.has(node.downstreamKey))
        throw new Error(
          `Node "${node.downstreamKey}" has multiple upstream owners`,
        );
      incoming.set(node.downstreamKey, node.key);
      adjacency.get(node.key)?.push(node.downstreamKey);
    }
    if (node.branchKey !== null) {
      if (node.upstreamKey === null || !byKey.has(node.upstreamKey))
        throw new Error(`Node "${node.key}" has no upstream owner`);
      if (incoming.has(node.key))
        throw new Error(`Node "${node.key}" has multiple upstream owners`);
      incoming.set(node.key, node.upstreamKey);
      adjacency.get(node.upstreamKey)?.push(node.key);
    }
  }
  const start = byKey.get(ir.start);
  if (start?.upstreamKey !== null || incoming.has(ir.start))
    throw new Error(`Start node "${ir.start}" cannot have an upstream owner`);
  for (const node of ir.nodes) {
    if (node.key !== ir.start && !incoming.has(node.key))
      throw new Error(`Node "${node.key}" has no upstream owner`);
    if (node.key !== ir.start && incoming.get(node.key) !== node.upstreamKey)
      throw new Error(`Node "${node.key}" has inconsistent upstream owner`);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): void => {
    if (visiting.has(key))
      throw new Error(`Flat IR topology contains a cycle at node "${key}"`);
    if (visited.has(key)) return;
    visiting.add(key);
    for (const target of adjacency.get(key) ?? []) visit(target);
    visiting.delete(key);
    visited.add(key);
  };
  visit(ir.start);
  if (visited.size !== ir.nodes.length)
    throw new Error(
      'Flat IR contains nodes that are not reachable from its start',
    );
}

function isJsonValue(
  value: unknown,
  ancestors: Set<object> = new Set<object>(),
): value is JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || ancestors.has(value)) return false;
  ancestors.add(value);
  const valid = Array.isArray(value)
    ? value.every((item) => isJsonValue(item, ancestors))
    : Object.getPrototypeOf(value) === Object.prototype &&
      Object.values(value).every((item) => isJsonValue(item, ancestors));
  ancestors.delete(value);
  return valid;
}

export function validateNodeResultSchema(
  schema: unknown,
): readonly NodeResultSchemaIssue[] {
  const issues: NodeResultSchemaIssue[] = [];
  const visit = (
    value: unknown,
    path: string,
    ancestors: Set<object>,
  ): void => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      issues.push({ path, message: 'Node result schema must be an object' });
      return;
    }
    if (ancestors.has(value)) {
      issues.push({
        path,
        message: 'Node result schema must not contain a circular reference',
      });
      return;
    }
    ancestors.add(value);
    const record = value as Record<string, unknown>;
    const common = new Set(['title', 'description', 'examples', 'const']);
    if (record.title !== undefined && typeof record.title !== 'string')
      issues.push({ path: `${path}.title`, message: 'title must be a string' });
    if (
      record.description !== undefined &&
      typeof record.description !== 'string'
    )
      issues.push({
        path: `${path}.description`,
        message: 'description must be a string',
      });
    if (
      record.examples !== undefined &&
      (!Array.isArray(record.examples) ||
        !record.examples.every((item) => isJsonValue(item)))
    ) {
      issues.push({
        path: `${path}.examples`,
        message: 'examples must contain only JSON values',
      });
    }
    if (
      Object.hasOwn(record, 'const') &&
      record.const !== null &&
      typeof record.const !== 'string' &&
      typeof record.const !== 'number' &&
      typeof record.const !== 'boolean'
    )
      issues.push({
        path: `${path}.const`,
        message: 'const must be a JSON primitive',
      });
    const unionKey = Object.hasOwn(record, 'oneOf')
      ? 'oneOf'
      : Object.hasOwn(record, 'anyOf')
        ? 'anyOf'
        : null;
    if (unionKey !== null) {
      common.add(unionKey);
      const branches = record[unionKey];
      if (!Array.isArray(branches) || branches.length === 0)
        issues.push({
          path: `${path}.${unionKey}`,
          message: `${unionKey} must be a non-empty array`,
        });
      else
        branches.forEach((item, index) =>
          visit(item, `${path}.${unionKey}[${index}]`, ancestors),
        );
      if (record.type !== undefined)
        issues.push({
          path: `${path}.type`,
          message: `A ${unionKey} schema must not also declare type`,
        });
    } else {
      common.add('type');
      const type = record.type;
      if (
        Object.hasOwn(record, 'const') &&
        ['null', 'boolean', 'number', 'integer', 'string'].includes(
          String(type),
        ) &&
        !(
          (type === 'null' && record.const === null) ||
          (type === 'integer' && Number.isInteger(record.const)) ||
          (type === 'number' && typeof record.const === 'number') ||
          (type === 'boolean' && typeof record.const === 'boolean') ||
          (type === 'string' && typeof record.const === 'string')
        )
      )
        issues.push({
          path: `${path}.const`,
          message: 'const must match the declared type',
        });
      if (
        ![
          'null',
          'boolean',
          'number',
          'integer',
          'string',
          'array',
          'object',
        ].includes(String(type))
      ) {
        issues.push({
          path: `${path}.type`,
          message: 'type must be a supported node result type',
        });
      } else if (type === 'number' || type === 'integer') {
        common.add('enum');
        if (
          record.enum !== undefined &&
          (!Array.isArray(record.enum) ||
            !record.enum.every(
              (item) =>
                typeof item === 'number' &&
                Number.isFinite(item) &&
                (type !== 'integer' || Number.isInteger(item)),
            ))
        ) {
          issues.push({
            path: `${path}.enum`,
            message: `enum must contain only ${type} values`,
          });
        }
      } else if (type === 'string') {
        common.add('enum');
        if (
          record.enum !== undefined &&
          (!Array.isArray(record.enum) ||
            !record.enum.every((item) => typeof item === 'string'))
        )
          issues.push({
            path: `${path}.enum`,
            message: 'enum must contain only string values',
          });
      } else if (type === 'array') {
        common.add('items');
        if (!Object.hasOwn(record, 'items'))
          issues.push({
            path: `${path}.items`,
            message: 'Array result schema requires items',
          });
        else visit(record.items, `${path}.items`, ancestors);
      } else if (type === 'object') {
        common.add('properties');
        common.add('required');
        common.add('additionalProperties');
        if (
          record.properties === null ||
          typeof record.properties !== 'object' ||
          Array.isArray(record.properties)
        )
          issues.push({
            path: `${path}.properties`,
            message: 'Object result schema requires a properties object',
          });
        else
          for (const [key, item] of Object.entries(record.properties))
            visit(item, `${path}.properties.${key}`, ancestors);
        if (record.required !== undefined) {
          if (
            !Array.isArray(record.required) ||
            !record.required.every((item) => typeof item === 'string')
          )
            issues.push({
              path: `${path}.required`,
              message: 'required must contain only property names',
            });
          else {
            if (new Set(record.required).size !== record.required.length)
              issues.push({
                path: `${path}.required`,
                message: 'required must not contain duplicates',
              });
            for (const key of record.required)
              if (!Object.hasOwn((record.properties as object) ?? {}, key))
                issues.push({
                  path: `${path}.required`,
                  message: `Required property "${key}" is not declared`,
                });
          }
        }
        if (
          record.additionalProperties !== undefined &&
          typeof record.additionalProperties !== 'boolean'
        )
          visit(
            record.additionalProperties,
            `${path}.additionalProperties`,
            ancestors,
          );
      }
    }
    for (const key of Object.keys(record))
      if (!common.has(key))
        issues.push({
          path: `${path}.${key}`,
          message: `Unsupported node result schema field "${key}"`,
        });
    ancestors.delete(value);
  };
  visit(schema, 'result', new Set<object>());
  return issues;
}

function validatePath(
  schema: NodeResultSchema,
  segments: readonly string[],
  fullPath: string,
): NodeResultReferenceIssue | null {
  if (segments.length === 0) return null;
  if ('oneOf' in schema || 'anyOf' in schema) {
    const unionKey = 'oneOf' in schema ? 'oneOf' : 'anyOf';
    const options = 'oneOf' in schema ? schema.oneOf : schema.anyOf;
    for (const option of options) {
      const issue = validatePath(option, segments, fullPath);
      if (issue)
        return {
          ...issue,
          message: `${issue.message} (the path must be valid in every ${unionKey} branch)`,
        };
    }
    return null;
  }
  const [segment, ...rest] = segments;
  if (schema.type === 'array') {
    if (!/^(0|[1-9][0-9]*)$/.test(segment))
      return {
        code: 'INVALID_NODE_RESULT_ACCESS',
        message: `Array result in "${fullPath}" requires a numeric index, received "${segment}"`,
      };
    return validatePath(schema.items, rest, fullPath);
  }
  if (schema.type !== 'object')
    return {
      code: 'INVALID_NODE_RESULT_ACCESS',
      message: `Cannot access property "${segment}" on ${schema.type} result in "${fullPath}"`,
    };
  const property = schema.properties[segment];
  if (property) return validatePath(property, rest, fullPath);
  if (typeof schema.additionalProperties === 'object')
    return validatePath(schema.additionalProperties, rest, fullPath);
  if (schema.additionalProperties === true && rest.length === 0) return null;
  if (schema.additionalProperties === true)
    return {
      code: 'INVALID_NODE_RESULT_ACCESS',
      message: `Cannot determine the type after additional property "${segment}" in "${fullPath}"`,
    };
  return {
    code: 'INVALID_NODE_RESULT_PATH',
    message: `Property "${segment}" is not declared by the result schema in "${fullPath}"`,
  };
}

export function validateNodeResultReference(
  reference: string,
  scope: NodeResultScope,
): NodeResultReferenceIssue | null {
  const normalized = reference.startsWith('$') ? reference.slice(1) : reference;
  const segments = normalized.split('.');
  if (segments[0] !== 'nodeResults' || !segments[1])
    return {
      code: 'INVALID_NODE_RESULT_PATH',
      message: `Invalid node result reference "${reference}"`,
    };
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        ['__proto__', 'prototype', 'constructor'].includes(segment),
    )
  )
    return {
      code: 'INVALID_NODE_RESULT_PATH',
      message: `Invalid node result reference "${reference}"`,
    };
  const schema = scope.get(segments[1]);
  if (!schema)
    return {
      code: 'NODE_RESULT_NOT_VISIBLE',
      message: `Node result "${segments[1]}" is not visible from the current AST scope`,
    };
  if (validateNodeResultSchema(schema).length > 0) return null;
  return validatePath(schema, segments.slice(2), reference);
}

function binding(
  node: NodeSourceAst,
  schema: NodeResultSchema,
): NodeResultBinding {
  return {
    nodeKey: node.key,
    path: `$nodeResults.${node.key}`,
    ...(node.title === undefined && schema.title === undefined
      ? {}
      : { title: node.title ?? schema.title }),
    ...(schema.description === undefined && node.description === undefined
      ? {}
      : { description: schema.description ?? node.description }),
    schema,
  };
}

export function visitNodeResultScopes(
  ast: WorkflowSourceAst,
  contracts: WorkflowContracts,
  visitor: (node: NodeSourceAst, scope: NodeResultScope) => void,
): void {
  const resolve = createNodeResultSchemaResolver(contracts);
  const visitBlock = (
    nodes: readonly NodeSourceAst[],
    inherited: NodeResultScope,
  ): void => {
    const scope = new Map(inherited);
    for (const node of nodes) {
      visitor(node, new Map(scope));
      const result = resolve(node);
      const branchScope = new Map(scope);
      if (result) branchScope.set(node.key, result);
      for (const branch of Object.values(node.branches ?? {}))
        visitBlock(branch, branchScope);
      if (result) scope.set(node.key, result);
    }
  };
  visitBlock(ast.nodes, new Map<string, NodeResultSchema>());
}

export function getAvailableNodeResults(
  ast: WorkflowSourceAst,
  nodeKey: string,
  contracts: WorkflowContracts,
): readonly NodeResultBinding[] {
  let found: readonly NodeResultBinding[] | undefined;
  const nodesByKey = new Map<string, NodeSourceAst>();
  const collect = (nodes: readonly NodeSourceAst[]): void => {
    for (const node of nodes) {
      nodesByKey.set(node.key, node);
      for (const branch of Object.values(node.branches ?? {})) collect(branch);
    }
  };
  collect(ast.nodes);
  visitNodeResultScopes(ast, contracts, (node, scope): void => {
    if (node.key === nodeKey)
      found = [...scope].map(([key, schema]) =>
        binding(nodesByKey.get(key)!, schema),
      );
  });
  if (!found) throw new Error(`Workflow node "${nodeKey}" does not exist`);
  return found;
}

export function getAvailableNodeResultsAt(
  ast: WorkflowSourceAst,
  position: WorkflowNodeInsertionPoint,
  contracts: WorkflowContracts,
): readonly NodeResultBinding[] {
  const resolve = createNodeResultSchemaResolver(contracts);
  let block: readonly NodeSourceAst[] = ast.nodes;
  let inherited = new Map<string, NodeResultSchema>();
  if (position.parentNodeKey !== null) {
    let located = false;
    visitNodeResultScopes(ast, contracts, (node, scope): void => {
      if (node.key !== position.parentNodeKey) return;
      const result = resolve(node);
      inherited = new Map(scope);
      if (result) inherited.set(node.key, result);
      block = node.branches?.[position.branchKey ?? ''] ?? [];
      located = true;
    });
    if (!located)
      throw new Error(
        `Workflow node "${position.parentNodeKey}" does not exist`,
      );
    if (position.branchKey === null)
      throw new Error('A branch insertion point requires branchKey');
  } else if (position.branchKey !== null)
    throw new Error('A root insertion point cannot have branchKey');
  if (
    !Number.isInteger(position.index) ||
    position.index < 0 ||
    position.index > block.length
  )
    throw new Error('Insertion index is outside the target block');
  const scope = new Map(inherited);
  for (const node of block.slice(0, position.index)) {
    const result = resolve(node);
    if (result) scope.set(node.key, result);
  }
  const byKey = new Map<string, NodeSourceAst>();
  const collect = (nodes: readonly NodeSourceAst[]): void => {
    for (const node of nodes) {
      byKey.set(node.key, node);
      for (const branch of Object.values(node.branches ?? {})) collect(branch);
    }
  };
  collect(ast.nodes);
  return [...scope].map(([key, schema]) => binding(byKey.get(key)!, schema));
}
