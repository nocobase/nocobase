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
  AgentGatewayContractError,
  createActionContract,
  parseCanonicalListResponse,
  parseStrictObject,
  type AgentGatewayCanonicalListResponse,
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

export interface CanonicalObservationEvent {
  eventType: string;
  contentJson: JsonRecord;
}

export interface AppendObservationRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  events: CanonicalObservationEvent[];
}

export interface AppendRunEventRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  source: string;
  sequence: number;
  eventType: string;
  contentJson: JsonRecord;
  ingestId?: string;
  level?: string;
  message?: string;
  emittedAt?: string;
}

export interface RegisterRunArtifactRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  artifactKey?: string;
  artifactType?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceSha256?: string;
  uploadId?: string;
  contentText?: string;
  metadataJson?: JsonRecord;
}

export interface RegisterRunSnapshotRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  snapshotType: string;
  snapshotJson: JsonRecord;
  capturedAt?: string;
  metadataJson?: JsonRecord;
}

export interface CursorListQuery {
  pageSize?: number | string;
  limit?: number | string;
  beforeCursor?: string;
  afterCursor?: string;
}

export interface PaginationQuery {
  page?: number | string;
  pageSize?: number | string;
  limit?: number | string;
}

export interface ListRunToolCallsQuery {
  eventLimit?: number | string;
}

export interface ListToolCallStatsQuery extends ListRunToolCallsQuery {
  limit?: number | string;
}

export interface GetRunArtifactContentQuery {
  artifactId?: string;
}

export interface ObservationDto extends AgentGatewayObjectDto {
  id?: string;
  runId?: string;
  eventType?: string;
  contentJson?: JsonRecord;
}

export interface ArtifactContentResponse extends AgentGatewayObjectDto {
  contentText?: string;
  contentBase64?: string;
  mimeType?: string;
  fileName?: string;
}

export type AppendConversationEventsResponse = AgentGatewayObjectDto;
export type ListRunConversationEventsResponse = AgentGatewayCanonicalListResponse<ObservationDto>;
export type ListRunToolCallsResponse = AgentGatewayObjectDto;
export type ListToolCallStatsResponse = AgentGatewayObjectDto;
export type ListSessionConversationEventsResponse = AgentGatewayCanonicalListResponse<ObservationDto>;
export type AppendRunEventsResponse = AgentGatewayObjectDto;
export type RegisterRunArtifactResponse = AgentGatewayObjectDto;
export type RegisterRunSnapshotResponse = AgentGatewayObjectDto;
export type ListRunEventsResponse = AgentGatewayCanonicalListResponse<ObservationDto>;
export type ListRunArtifactsResponse = AgentGatewayCanonicalListResponse<ObservationDto>;
export type ListRunSnapshotsResponse = AgentGatewayCanonicalListResponse<ObservationDto>;
export type ListRunApiCallLogsResponse = AgentGatewayCanonicalListResponse<ObservationDto>;
export type GetRunArtifactContentResponse = ArtifactContentResponse;

export interface ObservationActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.appendConversationEvents]: AppendObservationRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRunToolCalls]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.listToolCallStats]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.appendRunEvents]: AppendRunEventRequest;
  [AGENT_GATEWAY_API_ACTIONS.registerRunArtifact]: RegisterRunArtifactRequest;
  [AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot]: RegisterRunSnapshotRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRunEvents]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRunArtifacts]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRunSnapshots]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent]: AgentGatewayEmptyRequest;
}

export interface ObservationActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.appendConversationEvents]: AppendConversationEventsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents]: ListRunConversationEventsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRunToolCalls]: ListRunToolCallsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listToolCallStats]: ListToolCallStatsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents]: ListSessionConversationEventsResponse;
  [AGENT_GATEWAY_API_ACTIONS.appendRunEvents]: AppendRunEventsResponse;
  [AGENT_GATEWAY_API_ACTIONS.registerRunArtifact]: RegisterRunArtifactResponse;
  [AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot]: RegisterRunSnapshotResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRunEvents]: ListRunEventsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRunArtifacts]: ListRunArtifactsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRunSnapshots]: ListRunSnapshotsResponse;
  [AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs]: ListRunApiCallLogsResponse;
  [AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent]: GetRunArtifactContentResponse;
}

function parseCanonicalEvents(value: JsonRecord) {
  if (!Array.isArray(value.events)) {
    throw new AgentGatewayContractError('events must be an array');
  }
  return {
    ...value,
    events: value.events.map((event, index) =>
      parseStrictObject(
        event,
        [
          'ingestId',
          'sessionIngestId',
          'sequence',
          'eventType',
          'level',
          'message',
          'contentJson',
          'contentText',
          'source',
          'providerEventId',
          'correlationId',
          'capturedAt',
          'emittedAt',
          'createdAt',
          'confidence',
          'sessionId',
        ],
        `events[${index}]`,
      ),
    ),
  } as unknown as AppendObservationRequest;
}

export const observationContracts = {
  [AGENT_GATEWAY_API_ACTIONS.appendRunEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.appendRunEvents,
    AppendRunEventRequest,
    AppendRunEventsResponse
  >(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'ingestId',
    'source',
    'sequence',
    'eventType',
    'level',
    'message',
    'contentJson',
    'emittedAt',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.appendConversationEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.appendConversationEvents,
    AppendObservationRequest,
    AppendConversationEventsResponse
  >(
    AGENT_GATEWAY_API_ACTIONS.appendConversationEvents,
    ['claimToken', 'claimAttempt', 'leaseVersion', 'events'],
    parseCanonicalEvents,
  ),
  [AGENT_GATEWAY_API_ACTIONS.registerRunArtifact]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.registerRunArtifact,
    RegisterRunArtifactRequest,
    RegisterRunArtifactResponse
  >(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'artifactKey',
    'artifactType',
    'fileName',
    'mimeType',
    'sizeBytes',
    'sourceSha256',
    'uploadId',
    'contentText',
    'metadataJson',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot,
    RegisterRunSnapshotRequest,
    RegisterRunSnapshotResponse
  >(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'snapshotType',
    'snapshotJson',
    'capturedAt',
    'metadataJson',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents,
    AgentGatewayEmptyRequest,
    ListRunConversationEventsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents, [], undefined, parseCanonicalListResponse<ObservationDto>),
  [AGENT_GATEWAY_API_ACTIONS.listRunToolCalls]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunToolCalls,
    AgentGatewayEmptyRequest,
    ListRunToolCallsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunToolCalls, []),
  [AGENT_GATEWAY_API_ACTIONS.listToolCallStats]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listToolCallStats,
    AgentGatewayEmptyRequest,
    ListToolCallStatsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listToolCallStats, []),
  [AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents,
    AgentGatewayEmptyRequest,
    ListSessionConversationEventsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents, [], undefined, parseCanonicalListResponse<ObservationDto>),
  [AGENT_GATEWAY_API_ACTIONS.listRunEvents]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunEvents,
    AgentGatewayEmptyRequest,
    ListRunEventsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunEvents, [], undefined, parseCanonicalListResponse<ObservationDto>),
  [AGENT_GATEWAY_API_ACTIONS.listRunArtifacts]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunArtifacts,
    AgentGatewayEmptyRequest,
    ListRunArtifactsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts, [], undefined, parseCanonicalListResponse<ObservationDto>),
  [AGENT_GATEWAY_API_ACTIONS.listRunSnapshots]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunSnapshots,
    AgentGatewayEmptyRequest,
    ListRunSnapshotsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots, [], undefined, parseCanonicalListResponse<ObservationDto>),
  [AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs,
    AgentGatewayEmptyRequest,
    ListRunApiCallLogsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs, [], undefined, parseCanonicalListResponse<ObservationDto>),
  [AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent,
    AgentGatewayEmptyRequest,
    GetRunArtifactContentResponse
  >(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent, []),
} as const satisfies AgentGatewayDomainContractMap<ObservationActionRequestMap, ObservationActionResponseMap>;
