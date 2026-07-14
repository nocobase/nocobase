/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import { getExplicitAgentProviderKey } from '../providerCapabilities';
import {
  AGENT_GATEWAY_API_ACTIONS,
  AgentGatewayContractError,
  createActionContract,
  type AgentGatewayDomainContractMap,
  type AgentGatewayObjectDto,
} from './common';

export interface ImportExternalRunRequest {
  provider: string;
  externalRunKey: string;
  batchKey?: string;
  runCode?: string;
  title?: string;
  instruction?: string;
  providerSessionId?: string;
  status?: string;
  requestedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  completedAt?: string;
  failedAt?: string;
  canceledAt?: string;
  errorSummary?: string;
  metadataJson?: JsonRecord;
  resultSummaryJson?: JsonRecord;
  sourceCollection?: string;
  sourceRecordId?: string | number;
  outputAgentRunField?: string;
  logs?: AgentGatewayObjectDto[];
  artifacts?: AgentGatewayObjectDto[];
  events?: AgentGatewayObjectDto[];
  conversationEvents?: AgentGatewayObjectDto[];
}

export type AppendExternalRunObservationsRequest = Omit<ImportExternalRunRequest, 'externalRunKey'>;

export interface ExternalRunImportResponse extends AgentGatewayObjectDto {
  runId?: string;
  created?: boolean;
  updated?: boolean;
}

export type ImportExternalRunResponse = ExternalRunImportResponse;
export type AppendExternalRunObservationsResponse = ExternalRunImportResponse;

export interface ImportActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.importExternalRun]: ImportExternalRunRequest;
  [AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations]: AppendExternalRunObservationsRequest;
}

export interface ImportActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.importExternalRun]: ImportExternalRunResponse;
  [AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations]: AppendExternalRunObservationsResponse;
}

const EXTERNAL_IMPORT_FIELDS = [
  'provider',
  'externalRunKey',
  'batchKey',
  'runCode',
  'title',
  'instruction',
  'providerSessionId',
  'status',
  'requestedAt',
  'startedAt',
  'finishedAt',
  'completedAt',
  'failedAt',
  'canceledAt',
  'errorSummary',
  'metadataJson',
  'resultSummaryJson',
  'sourceCollection',
  'sourceRecordId',
  'outputAgentRunField',
  'logs',
  'artifacts',
  'events',
  'conversationEvents',
] as const;

function parseExternalImportRequest(value: JsonRecord) {
  if (!getExplicitAgentProviderKey(value.provider)) {
    throw new AgentGatewayContractError('provider is required and must be canonical');
  }
  return value as unknown as ImportExternalRunRequest;
}

export const importContracts = {
  [AGENT_GATEWAY_API_ACTIONS.importExternalRun]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.importExternalRun,
    ImportExternalRunRequest,
    ImportExternalRunResponse
  >(AGENT_GATEWAY_API_ACTIONS.importExternalRun, EXTERNAL_IMPORT_FIELDS, parseExternalImportRequest),
  [AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations,
    AppendExternalRunObservationsRequest,
    AppendExternalRunObservationsResponse
  >(
    AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations,
    [
      'provider',
      'batchKey',
      'title',
      'instruction',
      'providerSessionId',
      'status',
      'requestedAt',
      'startedAt',
      'finishedAt',
      'completedAt',
      'failedAt',
      'canceledAt',
      'errorSummary',
      'metadataJson',
      'resultSummaryJson',
      'logs',
      'artifacts',
      'events',
      'conversationEvents',
    ] as const,
    (value) => parseExternalImportRequest(value) as unknown as AppendExternalRunObservationsRequest,
  ),
} as const satisfies AgentGatewayDomainContractMap<ImportActionRequestMap, ImportActionResponseMap>;
