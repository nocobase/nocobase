/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Full-width workflow details are siblings of the normal Settings layout. The `settingsDetails.*` namespace is owned
// only by the standalone Client V2 Settings router, so these pages keep the compact Settings header without the sidebar.
export const WORKFLOW_CANVAS_ROUTE_NAME = 'settingsDetails.workflow.workflows.id';
export const WORKFLOW_CANVAS_ROUTE_PATH = '/settings/workflow/workflows/:id';

export function getWorkflowCanvasPath(id: string | number) {
  return `/settings/workflow/workflows/${id}`;
}

export const WORKFLOW_EXECUTION_ROUTE_NAME = 'settingsDetails.workflow.executions.id';
export const WORKFLOW_EXECUTION_ROUTE_PATH = '/settings/workflow/executions/:id';

export function getWorkflowExecutionPath(id: string | number) {
  return `/settings/workflow/executions/${id}`;
}

export const WORKFLOW_TASKS_ROUTE_NAME = 'admin.workflow.tasks';
export const WORKFLOW_TASKS_ROUTE_PATH = '/admin/workflow/tasks/:taskType?/:status?/:popupId?';

export const WORKFLOW_TASKS_MOBILE_ROUTE_NAME = 'mobile.page.workflow.tasks.list';
export const WORKFLOW_TASKS_MOBILE_ROUTE_PATH = 'page/workflow-tasks/:taskType?/:status?/:popupId?';

export function getWorkflowTasksPath(taskType?: string, status?: string, popupId?: string | number, mobile = false) {
  const basePath = mobile ? '/mobile/page/workflow-tasks' : '/admin/workflow/tasks';
  const segments = [taskType, status, popupId]
    .filter((segment) => segment !== undefined && segment !== null && segment !== '')
    .map((segment) => encodeURIComponent(String(segment)));

  return segments.length ? `${basePath}/${segments.join('/')}` : basePath;
}
