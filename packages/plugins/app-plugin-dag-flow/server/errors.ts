import { ApiError, type ApiErrorOptions } from '@nocobase/app-server/router';

/** The domain of every error reason this plugin defines: its URL namespace. */
export const WORKFLOW_ERROR_DOMAIN = 'workflows';

export type WorkflowErrorOptions = Omit<ApiErrorOptions, 'domain'>;

/** An error in the standard `/api` body, in the workflow plugin's domain. */
export function workflowError(options: WorkflowErrorOptions): ApiError {
  return new ApiError({ ...options, domain: WORKFLOW_ERROR_DOMAIN });
}

export function workflowNotFound(id: unknown): ApiError {
  return workflowError({
    status: 'NOT_FOUND',
    reason: 'WORKFLOW_NOT_FOUND',
    message: `Workflow ${String(id)} was not found.`,
  });
}

export function currentWorkflowNotFound(id: unknown): ApiError {
  return workflowError({
    status: 'NOT_FOUND',
    reason: 'WORKFLOW_NOT_FOUND',
    message: `Current workflow ${String(id)} was not found.`,
  });
}

export function invalidWorkflowId(message: string): ApiError {
  return workflowError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_WORKFLOW_ID',
    message,
  });
}
