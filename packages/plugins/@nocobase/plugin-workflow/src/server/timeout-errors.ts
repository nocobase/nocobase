/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class WorkflowTimeoutError extends Error {
  code = 'WORKFLOW_TIMEOUT';

  constructor(message = 'Workflow execution timed out') {
    super(message);
    this.name = 'WorkflowTimeoutError';
  }
}

export function isWorkflowTimeoutError(error: any) {
  return (
    error instanceof WorkflowTimeoutError ||
    error?.name === 'WorkflowTimeoutError' ||
    error?.code === 'WORKFLOW_TIMEOUT'
  );
}
