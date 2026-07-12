/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  downloadSkillVersion: 'downloadSkillVersion',
  listRunOptions: 'listRunOptions',
  createTaskRun: 'createTaskRun',
  listRuns: 'listRuns',
  getRun: 'getRun',
  createRun: 'createRun',
  createSmokeRun: 'createSmokeRun',
  claimRun: 'claimRun',
  heartbeatRun: 'heartbeatRun',
  completeRun: 'completeRun',
  failRun: 'failRun',
  timeoutRun: 'timeoutRun',
  ackCancelRun: 'ackCancelRun',
  skipRun: 'skipRun',
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

export const AGENT_GATEWAY_MACHINE_API_ACTIONS = [
  AGENT_GATEWAY_API_ACTIONS.registerNode,
  AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
  AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall,
  AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion,
  AGENT_GATEWAY_API_ACTIONS.createSmokeRun,
  AGENT_GATEWAY_API_ACTIONS.claimRun,
  AGENT_GATEWAY_API_ACTIONS.heartbeatRun,
  AGENT_GATEWAY_API_ACTIONS.completeRun,
  AGENT_GATEWAY_API_ACTIONS.failRun,
  AGENT_GATEWAY_API_ACTIONS.timeoutRun,
  AGENT_GATEWAY_API_ACTIONS.ackCancelRun,
  AGENT_GATEWAY_API_ACTIONS.skipRun,
  AGENT_GATEWAY_API_ACTIONS.upsertAgentSession,
  AGENT_GATEWAY_API_ACTIONS.appendConversationEvents,
  AGENT_GATEWAY_API_ACTIONS.appendRunEvents,
  AGENT_GATEWAY_API_ACTIONS.registerRunArtifact,
  AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot,
  AGENT_GATEWAY_API_ACTIONS.updateRunTerminal,
  AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests,
  AGENT_GATEWAY_API_ACTIONS.ackControlRequest,
] as const;

export const AGENT_GATEWAY_MANAGE_API_ACTIONS = [
  AGENT_GATEWAY_API_ACTIONS.createNodeInvitation,
  AGENT_GATEWAY_API_ACTIONS.listNodes,
  AGENT_GATEWAY_API_ACTIONS.getNode,
  AGENT_GATEWAY_API_ACTIONS.updateNode,
  AGENT_GATEWAY_API_ACTIONS.listNodeProfiles,
  AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion,
  AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload,
  AGENT_GATEWAY_API_ACTIONS.listSkillVersions,
  AGENT_GATEWAY_API_ACTIONS.listRuns,
  AGENT_GATEWAY_API_ACTIONS.getRun,
  AGENT_GATEWAY_API_ACTIONS.createRun,
  AGENT_GATEWAY_API_ACTIONS.cancelRun,
  AGENT_GATEWAY_API_ACTIONS.expireRunLeases,
  AGENT_GATEWAY_API_ACTIONS.listTaskTemplates,
  AGENT_GATEWAY_API_ACTIONS.getTaskTemplate,
  AGENT_GATEWAY_API_ACTIONS.createTaskTemplate,
  AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate,
  AGENT_GATEWAY_API_ACTIONS.listPromptTemplates,
  AGENT_GATEWAY_API_ACTIONS.getPromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.createPromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.listDispatchBindings,
  AGENT_GATEWAY_API_ACTIONS.getDispatchBinding,
  AGENT_GATEWAY_API_ACTIONS.createDispatchBinding,
  AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding,
  AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding,
  AGENT_GATEWAY_API_ACTIONS.initFileUpload,
  AGENT_GATEWAY_API_ACTIONS.appendFileUpload,
  AGENT_GATEWAY_API_ACTIONS.completeFileUpload,
  AGENT_GATEWAY_API_ACTIONS.abortFileUpload,
  AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats,
] as const;

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
