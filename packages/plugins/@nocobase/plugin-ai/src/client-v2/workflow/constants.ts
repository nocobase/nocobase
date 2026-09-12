/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  AIEmployeeApprovalMode,
  AIEmployeeFileInputType,
  AIWorkflowGroup,
  LLMMessageContentType,
  LLMMessageRole,
  TriggerParameterType,
} from './types';

export const AI_WORKFLOW_GROUP: AIWorkflowGroup = 'ai';

export const LLM_INSTRUCTION_TYPE = 'llm';
export const AI_EMPLOYEE_INSTRUCTION_TYPE = 'ai-employee';
export const AI_EMPLOYEE_TRIGGER_TYPE = 'ai-employee';

export const LLM_MESSAGE_ROLES: LLMMessageRole[] = ['system', 'user', 'assistant'];

export const LLM_MESSAGE_CONTENT_TYPES: LLMMessageContentType[] = ['text', 'image_url', 'image_base64'];

export const TRIGGER_PARAMETER_TYPES: TriggerParameterType[] = ['string', 'number', 'boolean', 'enum'];

export const TRIGGER_PARAMETER_NAME_PATTERN = /^[a-zA-Z_]+$/;
export const TRIGGER_PARAMETER_NAME_ERROR = 'a-z, A-Z, _';

export const AI_EMPLOYEE_FILE_INPUT_TYPES: AIEmployeeFileInputType[] = ['attachments', 'file_id', 'file_url'];

export const AI_EMPLOYEE_APPROVAL_MODES: AIEmployeeApprovalMode[] = ['no_required', 'ai_decision', 'human_decision'];

export const DEFAULT_AI_EMPLOYEE_USERNAME = 'atlas';

export const DEFAULT_AI_EMPLOYEE_CONFIG = {
  username: DEFAULT_AI_EMPLOYEE_USERNAME,
  webSearch: false,
  requiresApproval: 'no_required',
} as const;
