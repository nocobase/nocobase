/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SkillSettings } from '../ai-employees/types';

export type AIWorkflowGroup = 'ai';

export type WorkflowNodeVariableOption = {
  label: string;
  value: string;
  children?: WorkflowNodeVariableOption[];
};

export type JsonSchema = {
  title?: string;
  description?: string;
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: string[];
  enum?: unknown[];
  additionalProperties?: boolean | JsonSchema;
  [key: string]: unknown;
};

export type LLMMessageRole = 'system' | 'user' | 'assistant';

export type LLMMessageContentType = 'text' | 'image_url' | 'image_base64';

export type LLMTextContent = {
  type: 'text';
  text?: string;
};

export type LLMImageUrlContent = {
  type: 'image_url';
  image_url?: string;
};

export type LLMImageBase64Content = {
  type: 'image_base64';
  image_base64?: string;
};

export type LLMMessageContent = LLMTextContent | LLMImageUrlContent | LLMImageBase64Content;

export type LLMMessage = {
  role?: LLMMessageRole;
  content?: string | LLMMessageContent[];
};

export type LLMStructuredOutputConfig = {
  schema?: string | JsonSchema;
  name?: string;
  description?: string;
  strict?: boolean;
};

export type LLMModelOptions = {
  model?: string;
  frequencyPenalty?: number;
  maxCompletionTokens?: number;
  presencePenalty?: number;
  responseFormat?: string;
  temperature?: number;
  timeout?: number;
  maxRetries?: number;
  topP?: number;
  maxOutputTokens?: number;
  topK?: number;
  numPredict?: number;
  [key: string]: unknown;
};

export type LLMInstructionConfig = {
  llmService?: string;
  messages?: LLMMessage[];
  structuredOutput?: LLMStructuredOutputConfig;
} & LLMModelOptions;

export type AIEmployeeModelOverride = {
  llmService?: string;
  model?: string;
};

export type AIEmployeeTaskMessage = {
  system?: string;
  user?: string;
};

export type AIEmployeeFileInputType = 'attachments' | 'file_id' | 'file_url';

export type AIEmployeeFileInput = {
  type: AIEmployeeFileInputType;
  collection?: string;
  value?: string;
};

export type AIEmployeeStructuredOutputConfig = {
  schema?: string | JsonSchema;
};

export type AIEmployeeApprovalMode = 'no_required' | 'ai_decision' | 'human_decision';

export type LegacyAIEmployeeApprovalValue = boolean | AIEmployeeApprovalMode;

export type AIEmployeeAssigneeCondition = unknown[];

export type AIEmployeeInstructionConfig = {
  username?: string;
  model?: AIEmployeeModelOverride | null;
  userId?: string | number | Array<string | number>;
  message?: AIEmployeeTaskMessage;
  files?: AIEmployeeFileInput[];
  skillSettings?: SkillSettings;
  webSearch?: boolean;
  structuredOutput?: AIEmployeeStructuredOutputConfig;
  requiresApproval?: LegacyAIEmployeeApprovalValue;
  assignees?: AIEmployeeAssigneeCondition[];
};

export type TriggerParameterType = 'string' | 'number' | 'boolean' | 'enum';

export type AIEmployeeTriggerParameter = {
  name: string;
  type: TriggerParameterType;
  description?: string;
  enumOptions?: string[];
  required?: boolean;
};

export type AIEmployeeTriggerConfig = {
  parameters?: AIEmployeeTriggerParameter[];
};

export type WorkflowInstructionNode<TConfig = Record<string, unknown>> = {
  key: string;
  title?: string;
  config?: TConfig;
};
