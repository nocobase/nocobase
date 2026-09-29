import type { WorkflowClientSource } from '../instructions/types.js';
import type {
  JsonObject,
  WorkflowId,
  WorkflowParameterSchema,
  WorkflowParameterValues,
  WorkflowRun,
} from '../engine/index.js';

export interface WorkflowListItem {
  id: WorkflowId | null;
  key: string;
  title: string | null;
  enabled: boolean;
  current: boolean | null;
  hasParameters: boolean;
  executed: number;
  version: string | null;
  hash: string | null;
  activeRunCount: number;
  latestRun: { id: string; status: number | null; createdAt: string } | null;
  pendingArtifact: {
    hash: string;
    title: string | null;
  } | null;
}

export interface WorkflowRunListItem extends Pick<
  WorkflowRun,
  'id' | 'workflowId' | 'workflowKey' | 'eventKey' | 'status' | 'createdAt'
> {
  workflowTitle: string | null;
  workflowVersion: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface WorkflowPage<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
export interface WorkflowListOptions {
  key?: string;
  query?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}
export interface WorkflowRunListOptions {
  workflowKey?: string;
  workflowTitle?: string;
  status?: number | null;
  page?: number;
  pageSize?: number;
}
export interface WorkflowRunDetail extends WorkflowRunListItem {
  hash: string | null;
  input: unknown;
  manually: boolean;
  reason: string | null;
  nodeRuns: WorkflowNodeRunSummary[];
}
export interface WorkflowNodeRunSummary {
  id: WorkflowId;
  workflowRunId: WorkflowId;
  nodeId: WorkflowId;
  nodeKey: string;
  status: number;
  startedAt: string;
  finishedAt: string | null;
  branchKey: string | null;
}
export interface WorkflowNodeRunPayload {
  id: string;
  result: unknown;
  error: string | null;
  log: string | null;
  truncated: boolean;
}
export interface WorkflowParameterSettings {
  id: WorkflowId;
  schema: WorkflowParameterSchema;
  values: WorkflowParameterValues;
}
export interface WorkflowDefinitionView {
  id: string | null;
  key: string;
  title: string | null;
  description: string | null;
  hash: string | null;
  version: string | null;
  enabled: boolean;
  current: boolean | null;
  hasParameters: boolean;
  executed: number;
  latestRun: { id: string; status: number | null; createdAt: string } | null;
  pendingArtifact: {
    hash: string;
    title: string | null;
  } | null;
  inputSchema: unknown;
  parametersSchema: WorkflowParameterSchema;
  parameterValues: WorkflowParameterValues;
  /** Revision-owned Client declarations, such as the custom parameter form. */
  client: WorkflowClientSource;
  nodes: Array<{
    id: string;
    key: string;
    title: string | null;
    description: string | null;
    type: string;
    config: JsonObject;
    upstreamKey: string | null;
    downstreamKey: string | null;
    branchKey: string | null;
  }>;
}
