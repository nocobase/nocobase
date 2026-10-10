import type { Row } from '@nocobase/db';

import type { WorkflowStore } from '../collections/store.js';
import type {
  JsonObject,
  JsonValue,
  WorkflowDefinition,
  WorkflowId,
  WorkflowLogger,
  WorkflowNode,
  WorkflowRun,
  WorkflowNodeRun,
} from './types.js';
import type {
  WorkflowParameterSchema,
  WorkflowParameterValues,
} from '../../shared/parameters.js';
import type { WorkflowInputSchema } from './invocation.js';
import type { WorkflowClientSource } from '../instructions/types.js';

export const noopWorkflowLogger: WorkflowLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

/**
 * The current instant, in the form every temporal column of this plugin holds.
 *
 * Those columns are `datetimeTz`, and the Repository reads and writes one as a
 * canonical UTC ISO-8601 string on every dialect, so this is both what goes in
 * and what comes back out. See `collections/store.ts`.
 */
export function nowInstant(): string {
  return new Date().toISOString();
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) {
    return fallback;
  }
  if (typeof value !== 'string') {
    return value as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    // Repository rows already decode JSON string scalars to plain strings.
    // Keep those values instead of treating them as malformed JSON text.
    return value as T;
  }
}

/**
 * Normalize an arbitrary workflow value to the JSON value contract expected
 * by Repository JSON fields. The database layer owns the actual encoding, so
 * this must return a value rather than JSON text; otherwise a scalar such as
 * `2` would be written as the JSON string `"2"`.
 */
export function serializeJson(value: unknown): JsonValue {
  const text = JSON.stringify(
    value === undefined ? null : value,
    (_key, item) => (typeof item === 'bigint' ? item.toString() : item),
  );
  return JSON.parse(text) as JsonValue;
}

export function asId(value: unknown, field: string = 'id'): WorkflowId {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  throw new Error(`Expected ${field} to be a number or string`);
}

/**
 * An id as a Repository filter takes it.
 *
 * Every id here belongs to a `bigInt` column, and a `bigInt` filter accepts a
 * JavaScript number only — a string is rejected outright rather than coerced.
 * Ids reach this plugin as strings often enough (a route parameter, a JSON
 * body, a driver that returns bigints as text) that the conversion is worth
 * one named place. Anything that cannot survive it is refused rather than
 * rounded, because a rounded id silently addresses a different row.
 */
export function asIdFilter(value: WorkflowId): number {
  const id = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new Error(`Workflow identifier "${String(value)}" is out of range.`);
  }
  return id;
}

export function asNullableString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : String(value);
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

export function hydrateWorkflowNode(row: Row): WorkflowNode {
  return {
    id: asId(row.id),
    key: String(row.key),
    title: asNullableString(row.title),
    description: asNullableString(row.description),
    workflowId: asId(row.workflowId, 'workflowId'),
    upstreamKey: asNullableString(row.upstreamKey),
    branchKey: asNullableString(row.branchKey),
    downstreamKey: asNullableString(row.downstreamKey),
    type: String(row.type),
    config: parseJson<JsonObject>(row.config, {}),
    options: parseJson(row.options, {}),
  };
}

export function hydrateWorkflow(
  row: Row,
  nodes: WorkflowNode[] = [],
): WorkflowDefinition {
  return {
    id: asId(row.id),
    key: String(row.key),
    hash: asNullableString(row.hash),
    version: asNullableString(row.version),
    title: asNullableString(row.title),
    enabled: asBoolean(row.enabled),
    description: asNullableString(row.description),
    inputSchema: parseJson<WorkflowInputSchema>(row.inputSchema, {
      type: 'object',
    }),
    parametersSchema: parseJson<WorkflowParameterSchema>(
      row.parametersSchema,
      {},
    ),
    parameterValues: parseJson<WorkflowParameterValues>(
      row.parameterValues,
      {},
    ),
    client: parseJson<WorkflowClientSource>(row.client, {}),
    current: row.current == null ? null : asBoolean(row.current),
    options: parseJson<JsonObject>(row.options, {}),
    nodes,
  };
}

export function hydrateRun(row: Row): WorkflowRun {
  return {
    id: asId(row.id),
    workflowId: asId(row.workflowId, 'workflowId'),
    workflowKey: String(row.workflowKey),
    hash: asNullableString(row.hash),
    eventKey: String(row.eventKey),
    input: parseJson<JsonObject>(row.input, {}),
    parameters: parseJson<WorkflowParameterValues>(row.parameters, {}),
    status: row.status == null ? null : Number(row.status),
    dispatched: asBoolean(row.dispatched),
    parentRunId:
      row.parentRunId == null ? null : asId(row.parentRunId, 'parentRunId'),
    stack: parseJson<WorkflowId[]>(row.stack, []),
    output: parseJson(row.output, null),
    startedAt: asNullableString(row.startedAt),
    finishedAt: asNullableString(row.finishedAt),
    expiresAt: asNullableString(row.expiresAt),
    createdAt: asNullableString(row.createdAt) ?? new Date(0).toISOString(),
    manually: asBoolean(row.manually),
    reason: asNullableString(row.reason),
    sourceType: asNullableString(row.sourceType),
    sourceId: asNullableString(row.sourceId),
  };
}

export function hydrateNodeRun(row: Row): WorkflowNodeRun {
  return {
    id: asId(row.id),
    workflowRunId: asId(row.workflowRunId, 'workflowRunId'),
    nodeId: asId(row.nodeId, 'nodeId'),
    nodeKey: String(row.nodeKey),
    status: Number(row.status),
    meta: parseJson(row.meta, null),
    result: parseJson(row.result, null),
    error: asNullableString(row.error),
    startedAt: asNullableString(row.startedAt) ?? new Date(0).toISOString(),
    finishedAt: asNullableString(row.finishedAt),
    expiresAt: asNullableString(row.expiresAt),
    log: asNullableString(row.log),
  };
}

export async function loadWorkflow(
  store: WorkflowStore,
  id: WorkflowId,
): Promise<WorkflowDefinition | null> {
  const row = await store.workflows.findOne({ filter: { id: asIdFilter(id) } });
  if (!row) {
    return null;
  }
  const nodes = await store.nodes.findMany({
    filter: { workflowId: asIdFilter(id) },
    sort: (sort) => sort.field('id').asc(),
  });
  return hydrateWorkflow(row, nodes.map(hydrateWorkflowNode));
}

export async function loadRun(
  store: WorkflowStore,
  id: WorkflowId,
): Promise<WorkflowRun | null> {
  const row = await store.runs.findOne({ filter: { id: asIdFilter(id) } });
  return row ? hydrateRun(row) : null;
}

export async function loadNodeRun(
  store: WorkflowStore,
  id: WorkflowId,
): Promise<WorkflowNodeRun | null> {
  const row = await store.nodeRuns.findOne({ filter: { id: asIdFilter(id) } });
  return row ? hydrateNodeRun(row) : null;
}
