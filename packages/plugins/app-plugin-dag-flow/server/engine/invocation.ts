import type { JsonObject, JsonValue } from './types.js';

export type WorkflowInputSchemaType =
  'null' | 'boolean' | 'number' | 'integer' | 'string' | 'array' | 'object';

export interface WorkflowInputSchema {
  $schema?: 'https://json-schema.org/draft/2020-12/schema';
  type?: WorkflowInputSchemaType | WorkflowInputSchemaType[];
  title?: string;
  description?: string;
  properties?: Record<string, WorkflowInputSchema>;
  required?: string[];
  additionalProperties?: boolean | WorkflowInputSchema;
  items?: WorkflowInputSchema;
  enum?: JsonValue[];
  const?: JsonValue;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

export interface InputValidationIssue {
  path: string;
  keyword: string;
  message: string;
}

export interface InputValidationResult {
  valid: boolean;
  issues: InputValidationIssue[];
}

export type WorkflowTriggerSkipReason = 'not-found' | 'disabled';

export type WorkflowTriggerReceipt =
  | { status: 'accepted'; eventKey: string; runId: string }
  | { status: 'skipped'; reason: WorkflowTriggerSkipReason; eventKey?: never };

export const WORKFLOW_INPUT_SCHEMA_DIALECT: 'https://json-schema.org/draft/2020-12/schema' =
  'https://json-schema.org/draft/2020-12/schema';
export const WORKFLOW_INPUT_MAX_BYTES: 65536 = 65_536;
export const WORKFLOW_INVOCATION_SCHEDULING: 'enqueue' = 'enqueue';

export class WorkflowInvocationError extends Error {
  constructor(
    readonly code:
      | 'WORKFLOW_NOT_FOUND'
      | 'WORKFLOW_DISABLED'
      | 'INVALID_INPUT'
      | 'INPUT_TOO_LARGE'
      | 'PARENT_RUN_NOT_FOUND'
      | 'STACK_LIMIT_EXCEEDED',
    message: string,
    readonly issues: readonly InputValidationIssue[] = [],
  ) {
    super(message);
    this.name = 'WorkflowInvocationError';
  }
}

function jsonType(value: JsonValue): WorkflowInputSchemaType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value as 'boolean' | 'string' | 'object';
}

function sameJson(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateValue(
  schema: WorkflowInputSchema,
  value: JsonValue,
  path: string,
  issues: InputValidationIssue[],
): void {
  const actual = jsonType(value);
  const types =
    schema.type === undefined
      ? []
      : Array.isArray(schema.type)
        ? schema.type
        : [schema.type];
  if (
    types.length &&
    !types.some(
      (type) => type === actual || (type === 'number' && actual === 'integer'),
    )
  ) {
    issues.push({
      path,
      keyword: 'type',
      message: `must be ${types.join(' or ')}`,
    });
    return;
  }
  if (
    schema.enum &&
    !schema.enum.some((candidate) => sameJson(candidate, value))
  ) {
    issues.push({
      path,
      keyword: 'enum',
      message: 'must equal one of the allowed values',
    });
  }
  if (schema.const !== undefined && !sameJson(schema.const, value)) {
    issues.push({
      path,
      keyword: 'const',
      message: 'must equal the constant value',
    });
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum)
      issues.push({
        path,
        keyword: 'minimum',
        message: `must be >= ${schema.minimum}`,
      });
    if (schema.maximum !== undefined && value > schema.maximum)
      issues.push({
        path,
        keyword: 'maximum',
        message: `must be <= ${schema.maximum}`,
      });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength)
      issues.push({
        path,
        keyword: 'minLength',
        message: `must contain at least ${schema.minLength} characters`,
      });
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      issues.push({
        path,
        keyword: 'maxLength',
        message: `must contain at most ${schema.maxLength} characters`,
      });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      issues.push({
        path,
        keyword: 'minItems',
        message: `must contain at least ${schema.minItems} items`,
      });
    if (schema.maxItems !== undefined && value.length > schema.maxItems)
      issues.push({
        path,
        keyword: 'maxItems',
        message: `must contain at most ${schema.maxItems} items`,
      });
    if (schema.items)
      value.forEach((item, index) =>
        validateValue(schema.items!, item, `${path}/${index}`, issues),
      );
  }
  if (value !== null && !Array.isArray(value) && typeof value === 'object') {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key))
        issues.push({
          path: `${path}/${key}`,
          keyword: 'required',
          message: 'is required',
        });
    }
    for (const [key, item] of Object.entries(value)) {
      const property = schema.properties?.[key];
      if (property) validateValue(property, item, `${path}/${key}`, issues);
      else if (
        schema.additionalProperties === undefined ||
        schema.additionalProperties === false
      )
        issues.push({
          path: `${path}/${key}`,
          keyword: 'additionalProperties',
          message: 'is not allowed',
        });
      else if (typeof schema.additionalProperties === 'object')
        validateValue(
          schema.additionalProperties,
          item,
          `${path}/${key}`,
          issues,
        );
    }
  }
}

export function validateInputValue(
  schema: WorkflowInputSchema,
  input: JsonObject,
): InputValidationResult {
  const issues: InputValidationIssue[] = [];
  validateValue(schema, input, '$', issues);
  return { valid: issues.length === 0, issues };
}

export function assertInputSize(input: JsonObject): void {
  const bytes = Buffer.byteLength(JSON.stringify(input), 'utf8');
  if (bytes > WORKFLOW_INPUT_MAX_BYTES) {
    throw new WorkflowInvocationError(
      'INPUT_TOO_LARGE',
      `Workflow input exceeds ${WORKFLOW_INPUT_MAX_BYTES} bytes`,
    );
  }
}

export function validateWorkflowInputSchema(
  schema: WorkflowInputSchema,
): InputValidationResult {
  const issues: InputValidationIssue[] = [];
  if (schema.type !== 'object')
    issues.push({
      path: '$.type',
      keyword: 'type',
      message: 'input schema root type must be object',
    });
  const unsupported = ['$ref', '$dynamicRef', 'format', '$async'];
  const visit = (candidate: WorkflowInputSchema, path: string): void => {
    const record = candidate as object;
    for (const keyword of unsupported) {
      if (Object.hasOwn(record, keyword))
        issues.push({
          path: `${path}.${keyword}`,
          keyword,
          message: `${keyword} is not supported`,
        });
    }
    Object.entries(candidate.properties ?? {}).forEach(([key, child]) =>
      visit(child, `${path}.properties.${key}`),
    );
    if (candidate.items) visit(candidate.items, `${path}.items`);
    if (typeof candidate.additionalProperties === 'object')
      visit(candidate.additionalProperties, `${path}.additionalProperties`);
  };
  visit(schema, '$');
  return { valid: issues.length === 0, issues };
}
