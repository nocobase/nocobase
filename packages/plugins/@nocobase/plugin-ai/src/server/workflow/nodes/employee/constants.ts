/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AI_WORKFLOW_TASK_STATUS = {
  PROCESSING: 'processing',
  PENDING_ACCEPTANCE: 'pending_acceptance',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ABORTED: 'aborted',
} as const;

export type AIWorkflowTaskStatus = (typeof AI_WORKFLOW_TASK_STATUS)[keyof typeof AI_WORKFLOW_TASK_STATUS];

export const REQUIRES_APPROVAL = {
  NO_REQUIRED: 'no_required',
  AI_DECISION: 'ai_decision',
  HUMAN_DECISION: 'human_decision',
} as const;

export type RequiresApproval = (typeof REQUIRES_APPROVAL)[keyof typeof REQUIRES_APPROVAL];
