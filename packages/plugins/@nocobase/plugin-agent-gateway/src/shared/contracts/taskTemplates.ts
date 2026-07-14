/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import {
  AGENT_GATEWAY_API_ACTIONS,
  createActionContract,
  parseCanonicalListResponse,
  type AgentGatewayCanonicalListResponse,
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

export interface TaskTemplateMutationRequest {
  templateKey?: string;
  displayName?: string;
  description?: string;
  status?: string;
  sort?: number;
  defaultTitle?: string;
  defaultPrompt?: string;
  cwd?: string;
  nodeId?: string;
  agentProfileId?: string;
  skillVersionIdsJson?: string[];
  artifactRoot?: string;
  artifactsJson?: JsonRecord[];
  metadataJson?: JsonRecord;
}

export type CreateTaskTemplateRequest = TaskTemplateMutationRequest;
export type UpdateTaskTemplateRequest = TaskTemplateMutationRequest;

export interface ListTaskTemplatesQuery {
  includeDisabled?: boolean | string;
  status?: string;
}

export interface TaskTemplateDto extends AgentGatewayObjectDto {
  id?: string;
  templateKey?: string;
  displayName?: string;
  status?: string;
  skillVersionIdsJson?: string[];
}

export type ListTaskTemplatesResponse = AgentGatewayCanonicalListResponse<TaskTemplateDto>;
export type GetTaskTemplateResponse = TaskTemplateDto;
export type CreateTaskTemplateResponse = TaskTemplateDto;
export type UpdateTaskTemplateResponse = TaskTemplateDto;

export interface TaskTemplateActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.listTaskTemplates]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getTaskTemplate]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.createTaskTemplate]: CreateTaskTemplateRequest;
  [AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate]: UpdateTaskTemplateRequest;
}

export interface TaskTemplateActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.listTaskTemplates]: ListTaskTemplatesResponse;
  [AGENT_GATEWAY_API_ACTIONS.getTaskTemplate]: GetTaskTemplateResponse;
  [AGENT_GATEWAY_API_ACTIONS.createTaskTemplate]: CreateTaskTemplateResponse;
  [AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate]: UpdateTaskTemplateResponse;
}

const TASK_TEMPLATE_MUTATION_FIELDS = [
  'templateKey',
  'displayName',
  'description',
  'status',
  'sort',
  'defaultTitle',
  'defaultPrompt',
  'cwd',
  'nodeId',
  'agentProfileId',
  'skillVersionIdsJson',
  'artifactRoot',
  'artifactsJson',
  'metadataJson',
] as const;

export const taskTemplateContracts = {
  [AGENT_GATEWAY_API_ACTIONS.listTaskTemplates]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listTaskTemplates,
    AgentGatewayEmptyRequest,
    ListTaskTemplatesResponse
  >(AGENT_GATEWAY_API_ACTIONS.listTaskTemplates, [], undefined, parseCanonicalListResponse<TaskTemplateDto>),
  [AGENT_GATEWAY_API_ACTIONS.getTaskTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getTaskTemplate,
    AgentGatewayEmptyRequest,
    GetTaskTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.getTaskTemplate, []),
  [AGENT_GATEWAY_API_ACTIONS.createTaskTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createTaskTemplate,
    CreateTaskTemplateRequest,
    CreateTaskTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.createTaskTemplate, TASK_TEMPLATE_MUTATION_FIELDS),
  [AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate,
    UpdateTaskTemplateRequest,
    UpdateTaskTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate, TASK_TEMPLATE_MUTATION_FIELDS),
} as const satisfies AgentGatewayDomainContractMap<TaskTemplateActionRequestMap, TaskTemplateActionResponseMap>;
