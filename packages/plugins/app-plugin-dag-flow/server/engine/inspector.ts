import type { WorkflowLogger, WorkflowNode } from './types.js';

export interface RunNodeInspectorProjection {
  type: string;
  title: string;
  module: string;
  artifactShortId: string;
  sourceManaged: true;
  argsKeys: string[];
}
export interface RunExecutionLogFields {
  workflowId: string | number;
  executionId: string | number;
  nodeId: string | number;
  nodeKey: string;
  artifactDigest: string | null;
  module: string;
  durationMs: number;
  status: 'success' | 'error' | 'aborted';
}

export function projectRunNodeInspector(
  node: WorkflowNode,
  artifactDigest: string,
): RunNodeInspectorProjection {
  const args = node.config.args;
  return {
    type: node.type,
    title: node.title ?? node.key,
    module: String(node.config.module ?? ''),
    artifactShortId: artifactDigest.slice(0, 12),
    sourceManaged: true,
    argsKeys:
      args && typeof args === 'object' && !Array.isArray(args)
        ? Object.keys(args).sort()
        : [],
  };
}

export function logRunExecution(
  logger: WorkflowLogger,
  fields: RunExecutionLogFields,
): void {
  logger.info(`Run node "${fields.nodeKey}" ${fields.status}`, fields);
}
