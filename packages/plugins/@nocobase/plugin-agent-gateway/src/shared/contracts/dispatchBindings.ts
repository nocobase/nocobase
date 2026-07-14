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

export interface DispatchBindingMutationRequest {
  bindingKey?: string;
  collectionName?: string;
  outputAgentRunField?: string;
  promptTemplateId?: string;
  agentProfileId?: string;
  nodeId?: string;
  agentProfileField?: string;
  nodeField?: string;
  skillFieldsJson?: JsonRecord | string[];
  fieldMappingsJson?: JsonRecord | string[];
  filterJson?: JsonRecord;
  payloadMappingJson?: JsonRecord;
  metadataJson?: JsonRecord;
  triggerType?: string;
  sourceAction?: string;
  priority?: number;
  enabled?: boolean;
  status?: string;
}

export type CreateDispatchBindingRequest = DispatchBindingMutationRequest;
export type UpdateDispatchBindingRequest = DispatchBindingMutationRequest;

export interface DispatchBindingRequest {
  sourceRecordId?: string | number;
  sourceCollection?: string;
  idempotencyKey?: string;
}

export interface DispatchBindingDto extends AgentGatewayObjectDto {
  id?: string;
  bindingKey?: string;
  collectionName?: string;
  status?: string;
  enabled?: boolean;
}

export interface DispatchBindingResult extends AgentGatewayObjectDto {
  runId?: string;
  deduped?: boolean;
}

export type ListDispatchBindingsResponse = AgentGatewayCanonicalListResponse<DispatchBindingDto>;
export type GetDispatchBindingResponse = DispatchBindingDto;
export type CreateDispatchBindingResponse = DispatchBindingDto;
export type UpdateDispatchBindingResponse = DispatchBindingDto;
export type DestroyDispatchBindingResponse = DispatchBindingResult;
export type DispatchBindingResponse = DispatchBindingResult;

export interface DispatchBindingActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.listDispatchBindings]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getDispatchBinding]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.createDispatchBinding]: CreateDispatchBindingRequest;
  [AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding]: UpdateDispatchBindingRequest;
  [AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.dispatchBinding]: DispatchBindingRequest;
}

export interface DispatchBindingActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.listDispatchBindings]: ListDispatchBindingsResponse;
  [AGENT_GATEWAY_API_ACTIONS.getDispatchBinding]: GetDispatchBindingResponse;
  [AGENT_GATEWAY_API_ACTIONS.createDispatchBinding]: CreateDispatchBindingResponse;
  [AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding]: UpdateDispatchBindingResponse;
  [AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding]: DestroyDispatchBindingResponse;
  [AGENT_GATEWAY_API_ACTIONS.dispatchBinding]: DispatchBindingResponse;
}

const DISPATCH_BINDING_MUTATION_FIELDS = [
  'bindingKey',
  'collectionName',
  'outputAgentRunField',
  'promptTemplateId',
  'agentProfileId',
  'nodeId',
  'agentProfileField',
  'nodeField',
  'skillFieldsJson',
  'fieldMappingsJson',
  'filterJson',
  'payloadMappingJson',
  'metadataJson',
  'triggerType',
  'sourceAction',
  'priority',
  'enabled',
  'status',
] as const;

export const dispatchBindingContracts = {
  [AGENT_GATEWAY_API_ACTIONS.listDispatchBindings]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listDispatchBindings,
    AgentGatewayEmptyRequest,
    ListDispatchBindingsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listDispatchBindings, [], undefined, parseCanonicalListResponse<DispatchBindingDto>),
  [AGENT_GATEWAY_API_ACTIONS.getDispatchBinding]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getDispatchBinding,
    AgentGatewayEmptyRequest,
    GetDispatchBindingResponse
  >(AGENT_GATEWAY_API_ACTIONS.getDispatchBinding, []),
  [AGENT_GATEWAY_API_ACTIONS.createDispatchBinding]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createDispatchBinding,
    CreateDispatchBindingRequest,
    CreateDispatchBindingResponse
  >(AGENT_GATEWAY_API_ACTIONS.createDispatchBinding, DISPATCH_BINDING_MUTATION_FIELDS),
  [AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding,
    UpdateDispatchBindingRequest,
    UpdateDispatchBindingResponse
  >(AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding, DISPATCH_BINDING_MUTATION_FIELDS),
  [AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding,
    AgentGatewayEmptyRequest,
    DestroyDispatchBindingResponse
  >(AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding, []),
  [AGENT_GATEWAY_API_ACTIONS.dispatchBinding]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.dispatchBinding,
    DispatchBindingRequest,
    DispatchBindingResponse
  >(AGENT_GATEWAY_API_ACTIONS.dispatchBinding, ['sourceRecordId', 'sourceCollection', 'idempotencyKey']),
} as const satisfies AgentGatewayDomainContractMap<DispatchBindingActionRequestMap, DispatchBindingActionResponseMap>;
