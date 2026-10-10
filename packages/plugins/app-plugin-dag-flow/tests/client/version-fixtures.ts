import type {
  WorkflowDetailRecord,
  WorkflowNodeRecord,
} from '../../client/workflow-management/types.js';

export function node(
  key: string,
  overrides: Partial<WorkflowNodeRecord> = {},
): WorkflowNodeRecord {
  return {
    id: key,
    key,
    title: key,
    description: null,
    type: 'run',
    config: {},
    upstreamKey: null,
    downstreamKey: null,
    branchKey: null,
    ...overrides,
  };
}
export function version(
  overrides: Partial<WorkflowDetailRecord> = {},
): WorkflowDetailRecord {
  return {
    id: 'old',
    key: 'flow',
    title: 'Flow',
    description: null,
    enabled: false,
    current: false,
    hasParameters: false,
    executed: 0,
    version: 'v1',
    hash: 'old-hash',
    inputSchema: {},
    parametersSchema: {},
    parameterValues: {},
    pendingArtifact: null,
    nodes: [node('task')],
    ...overrides,
  };
}
