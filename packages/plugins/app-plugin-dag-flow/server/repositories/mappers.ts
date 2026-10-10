import type { Row } from '@nocobase/db';
import type {
  JsonObject,
  JsonValue,
  WorkflowDefinition,
  WorkflowId,
} from '../engine/index.js';
import type { WorkflowDistArtifact } from '../loader/index.js';
import { asNullableString } from '../engine/utils.js';
import { invalidWorkflowId, workflowError } from '../errors.js';
import type {
  WorkflowDefinitionView,
  WorkflowListItem,
  WorkflowNodeRunSummary,
  WorkflowRunListItem,
} from './types.js';

export function asWorkflowId(value: unknown): WorkflowId {
  if (typeof value === 'number' || typeof value === 'string') return value;
  throw new Error('Workflow row has an invalid id.');
}

export type ParsedWorkflowIdentifier =
  { kind: 'id'; value: string } | { kind: 'hash'; value: string };

const WORKFLOW_ID_PATTERN = /^[1-9]\d*$/;
const ARTIFACT_HASH_PATTERN = /^[a-f\d]{64}$/i;
/**
 * The largest id this plugin will address.
 *
 * The column is `bigInt`, but a Repository filter on one takes a JavaScript
 * number, so an id beyond `Number.MAX_SAFE_INTEGER` cannot be expressed without
 * rounding it into a different row. Refusing it here turns that into a 400 on
 * the request that supplied it, rather than an error from deep inside a query.
 */
const MAX_WORKFLOW_ID = BigInt(Number.MAX_SAFE_INTEGER);

export function parseWorkflowIdentifier(
  value: WorkflowId,
): ParsedWorkflowIdentifier {
  const identifier = String(value);
  if (ARTIFACT_HASH_PATTERN.test(identifier)) {
    return { kind: 'hash', value: identifier.toLowerCase() };
  }
  if (
    WORKFLOW_ID_PATTERN.test(identifier) &&
    BigInt(identifier) <= MAX_WORKFLOW_ID
  ) {
    return { kind: 'id', value: identifier };
  }
  throw invalidWorkflowId(
    'Workflow identifier must be a positive integer id or a 64-character hexadecimal Artifact hash.',
  );
}

export function parseWorkflowId(value: WorkflowId): WorkflowId {
  const identifier = parseWorkflowIdentifier(value);
  if (identifier.kind === 'id') return identifier.value;
  throw invalidWorkflowId('Workflow identifier must be a positive integer id.');
}

export function normalizePage(options: { page?: number; pageSize?: number }): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function toWorkflowListItem(
  row: Row,
  executed: number,
  activeRunCount: number = 0,
  latestRun?: Row,
): WorkflowListItem {
  return {
    id: String(asWorkflowId(row.id)),
    key: String(row.key ?? ''),
    title: row.title == null ? null : String(row.title),
    enabled: row.enabled === true || row.enabled === 1 || row.enabled === '1',
    current:
      row.current == null
        ? null
        : row.current === true || row.current === 1 || row.current === '1',
    hasParameters: hasObjectKeys(row.parametersSchema),
    executed,
    version: row.version == null ? null : String(row.version),
    hash: row.hash == null ? null : String(row.hash),
    activeRunCount,
    latestRun: latestRun
      ? {
          id: String(latestRun.id),
          status: latestRun.status == null ? null : Number(latestRun.status),
          createdAt: asNullableString(latestRun.createdAt) ?? '',
        }
      : null,
    pendingArtifact: null,
  };
}

export function toDiscoveredWorkflowDefinition(
  artifact: WorkflowDistArtifact,
): WorkflowDefinitionView {
  return {
    id: null,
    key: artifact.key,
    title: artifact.workflow.title ?? null,
    description: artifact.workflow.description ?? null,
    hash: artifact.digest,
    version: null,
    enabled: false,
    current: null,
    hasParameters: hasObjectKeys(artifact.workflow.parameters ?? {}),
    executed: 0,
    latestRun: null,
    pendingArtifact: null,
    inputSchema: artifact.workflow.inputSchema,
    parametersSchema: artifact.workflow.parameters ?? {},
    parameterValues: {},
    client: artifact.workflow.client ?? {},
    nodes: artifact.workflow.nodes.map((node, index) => ({
      id: `${artifact.key}:${index}`,
      key: node.key,
      title: node.title ?? null,
      description: node.description ?? null,
      type: node.type,
      config: node.config,
      upstreamKey: node.upstreamKey,
      downstreamKey: node.downstreamKey,
      branchKey: node.branchKey,
    })),
  };
}

export function toWorkflowDefinitionView(
  workflow: WorkflowDefinition,
): Omit<WorkflowDefinitionView, 'executed' | 'latestRun'> {
  return {
    id: String(workflow.id),
    key: workflow.key,
    title: workflow.title,
    description: workflow.description,
    hash: workflow.hash,
    version: workflow.version,
    enabled: workflow.enabled,
    current: workflow.current,
    hasParameters: hasObjectKeys(workflow.parametersSchema),
    pendingArtifact: null,
    inputSchema: workflow.inputSchema,
    parametersSchema: workflow.parametersSchema,
    parameterValues: workflow.parameterValues,
    client: workflow.client ?? {},
    nodes: workflow.nodes.map((node) => ({
      id: String(node.id),
      key: node.key,
      title: node.title,
      description: node.description,
      type: node.type,
      config: node.config,
      upstreamKey: node.upstreamKey,
      downstreamKey: node.downstreamKey,
      branchKey: node.branchKey,
    })),
  };
}

export function toRunItem(
  row: Row,
  workflowTitle: string | null = null,
  workflowVersion: string | null = null,
): WorkflowRunListItem {
  return {
    id: String(asWorkflowId(row.id)),
    workflowId: String(asWorkflowId(row.workflowId)),
    workflowKey: String(row.workflowKey ?? ''),
    workflowTitle,
    workflowVersion,
    eventKey: String(row.eventKey ?? ''),
    status: row.status == null ? null : Number(row.status),
    createdAt: asNullableString(row.createdAt) ?? '',
    startedAt: asNullableString(row.startedAt),
    finishedAt: asNullableString(row.finishedAt),
  };
}

export function toNodeRunSummary(row: Row): WorkflowNodeRunSummary {
  return {
    id: String(asWorkflowId(row.id)),
    workflowRunId: String(asWorkflowId(row.workflowRunId)),
    nodeId: String(asWorkflowId(row.nodeId)),
    nodeKey: String(row.nodeKey),
    status: Number(row.status),
    startedAt: asNullableString(row.startedAt) ?? '',
    finishedAt: asNullableString(row.finishedAt),
    branchKey: null,
  };
}

export function parsePayload(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function redactPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPayload);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      /password|secret|token|authorization|cookie/i.test(key)
        ? '[REDACTED]'
        : redactPayload(item),
    ]),
  );
}

export function redactLog(value: string): string {
  return value.replace(
    /(password|secret|token|authorization|cookie)\s*[:=]\s*[^\s,;]+/gi,
    '$1=[REDACTED]',
  );
}

export function requireJsonObject(value: unknown): JsonObject {
  if (!isJsonObject(value))
    throw workflowError({
      status: 'INVALID_ARGUMENT',
      reason: 'INVALID_INPUT',
      message: 'Workflow input must be a JSON object.',
      fieldViolations: [
        {
          field: 'input',
          description: 'Workflow input must be a JSON object.',
        },
      ],
    });
  return value;
}

function hasObjectKeys(value: unknown): boolean {
  if (typeof value === 'string') {
    try {
      return hasObjectKeys(JSON.parse(value) as unknown);
    } catch {
      return false;
    }
  }
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

function isJsonObject(value: unknown): value is JsonObject {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(isJsonValue)
  );
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isJsonObject(value);
}
