export const WORKFLOW_COLLECTIONS = {
  workflows: 'workflows',
  nodes: 'workflowNodes',
  runs: 'workflowRuns',
  nodeRuns: 'workflowNodeRuns',
  resumeRequests: 'workflowResumeRequests',
  stats: 'workflowStats',
  versionStats: 'workflowVersionStats',
} as const;

export type WorkflowCollectionName =
  (typeof WORKFLOW_COLLECTIONS)[keyof typeof WORKFLOW_COLLECTIONS];
