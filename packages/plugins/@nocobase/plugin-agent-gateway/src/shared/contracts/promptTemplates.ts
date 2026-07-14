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

export interface PromptTemplateMutationRequest {
  templateKey?: string;
  displayName?: string;
  description?: string;
  templateText?: string;
  status?: string;
  variablesSchemaJson?: JsonRecord;
  defaultExecutionPayloadJson?: JsonRecord;
  metadataJson?: JsonRecord;
  defaultAgentProfileId?: string;
}

export type CreatePromptTemplateRequest = PromptTemplateMutationRequest;
export type UpdatePromptTemplateRequest = PromptTemplateMutationRequest;

export interface PreviewPromptTemplateRequest {
  templateId?: string;
  templateKey?: string;
  templateText?: string;
  collectionName?: string;
  recordId?: string | number;
}

export interface PromptTemplateDto extends AgentGatewayObjectDto {
  id?: string;
  templateKey?: string;
  displayName?: string;
  templateText?: string;
  status?: string;
}

export interface PromptTemplateMutationResult extends AgentGatewayObjectDto {
  destroyed?: boolean;
  id?: string;
}

export interface PreviewPromptTemplateResponse extends AgentGatewayObjectDto {
  prompt?: string;
  executionPayloadJson?: JsonRecord;
}

export type ListPromptTemplatesResponse = AgentGatewayCanonicalListResponse<PromptTemplateDto>;
export type GetPromptTemplateResponse = PromptTemplateDto;
export type CreatePromptTemplateResponse = PromptTemplateDto;
export type UpdatePromptTemplateResponse = PromptTemplateDto;
export type DestroyPromptTemplateResponse = PromptTemplateMutationResult;

export interface PromptTemplateActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.listPromptTemplates]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getPromptTemplate]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.createPromptTemplate]: CreatePromptTemplateRequest;
  [AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate]: UpdatePromptTemplateRequest;
  [AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate]: PreviewPromptTemplateRequest;
}

export interface PromptTemplateActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.listPromptTemplates]: ListPromptTemplatesResponse;
  [AGENT_GATEWAY_API_ACTIONS.getPromptTemplate]: GetPromptTemplateResponse;
  [AGENT_GATEWAY_API_ACTIONS.createPromptTemplate]: CreatePromptTemplateResponse;
  [AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate]: UpdatePromptTemplateResponse;
  [AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate]: DestroyPromptTemplateResponse;
  [AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate]: PreviewPromptTemplateResponse;
}

const PROMPT_TEMPLATE_MUTATION_FIELDS = [
  'templateKey',
  'displayName',
  'description',
  'templateText',
  'status',
  'variablesSchemaJson',
  'defaultExecutionPayloadJson',
  'metadataJson',
  'defaultAgentProfileId',
] as const;

export const promptTemplateContracts = {
  [AGENT_GATEWAY_API_ACTIONS.listPromptTemplates]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listPromptTemplates,
    AgentGatewayEmptyRequest,
    ListPromptTemplatesResponse
  >(AGENT_GATEWAY_API_ACTIONS.listPromptTemplates, [], undefined, parseCanonicalListResponse<PromptTemplateDto>),
  [AGENT_GATEWAY_API_ACTIONS.getPromptTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getPromptTemplate,
    AgentGatewayEmptyRequest,
    GetPromptTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.getPromptTemplate, []),
  [AGENT_GATEWAY_API_ACTIONS.createPromptTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createPromptTemplate,
    CreatePromptTemplateRequest,
    CreatePromptTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.createPromptTemplate, PROMPT_TEMPLATE_MUTATION_FIELDS),
  [AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate,
    UpdatePromptTemplateRequest,
    UpdatePromptTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate, PROMPT_TEMPLATE_MUTATION_FIELDS),
  [AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate,
    AgentGatewayEmptyRequest,
    DestroyPromptTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate, []),
  [AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate,
    PreviewPromptTemplateRequest,
    PreviewPromptTemplateResponse
  >(AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate, [
    'templateId',
    'templateKey',
    'templateText',
    'collectionName',
    'recordId',
  ]),
} as const satisfies AgentGatewayDomainContractMap<PromptTemplateActionRequestMap, PromptTemplateActionResponseMap>;
