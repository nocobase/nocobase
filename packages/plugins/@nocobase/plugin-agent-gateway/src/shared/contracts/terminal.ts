/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import type { RunLeaseRequest } from './runs';
import {
  AGENT_GATEWAY_API_ACTIONS,
  createActionContract,
  parseNullableCanonicalResponseObject,
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

export interface UpdateRunTerminalRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  terminalBackend?: string;
  terminalSessionName?: string;
  terminalStatus?: string;
  terminalExitCode?: number | null;
  terminalStartedAt?: string;
  terminalEndedAt?: string;
  terminalLastActivityAt?: string;
}

export interface AckControlRequest {
  claimToken: string;
  claimAttempt: number;
  leaseVersion: number;
  requestId: string;
  status: 'delivered' | 'succeeded' | 'failed';
  reason?: string;
  resultMessage?: string;
}

export interface CreateTerminalStreamTicketRequest {
  purpose?: string;
}

export interface GetTerminalSnapshotQuery {
  lines?: number | string;
}

export interface GetTerminalStreamStatsQuery {
  runId?: string;
  nodeId?: string;
}

export interface SendTerminalInputRequest {
  input?: string;
  appendEnter?: boolean;
}

export interface TerminalControlRequest {
  reason?: string;
  idempotencyKey?: string;
}

export interface GetControlRequestStatusRequest {
  requestId?: string;
}

export type ListPendingControlRequestsRequest = RunLeaseRequest;

export interface TerminalStreamTicketResponse extends AgentGatewayObjectDto {
  ticket?: string;
  expiresAt?: string;
}

export interface TerminalSnapshotResponse extends AgentGatewayObjectDto {
  contentText?: string;
  terminalStatus?: string;
}

export interface ControlRequestResponse extends AgentGatewayObjectDto {
  id?: string;
  requestId?: string;
  status?: string;
  action?: string;
}

export interface PendingControlRequestsResponse extends AgentGatewayObjectDto {
  requests?: ControlRequestResponse[];
}

export type SendTerminalInputResponse = ControlRequestResponse;
export type InterruptTerminalResponse = ControlRequestResponse;
export type TerminateTerminalResponse = ControlRequestResponse;
export type UpdateRunTerminalResponse = AgentGatewayObjectDto;
export type GetControlRequestStatusResponse = ControlRequestResponse;
export type AckControlRequestResponse = AgentGatewayObjectDto;
export type GetTerminalStreamStatsResponse = AgentGatewayObjectDto;

export interface TerminalActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket]: CreateTerminalStreamTicketRequest;
  [AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.sendTerminalInput]: SendTerminalInputRequest;
  [AGENT_GATEWAY_API_ACTIONS.interruptTerminal]: TerminalControlRequest;
  [AGENT_GATEWAY_API_ACTIONS.terminateTerminal]: TerminalControlRequest;
  [AGENT_GATEWAY_API_ACTIONS.updateRunTerminal]: UpdateRunTerminalRequest;
  [AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus]: GetControlRequestStatusRequest;
  [AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests]: ListPendingControlRequestsRequest;
  [AGENT_GATEWAY_API_ACTIONS.ackControlRequest]: AckControlRequest;
  [AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats]: AgentGatewayEmptyRequest;
}

export interface TerminalActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket]: TerminalStreamTicketResponse;
  [AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot]: TerminalSnapshotResponse | null;
  [AGENT_GATEWAY_API_ACTIONS.sendTerminalInput]: SendTerminalInputResponse;
  [AGENT_GATEWAY_API_ACTIONS.interruptTerminal]: InterruptTerminalResponse;
  [AGENT_GATEWAY_API_ACTIONS.terminateTerminal]: TerminateTerminalResponse;
  [AGENT_GATEWAY_API_ACTIONS.updateRunTerminal]: UpdateRunTerminalResponse;
  [AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus]: GetControlRequestStatusResponse;
  [AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests]: PendingControlRequestsResponse;
  [AGENT_GATEWAY_API_ACTIONS.ackControlRequest]: AckControlRequestResponse;
  [AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats]: GetTerminalStreamStatsResponse;
}

export const terminalContracts = {
  [AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket,
    CreateTerminalStreamTicketRequest,
    TerminalStreamTicketResponse
  >(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, ['purpose'] as const),
  [AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot,
    AgentGatewayEmptyRequest,
    TerminalSnapshotResponse | null
  >(
    AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot,
    [],
    undefined,
    parseNullableCanonicalResponseObject<TerminalSnapshotResponse>,
  ),
  [AGENT_GATEWAY_API_ACTIONS.sendTerminalInput]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.sendTerminalInput,
    SendTerminalInputRequest,
    SendTerminalInputResponse
  >(AGENT_GATEWAY_API_ACTIONS.sendTerminalInput, ['input', 'appendEnter'] as const),
  [AGENT_GATEWAY_API_ACTIONS.interruptTerminal]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.interruptTerminal,
    TerminalControlRequest,
    InterruptTerminalResponse
  >(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, ['reason', 'idempotencyKey'] as const),
  [AGENT_GATEWAY_API_ACTIONS.terminateTerminal]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.terminateTerminal,
    TerminalControlRequest,
    TerminateTerminalResponse
  >(AGENT_GATEWAY_API_ACTIONS.terminateTerminal, ['reason', 'idempotencyKey'] as const),
  [AGENT_GATEWAY_API_ACTIONS.updateRunTerminal]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.updateRunTerminal,
    UpdateRunTerminalRequest,
    UpdateRunTerminalResponse
  >(AGENT_GATEWAY_API_ACTIONS.updateRunTerminal, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'terminalBackend',
    'terminalSessionName',
    'terminalStatus',
    'terminalExitCode',
    'terminalStartedAt',
    'terminalEndedAt',
    'terminalLastActivityAt',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.ackControlRequest]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.ackControlRequest,
    AckControlRequest,
    AckControlRequestResponse
  >(AGENT_GATEWAY_API_ACTIONS.ackControlRequest, [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'requestId',
    'status',
    'reason',
    'resultMessage',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus,
    GetControlRequestStatusRequest,
    GetControlRequestStatusResponse
  >(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, ['requestId']),
  [AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests,
    ListPendingControlRequestsRequest,
    PendingControlRequestsResponse
  >(AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests, ['claimToken', 'claimAttempt', 'leaseVersion']),
  [AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats,
    AgentGatewayEmptyRequest,
    GetTerminalStreamStatsResponse
  >(AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats, []),
} as const satisfies AgentGatewayDomainContractMap<TerminalActionRequestMap, TerminalActionResponseMap>;
