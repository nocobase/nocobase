export interface WorkflowRouteIds {
  readonly workflowDetail: string;
  readonly workflowRunDetail: string;
}

export const WORKFLOW_ROUTE_IDS: WorkflowRouteIds = Object.freeze({
  workflowDetail: '@nocobase/app-plugin-dag-flow:workflow-detail',
  workflowRunDetail: '@nocobase/app-plugin-dag-flow:workflow-run-detail',
});

export interface WorkflowSettingPaths {
  readonly root: string;
  readonly workflows: string;
  readonly workflowRuns: string;
}

export const WORKFLOW_SETTING_PATHS: WorkflowSettingPaths = Object.freeze({
  root: '/settings/workflow',
  workflows: '/settings/workflow/workflows',
  workflowRuns: '/settings/workflow/runs',
});
