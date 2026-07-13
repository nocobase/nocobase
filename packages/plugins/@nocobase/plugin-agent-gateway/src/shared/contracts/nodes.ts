/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import { AGENT_GATEWAY_API_ACTIONS, createActionContract } from './common';

export interface CreateNodeInvitationRequest extends JsonRecord {
  invitationKey?: string;
  expectedNodeKey?: string;
  serverUrl?: string;
  expiresInSeconds?: number;
  metadataJson?: JsonRecord;
}

export interface RegisterNodeRequest extends JsonRecord {
  inviteToken: string;
  nodeKey: string;
  installationId?: string;
  displayName?: string;
  daemonVersion?: string;
  hostInfo?: JsonRecord;
  capabilitiesJson?: JsonRecord;
}

export interface HeartbeatNodeRequest extends JsonRecord {
  installationId?: string;
  daemonVersion?: string;
  status?: string;
  currentConcurrency?: number;
  hostInfo?: JsonRecord;
  capabilitiesJson?: JsonRecord;
  metadataJson?: JsonRecord;
  profiles?: JsonRecord[];
  profilesHash?: string;
}

export type NodeActionResponse = JsonRecord;

export const nodeContracts = {
  [AGENT_GATEWAY_API_ACTIONS.createNodeInvitation]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.createNodeInvitation,
    CreateNodeInvitationRequest,
    NodeActionResponse
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
    NodeActionResponse
  >(AGENT_GATEWAY_API_ACTIONS.registerNode, [
    'inviteToken',
    'nodeKey',
    'installationId',
    'displayName',
    'daemonVersion',
    'hostInfo',
    'capabilitiesJson',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.heartbeatNode]: createActionContract<
    typeof AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
    HeartbeatNodeRequest,
    NodeActionResponse
  >(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, [
    'installationId',
    'daemonVersion',
    'status',
    'currentConcurrency',
    'hostInfo',
    'capabilitiesJson',
    'metadataJson',
    'profiles',
    'profilesHash',
  ]),
  [AGENT_GATEWAY_API_ACTIONS.updateNode]: createActionContract(AGENT_GATEWAY_API_ACTIONS.updateNode, [
    'displayName',
    'status',
    'metadataJson',
  ] as const),
} as const;
