/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  dispatchBindingContracts,
  type DispatchBindingActionRequestMap,
  type DispatchBindingActionResponseMap,
} from './dispatchBindings';
import { importContracts } from './imports';
import type { ImportActionRequestMap, ImportActionResponseMap } from './imports';
import { nodeContracts, type NodeActionRequestMap, type NodeActionResponseMap } from './nodes';
import {
  observationContracts,
  type CursorListQuery,
  type GetRunArtifactContentQuery,
  type ListRunToolCallsQuery,
  type ListToolCallStatsQuery,
  type ObservationActionRequestMap,
  type ObservationActionResponseMap,
  type PaginationQuery,
} from './observations';
import {
  promptTemplateContracts,
  type PromptTemplateActionRequestMap,
  type PromptTemplateActionResponseMap,
} from './promptTemplates';
import { runContracts, type ListRunsQuery, type RunActionRequestMap, type RunActionResponseMap } from './runs';
import { sessionContracts, type SessionActionRequestMap, type SessionActionResponseMap } from './sessions';
import {
  skillContracts,
  type DownloadSkillVersionQuery,
  type ListSkillVersionsQuery,
  type SkillActionRequestMap,
  type SkillActionResponseMap,
} from './skills';
import {
  taskTemplateContracts,
  type ListTaskTemplatesQuery,
  type TaskTemplateActionRequestMap,
  type TaskTemplateActionResponseMap,
} from './taskTemplates';
import {
  terminalContracts,
  type GetTerminalSnapshotQuery,
  type TerminalActionRequestMap,
  type TerminalActionResponseMap,
} from './terminal';
import { uploadContracts, type UploadActionRequestMap, type UploadActionResponseMap } from './uploads';
import {
  AGENT_GATEWAY_API_ACTIONS,
  AgentGatewayContractError,
  parseStrictObject,
  type AgentGatewayActionContract,
  type AgentGatewayApiAction,
  type AgentGatewayEmptyRequest,
} from './common';

export * from './common';
export * from './acceptance';
export * from './imports';
export * from './nodes';
export * from './observations';
export * from './promptTemplates';
export * from './runs';
export * from './sessions';
export * from './skills';
export * from './taskTemplates';
export * from './terminal';
export * from './uploads';
export * from './dispatchBindings';

export interface AgentGatewayActionRequestMap
  extends NodeActionRequestMap,
    SkillActionRequestMap,
    RunActionRequestMap,
    TaskTemplateActionRequestMap,
    PromptTemplateActionRequestMap,
    DispatchBindingActionRequestMap,
    UploadActionRequestMap,
    SessionActionRequestMap,
    ObservationActionRequestMap,
    ImportActionRequestMap,
    TerminalActionRequestMap {}

export interface AgentGatewayActionResponseMap
  extends NodeActionResponseMap,
    SkillActionResponseMap,
    RunActionResponseMap,
    TaskTemplateActionResponseMap,
    PromptTemplateActionResponseMap,
    DispatchBindingActionResponseMap,
    UploadActionResponseMap,
    SessionActionResponseMap,
    ObservationActionResponseMap,
    ImportActionResponseMap,
    TerminalActionResponseMap {}

export type AgentGatewayActionRequest<Action extends AgentGatewayApiAction> = AgentGatewayActionRequestMap[Action];
export type AgentGatewayActionResponse<Action extends AgentGatewayApiAction> = AgentGatewayActionResponseMap[Action];

export type AgentGatewayActionQueryMap = {
  [Action in AgentGatewayApiAction]: Action extends typeof AGENT_GATEWAY_API_ACTIONS.listSkillVersions
    ? ListSkillVersionsQuery
    : Action extends typeof AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion
      ? DownloadSkillVersionQuery
      : Action extends typeof AGENT_GATEWAY_API_ACTIONS.listRuns
        ? ListRunsQuery
        : Action extends typeof AGENT_GATEWAY_API_ACTIONS.listTaskTemplates
          ? ListTaskTemplatesQuery
          : Action extends
                | typeof AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents
                | typeof AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents
                | typeof AGENT_GATEWAY_API_ACTIONS.listRunEvents
            ? CursorListQuery
            : Action extends typeof AGENT_GATEWAY_API_ACTIONS.listRunToolCalls
              ? ListRunToolCallsQuery
              : Action extends typeof AGENT_GATEWAY_API_ACTIONS.listToolCallStats
                ? ListToolCallStatsQuery
                : Action extends
                      | typeof AGENT_GATEWAY_API_ACTIONS.listRunArtifacts
                      | typeof AGENT_GATEWAY_API_ACTIONS.listRunSnapshots
                      | typeof AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs
                  ? PaginationQuery
                  : Action extends typeof AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent
                    ? GetRunArtifactContentQuery
                    : Action extends typeof AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot
                      ? GetTerminalSnapshotQuery
                      : Action extends typeof AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats
                        ? import('./terminal').GetTerminalStreamStatsQuery
                        : Action extends typeof AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus
                          ? import('./terminal').GetControlRequestStatusRequest
                          : AgentGatewayEmptyRequest;
};

export type AgentGatewayActionQuery<Action extends AgentGatewayApiAction> = AgentGatewayActionQueryMap[Action];

const queryContractFields: Partial<Record<AgentGatewayApiAction, readonly string[]>> = {
  [AGENT_GATEWAY_API_ACTIONS.listSkillVersions]: ['page', 'pageSize', 'limit'],
  [AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion]: ['runId', 'claimAttempt', 'sha256'],
  [AGENT_GATEWAY_API_ACTIONS.listRuns]: [
    'filter',
    'sort',
    'page',
    'pageSize',
    'limit',
    'status',
    'nodeId',
    'agentProfileId',
    'taskTemplateId',
    'createdAtFrom',
    'createdAtTo',
  ],
  [AGENT_GATEWAY_API_ACTIONS.listTaskTemplates]: ['includeDisabled', 'status'],
  [AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents]: ['pageSize', 'limit', 'beforeCursor', 'afterCursor'],
  [AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents]: ['pageSize', 'limit', 'beforeCursor', 'afterCursor'],
  [AGENT_GATEWAY_API_ACTIONS.listRunToolCalls]: ['eventLimit'],
  [AGENT_GATEWAY_API_ACTIONS.listRunEvents]: ['pageSize', 'limit', 'beforeCursor', 'afterCursor'],
  [AGENT_GATEWAY_API_ACTIONS.listRunArtifacts]: ['page', 'pageSize', 'limit'],
  [AGENT_GATEWAY_API_ACTIONS.listRunSnapshots]: ['page', 'pageSize', 'limit'],
  [AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs]: ['page', 'pageSize', 'limit'],
  [AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent]: ['artifactId'],
  [AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot]: ['lines'],
  [AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats]: ['runId', 'nodeId'],
  [AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus]: ['requestId'],
  [AGENT_GATEWAY_API_ACTIONS.listToolCallStats]: ['limit', 'eventLimit'],
};

export type AgentGatewayActionContractMap = {
  [Action in AgentGatewayApiAction]: AgentGatewayActionContract<
    Action,
    AgentGatewayActionRequest<Action>,
    AgentGatewayActionResponse<Action>
  >;
};

export const AGENT_GATEWAY_API_CONTRACTS = {
  ...nodeContracts,
  ...runContracts,
  ...observationContracts,
  ...importContracts,
  ...skillContracts,
  ...terminalContracts,
  ...uploadContracts,
  ...sessionContracts,
  ...taskTemplateContracts,
  ...promptTemplateContracts,
  ...dispatchBindingContracts,
} as const satisfies AgentGatewayActionContractMap;

export function parseAgentGatewayActionRequest<Action extends AgentGatewayApiAction>(
  action: Action,
  value: unknown,
): AgentGatewayActionRequest<Action> {
  const contract = AGENT_GATEWAY_API_CONTRACTS[action];
  if (!contract) {
    throw new AgentGatewayContractError(`Unknown Agent Gateway action: ${action}`);
  }
  return contract.parseRequest(value) as AgentGatewayActionRequest<Action>;
}

export function parseAgentGatewayActionQuery<Action extends AgentGatewayApiAction>(
  action: Action,
  value: unknown,
): AgentGatewayActionQuery<Action> {
  if (!AGENT_GATEWAY_API_CONTRACTS[action]) {
    throw new AgentGatewayContractError(`Unknown Agent Gateway action: ${action}`);
  }
  return parseStrictObject(value, queryContractFields[action] || [], 'query') as AgentGatewayActionQuery<Action>;
}

export function parseAgentGatewayActionResponse<Action extends AgentGatewayApiAction>(
  action: Action,
  value: unknown,
): AgentGatewayActionResponse<Action> {
  const contract = AGENT_GATEWAY_API_CONTRACTS[action];
  if (!contract) {
    throw new AgentGatewayContractError(`Unknown Agent Gateway action: ${action}`);
  }
  return contract.parseResponse(value) as AgentGatewayActionResponse<Action>;
}
