/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isJsonRecord, type JsonRecord } from '../json';

export const AGENT_GATEWAY_API_RESOURCE = 'agentGatewayApi' as const;

export const AGENT_GATEWAY_API_ACTIONS = {
  createNodeInvitation: 'createNodeInvitation',
  registerNode: 'registerNode',
  heartbeatNode: 'heartbeatNode',
  listNodes: 'listNodes',
  getNode: 'getNode',
  updateNode: 'updateNode',
  listNodeProfiles: 'listNodeProfiles',
  upsertNodeSkillInstall: 'upsertNodeSkillInstall',
  uploadSkillVersion: 'uploadSkillVersion',
  createSkillVersionFromUpload: 'createSkillVersionFromUpload',
  listSkillVersions: 'listSkillVersions',
  getSkillVersion: 'getSkillVersion',
  downloadSkillVersion: 'downloadSkillVersion',
  listRunOptions: 'listRunOptions',
  createTaskRun: 'createTaskRun',
  listRuns: 'listRuns',
  getRun: 'getRun',
  createRun: 'createRun',
  claimRun: 'claimRun',
  heartbeatRun: 'heartbeatRun',
  completeRun: 'completeRun',
  failRun: 'failRun',
  timeoutRun: 'timeoutRun',
  ackCancelRun: 'ackCancelRun',
  cancelRun: 'cancelRun',
  expireRunLeases: 'expireRunLeases',
  listTaskTemplates: 'listTaskTemplates',
  getTaskTemplate: 'getTaskTemplate',
  createTaskTemplate: 'createTaskTemplate',
  updateTaskTemplate: 'updateTaskTemplate',
  listPromptTemplates: 'listPromptTemplates',
  getPromptTemplate: 'getPromptTemplate',
  createPromptTemplate: 'createPromptTemplate',
  updatePromptTemplate: 'updatePromptTemplate',
  destroyPromptTemplate: 'destroyPromptTemplate',
  previewPromptTemplate: 'previewPromptTemplate',
  listDispatchBindings: 'listDispatchBindings',
  getDispatchBinding: 'getDispatchBinding',
  createDispatchBinding: 'createDispatchBinding',
  updateDispatchBinding: 'updateDispatchBinding',
  destroyDispatchBinding: 'destroyDispatchBinding',
  dispatchBinding: 'dispatchBinding',
  initFileUpload: 'initFileUpload',
  appendFileUpload: 'appendFileUpload',
  completeFileUpload: 'completeFileUpload',
  abortFileUpload: 'abortFileUpload',
  upsertAgentSession: 'upsertAgentSession',
  resumeAgentSession: 'resumeAgentSession',
  messageAgentSession: 'messageAgentSession',
  appendConversationEvents: 'appendConversationEvents',
  listRunConversationEvents: 'listRunConversationEvents',
  listRunToolCalls: 'listRunToolCalls',
  listToolCallStats: 'listToolCallStats',
  listSessionConversationEvents: 'listSessionConversationEvents',
  appendRunEvents: 'appendRunEvents',
  registerRunArtifact: 'registerRunArtifact',
  registerRunSnapshot: 'registerRunSnapshot',
  listRunEvents: 'listRunEvents',
  listRunArtifacts: 'listRunArtifacts',
  listRunSnapshots: 'listRunSnapshots',
  listRunApiCallLogs: 'listRunApiCallLogs',
  getRunArtifactContent: 'getRunArtifactContent',
  importExternalRun: 'importExternalRun',
  appendExternalRunObservations: 'appendExternalRunObservations',
  createTerminalStreamTicket: 'createTerminalStreamTicket',
  getTerminalSnapshot: 'getTerminalSnapshot',
  sendTerminalInput: 'sendTerminalInput',
  interruptTerminal: 'interruptTerminal',
  terminateTerminal: 'terminateTerminal',
  updateRunTerminal: 'updateRunTerminal',
  getControlRequestStatus: 'getControlRequestStatus',
  listPendingControlRequests: 'listPendingControlRequests',
  ackControlRequest: 'ackControlRequest',
  getTerminalStreamStats: 'getTerminalStreamStats',
} as const;

export type AgentGatewayApiAction = (typeof AGENT_GATEWAY_API_ACTIONS)[keyof typeof AGENT_GATEWAY_API_ACTIONS];

const AGENT_GATEWAY_API_ACTION_SET = new Set<string>(Object.values(AGENT_GATEWAY_API_ACTIONS));

export function isAgentGatewayApiAction(value: unknown): value is AgentGatewayApiAction {
  return typeof value === 'string' && AGENT_GATEWAY_API_ACTION_SET.has(value);
}

export class AgentGatewayContractError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'AgentGatewayContractError';
  }
}

export interface AgentGatewayActionContract<Action extends AgentGatewayApiAction, Request, Response> {
  action: Action;
  parseRequest(value: unknown): Request;
  parseResponse(value: unknown): Response;
}

export function parseObject(value: unknown, label: string): JsonRecord {
  if (!isJsonRecord(value)) {
    throw new AgentGatewayContractError(`${label} must be an object`);
  }
  return value;
}

export function parseResponseObject(value: unknown): JsonRecord {
  return parseObject(value, 'response');
}

export function parseStrictObject(value: unknown, allowedFields: readonly string[], label = 'request'): JsonRecord {
  const record = parseObject(value, label);
  const allowed = new Set(allowedFields);
  const unknownFields = Object.keys(record).filter((field) => !allowed.has(field));
  if (unknownFields.length) {
    throw new AgentGatewayContractError(`Unknown ${label} field: ${unknownFields.sort().join(', ')}`);
  }
  return record;
}

export function parseEmptyRequest(value: unknown): Record<string, never> {
  return parseStrictObject(value, []) as Record<string, never>;
}

export function createActionContract<
  Action extends AgentGatewayApiAction,
  Request extends JsonRecord,
  Response extends JsonRecord,
>(
  action: Action,
  allowedFields: readonly (keyof Request & string)[],
  parseRequestFields?: (value: JsonRecord) => Request,
): AgentGatewayActionContract<Action, Request, Response> {
  return {
    action,
    parseRequest(value) {
      const request = parseStrictObject(value, allowedFields);
      return parseRequestFields ? parseRequestFields(request) : (request as Request);
    },
    parseResponse(value) {
      return parseResponseObject(value) as Response;
    },
  };
}

export interface AgentGatewayPaginationMeta {
  count: number;
  page: number;
  pageSize: number;
  totalPage: number;
}

export function getAgentGatewayApiActionName(action: AgentGatewayApiAction) {
  return `${AGENT_GATEWAY_API_RESOURCE}:${action}`;
}

export function getAgentGatewayApiUrl(action: AgentGatewayApiAction, targetKey?: string | number) {
  const suffix = targetKey === undefined ? '' : `/${encodeURIComponent(String(targetKey))}`;
  return `${getAgentGatewayApiActionName(action)}${suffix}`;
}

export function getAgentGatewayApiPath(action: AgentGatewayApiAction, targetKey?: string | number) {
  return `/api/${getAgentGatewayApiUrl(action, targetKey)}`;
}

export const AGENT_GATEWAY_BOOTSTRAP_PATH = '/api/agent-gateway/bootstrap.sh';
export const AGENT_GATEWAY_DAEMON_PACKAGE_PATH = '/api/agent-gateway/daemon-package.tgz';
export const AGENT_GATEWAY_TERMINAL_WEBSOCKET_PATH = '/ws/agent-gateway/terminal';
