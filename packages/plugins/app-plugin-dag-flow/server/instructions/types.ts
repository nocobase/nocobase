export type JsonPrimitive = null | boolean | number | string;
export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface WorkflowParameterOption {
  label: string;
  value: string | number;
}

export interface WorkflowParameterDeclaration {
  type: 'string' | 'number' | 'boolean';
  title?: string;
  description?: string;
  default?: string | number | boolean;
  enum?: WorkflowParameterOption[];
}

export type WorkflowParameterSchema = Record<
  string,
  WorkflowParameterDeclaration
>;

/**
 * One administrator parameter as it is authored.
 *
 * The authored form is an ordinary JSON Schema property, so `enum` is a list of
 * values; the runtime's editor wants `{ label, value }` pairs and gets them
 * when `compileToFlatIr()` lowers this to `WorkflowParameterSchema`.
 */
export interface WorkflowParameterPropertySchema {
  type: 'string' | 'number' | 'boolean';
  title?: string;
  description?: string;
  default?: string | number | boolean;
  enum?: readonly (string | number)[];
}

export interface WorkflowParametersObjectSchema {
  type: 'object';
  properties?: Record<string, WorkflowParameterPropertySchema>;
  additionalProperties?: false;
}

/**
 * What `parameters` accepts in a definition: the JSON Schema object form that
 * matches how `inputSchema` is written, or the flat declaration map the
 * runtime stores. Both compile to the same Flat IR.
 */
export type WorkflowParametersSchemaInput =
  WorkflowParametersObjectSchema | WorkflowParameterSchema;

export interface ConfigIssue {
  path: string;
  message: string;
}

export interface JSONSchema {
  readonly [key: string]: JsonValue;
}

export interface WorkflowInputSchema extends JSONSchema {
  readonly type: 'object';
}

/** Static execution settings stored with each workflow revision. */
export type WorkflowOptions = {
  /** Maximum execution time in seconds; zero or omission disables the limit. */
  timeout?: number;
  /** Maximum occurrences of this workflow in a nested run chain; defaults to 1. */
  stackLimit?: number;
};

export interface WorkflowNodeOptions {
  /** Maximum execution time in milliseconds. */
  timeout?: number;
}

export interface NodeResultSchemaBase {
  readonly title?: string;
  readonly description?: string;
  readonly examples?: readonly JsonValue[];
  readonly const?: JsonPrimitive;
}

export interface NodeResultNullSchema extends NodeResultSchemaBase {
  readonly type: 'null';
}
export interface NodeResultBooleanSchema extends NodeResultSchemaBase {
  readonly type: 'boolean';
}
export interface NodeResultNumberSchema extends NodeResultSchemaBase {
  readonly type: 'number' | 'integer';
  readonly enum?: readonly number[];
}
export interface NodeResultStringSchema extends NodeResultSchemaBase {
  readonly type: 'string';
  readonly enum?: readonly string[];
}
export interface NodeResultArraySchema extends NodeResultSchemaBase {
  readonly type: 'array';
  readonly items: NodeResultSchema;
}
export interface NodeResultObjectSchema extends NodeResultSchemaBase {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, NodeResultSchema>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean | NodeResultSchema;
}
export interface NodeResultUnionSchema extends NodeResultSchemaBase {
  readonly oneOf: readonly NodeResultSchema[];
}
export interface NodeResultAnyOfSchema extends NodeResultSchemaBase {
  readonly anyOf: readonly NodeResultSchema[];
}
export type NodeResultSchema =
  | NodeResultNullSchema
  | NodeResultBooleanSchema
  | NodeResultNumberSchema
  | NodeResultStringSchema
  | NodeResultArraySchema
  | NodeResultObjectSchema
  | NodeResultUnionSchema
  | NodeResultAnyOfSchema;

export interface WorkflowNodeSourceInput<TConfig> {
  key: string;
  title?: string;
  description?: string;
  config: TConfig;
  options?: WorkflowNodeOptions;
  result?: NodeResultSchema | null;
}

export interface BaseNodeExpression {
  readonly key: string;
  readonly title?: string;
  readonly description?: string;
  readonly type: string;
  readonly config: unknown;
  readonly options?: WorkflowNodeOptions;
  readonly result?: NodeResultSchema | null;
}

export interface BranchingNodeExpression<
  TBranch extends string,
> extends BaseNodeExpression {
  branch(
    branches: Partial<Record<TBranch, readonly AnyNodeExpression[]>>,
  ): NodeExpression<TBranch>;
}

export type AnyNodeExpression =
  BaseNodeExpression | BranchingNodeExpression<string>;
export type NodeExpression<TBranch extends string = never> =
  string extends TBranch
    ? AnyNodeExpression
    : [TBranch] extends [never]
      ? BaseNodeExpression
      : BranchingNodeExpression<TBranch>;

export interface WorkflowSourceInput {
  title: string;
  description?: string;
  options?: WorkflowOptions;
  parameters?: WorkflowParametersSchemaInput;
  client?: WorkflowClientSource;
  inputSchema?: WorkflowInputSchema;
  nodes: readonly AnyNodeExpression[];
}

export interface WorkflowClientSource {
  readonly inputForm?: string;
  readonly parameterForm?: string;
}

export interface NodeSourceAst {
  key: string;
  title?: string;
  description?: string;
  type: string;
  config: JsonObject;
  options?: WorkflowNodeOptions;
  result?: NodeResultSchema | null;
  branches?: Record<string, NodeSourceAst[]>;
}

export interface WorkflowSourceAst {
  title: string;
  description?: string;
  options?: WorkflowOptions;
  /** As authored; `compileToFlatIr()` lowers it to `WorkflowParameterSchema`. */
  parameters?: WorkflowParametersSchemaInput;
  client?: WorkflowClientSource;
  inputSchema: WorkflowInputSchema;
  nodes: NodeSourceAst[];
}

export type WorkflowDefinition = WorkflowSourceAst;

export interface WorkflowFlatNode {
  key: string;
  title?: string;
  description?: string;
  type: string;
  config: JsonObject;
  options?: WorkflowNodeOptions;
  result?: NodeResultSchema;
  upstreamKey: string | null;
  downstreamKey: string | null;
  branchKey: string | null;
}

export interface WorkflowFlatIr {
  title: string;
  description?: string;
  options?: WorkflowOptions;
  parameters?: WorkflowParameterSchema;
  client?: WorkflowClientSource;
  inputSchema: WorkflowInputSchema;
  start: string | null;
  nodes: WorkflowFlatNode[];
}
