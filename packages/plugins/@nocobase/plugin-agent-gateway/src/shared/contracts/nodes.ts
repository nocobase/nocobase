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
  type AgentGatewayCanonicalListResponse,
  type AgentGatewayDomainContractMap,
  type AgentGatewayEmptyRequest,
  type AgentGatewayObjectDto,
} from './common';

const LEGACY_CAPABILITY_FIELDS = new Set(['supportsArtifacts', 'terminalStream', 'terminalInput', 'terminalControl']);

function assertCanonicalCapabilities(value: unknown, label: string) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
    return;
  }
  const legacyFields = Object.keys(value as JsonRecord).filter((field) => LEGACY_CAPABILITY_FIELDS.has(field));
  if (legacyFields.length) {
    throw new AgentGatewayContractError(`Legacy ${label} field is not allowed: ${legacyFields.sort().join(', ')}`);
  }
}

function parseNodeCapabilityRequest<Request extends RegisterNodeRequest | HeartbeatNodeRequest>(value: JsonRecord) {
  assertCanonicalCapabilities(value.capabilitiesJson, 'capabilitiesJson');
  if (Array.isArray(value.profiles)) {
    value.profiles.forEach((profile, index) => {
      if (profile && Object.prototype.toString.call(profile) === '[object Object]') {
        assertCanonicalCapabilities((profile as JsonRecord).capabilitiesJson, `profiles[${index}].capabilitiesJson`);
      }
    });
  }
  return value as unknown as Request;
}

export interface CreateNodeInvitationRequest {
  invitationKey?: string;
  expectedNodeKey?: string;
  serverUrl?: string;
  expiresInSeconds?: number;
  metadataJson?: JsonRecord;
}

export interface RegisterNodeRequest {
  inviteToken: string;
  nodeKey: string;
  installationId?: string;
  displayName?: string;
  daemonVersion?: string;
  hostInfo?: JsonRecord;
  capabilitiesJson?: JsonRecord;
}

export interface HeartbeatNodeRequest {
  installationId?: string;
  daemonVersion?: string;
  status?: string;
  currentConcurrency?: number;
  hostInfo?: JsonRecord;
  capabilitiesJson?: JsonRecord;
  metadataJson?: JsonRecord;
  profiles?: NodeProfileRegistrationDto[];
  profilesHash?: string;
}

export interface NodeProfileRegistrationDto {
  profileKey: string;
  provider: string;
  displayName: string;
  agentType: string;
  driver: string;
  status: string;
  capabilitiesJson: JsonRecord;
  metadataJson: JsonRecord;
}

export interface UpdateNodeRequest {
  displayName?: string;
  status?: string;
  metadataJson?: JsonRecord;
}

export interface NodeDto extends AgentGatewayObjectDto {
  id?: string;
  nodeKey?: string;
  displayName?: string;
  status?: string;
  capabilitiesJson?: JsonRecord;
  metadataJson?: JsonRecord;
}

export interface NodeProfileDto extends AgentGatewayObjectDto {
  id?: string;
  nodeId?: string;
  profileKey?: string;
  provider?: string;
  displayName?: string;
  status?: string;
  capabilitiesJson?: JsonRecord;
  runtimeSnapshotJson?: JsonRecord;
}

export interface CreateNodeInvitationResponse extends AgentGatewayObjectDto {
  invitationKey?: string;
  inviteToken?: string;
  expiresAt?: string;
}

export interface RegisterNodeResponse extends AgentGatewayObjectDto {
  nodeId: string;
  nodeKey: string;
  nodeToken: string;
  tokenLast4?: string;
  heartbeatIntervalSeconds: number;
  claimIntervalSeconds: number;
}

export interface HeartbeatNodeResponse extends AgentGatewayObjectDto {
  nodeId: string;
  status: string;
  heartbeatAt: string;
  heartbeatIntervalSeconds: number;
  claimIntervalSeconds: number;
}

export type ListNodesResponse = AgentGatewayCanonicalListResponse<NodeDto>;
export type GetNodeResponse = NodeDto;
export type UpdateNodeResponse = NodeDto;
export type ListNodeProfilesResponse = AgentGatewayCanonicalListResponse<NodeProfileDto>;

export interface NodeActionRequestMap {
  [AGENT_GATEWAY_API_ACTIONS.createNodeInvitation]: CreateNodeInvitationRequest;
  [AGENT_GATEWAY_API_ACTIONS.registerNode]: RegisterNodeRequest;
  [AGENT_GATEWAY_API_ACTIONS.heartbeatNode]: HeartbeatNodeRequest;
  [AGENT_GATEWAY_API_ACTIONS.listNodes]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.getNode]: AgentGatewayEmptyRequest;
  [AGENT_GATEWAY_API_ACTIONS.updateNode]: UpdateNodeRequest;
  [AGENT_GATEWAY_API_ACTIONS.listNodeProfiles]: AgentGatewayEmptyRequest;
}

export interface NodeActionResponseMap {
  [AGENT_GATEWAY_API_ACTIONS.createNodeInvitation]: CreateNodeInvitationResponse;
  [AGENT_GATEWAY_API_ACTIONS.registerNode]: RegisterNodeResponse;
  [AGENT_GATEWAY_API_ACTIONS.heartbeatNode]: HeartbeatNodeResponse;
  [AGENT_GATEWAY_API_ACTIONS.listNodes]: ListNodesResponse;
  [AGENT_GATEWAY_API_ACTIONS.getNode]: GetNodeResponse;
  [AGENT_GATEWAY_API_ACTIONS.updateNode]: UpdateNodeResponse;
  [AGENT_GATEWAY_API_ACTIONS.listNodeProfiles]: ListNodeProfilesResponse;
}

export const nodeContracts = {
  [AGENT_GATEWAY_API_ACTIONS.createNodeInvitation]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createNodeInvitation,
    CreateNodeInvitationRequest,
    CreateNodeInvitationResponse
  >(AGENT_GATEWAY_API_ACTIONS.createNodeInvitation, [
    'invitationKey',
    'expectedNodeKey',
    'serverUrl',
    'expiresInSeconds',
    'metadataJson',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.registerNode]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.registerNode,
    RegisterNodeRequest,
    RegisterNodeResponse
  >(
    AGENT_GATEWAY_API_ACTIONS.registerNode,
    ['inviteToken', 'nodeKey', 'installationId', 'displayName', 'daemonVersion', 'hostInfo', 'capabilitiesJson'],
    parseNodeCapabilityRequest<RegisterNodeRequest>,
  ),
  [AGENT_GATEWAY_API_ACTIONS.heartbeatNode]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
    HeartbeatNodeRequest,
    HeartbeatNodeResponse
  >(
    AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
    [
      'installationId',
      'daemonVersion',
      'status',
      'currentConcurrency',
      'hostInfo',
      'capabilitiesJson',
      'metadataJson',
      'profiles',
      'profilesHash',
    ],
    parseNodeCapabilityRequest<HeartbeatNodeRequest>,
  ),
  [AGENT_GATEWAY_API_ACTIONS.listNodes]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listNodes,
    AgentGatewayEmptyRequest,
    ListNodesResponse
  >(AGENT_GATEWAY_API_ACTIONS.listNodes, [], undefined, parseCanonicalListResponse<NodeDto>),
  [AGENT_GATEWAY_API_ACTIONS.getNode]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.getNode,
    AgentGatewayEmptyRequest,
    GetNodeResponse
  >(AGENT_GATEWAY_API_ACTIONS.getNode, []),
  [AGENT_GATEWAY_API_ACTIONS.updateNode]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.updateNode,
    UpdateNodeRequest,
    UpdateNodeResponse
  >(AGENT_GATEWAY_API_ACTIONS.updateNode, ['displayName', 'status', 'metadataJson']),
  [AGENT_GATEWAY_API_ACTIONS.listNodeProfiles]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.listNodeProfiles,
    AgentGatewayEmptyRequest,
    ListNodeProfilesResponse
  >(AGENT_GATEWAY_API_ACTIONS.listNodeProfiles, [], undefined, parseCanonicalListResponse<NodeProfileDto>),
} as const satisfies AgentGatewayDomainContractMap<NodeActionRequestMap, NodeActionResponseMap>;
