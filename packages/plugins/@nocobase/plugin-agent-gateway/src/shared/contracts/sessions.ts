/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import type { AgentProviderKey } from '../providerCapabilities';
import {
  AGENT_GATEWAY_API_ACTIONS,
  createActionContract,
  type AgentGatewayDomainContractMap,
  type AgentGatewayObjectDto,
} from './common';
import type { RunLeaseRequest } from './runs';

export interface UpsertAgentSessionRequest extends RunLeaseRequest {
  provider: AgentProviderKey;
  providerSessionId: string;
  status?: string;
  capabilitiesJson?: JsonRecord;
  metadataJson?: JsonRecord;
}

export interface ResumeAgentSessionRequest {
  message?: string;
  idempotencyKey?: string;
  resumedFromRunId?: string;
}

export interface MessageAgentSessionRequest {
  message?: string;
}

export interface AgentSessionDto extends AgentGatewayObjectDto {
  id?: string;
  runId?: string;
  provider?: AgentProviderKey;
  providerSessionId?: string;
  status?: string;
}

export interface ResumeAgentSessionResponse extends AgentGatewayObjectDto {
  run?: AgentGatewayObjectDto;
  runId?: string;
  sessionId?: string;
  deduped?: boolean;
}

export type UpsertAgentSessionResponse = AgentSessionDto;
export type MessageAgentSessionResponse = AgentSessionDto;

export interface SessionActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.upsertAgentSession]: UpsertAgentSessionRequest;
  [AGENT_GATEWAY_API_ACTIONS.resumeAgentSession]: ResumeAgentSessionRequest;
  [AGENT_GATEWAY_API_ACTIONS.messageAgentSession]: MessageAgentSessionRequest;
}

export interface SessionActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.upsertAgentSession]: UpsertAgentSessionResponse;
  [AGENT_GATEWAY_API_ACTIONS.resumeAgentSession]: ResumeAgentSessionResponse;
  [AGENT_GATEWAY_API_ACTIONS.messageAgentSession]: MessageAgentSessionResponse;
}

export const sessionContracts = {
  [AGENT_GATEWAY_API_ACTIONS.upsertAgentSession]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.upsertAgentSession,
    UpsertAgentSessionRequest,
    UpsertAgentSessionResponse
  >(AGENT_GATEWAY_API_ACTIONS.upsertAgentSession, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'provider',
    'providerSessionId',
    'status',
    'capabilitiesJson',
    'metadataJson',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.resumeAgentSession]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
    ResumeAgentSessionRequest,
    ResumeAgentSessionResponse
  >(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, ['message', 'idempotencyKey', 'resumedFromRunId']),
  [AGENT_GATEWAY_API_ACTIONS.messageAgentSession]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.messageAgentSession,
    MessageAgentSessionRequest,
    MessageAgentSessionResponse
  >(AGENT_GATEWAY_API_ACTIONS.messageAgentSession, ['message']),
} as const satisfies AgentGatewayDomainContractMap<SessionActionRequestMap, SessionActionResponseMap>;
