/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AGENT_GATEWAY_API_ACTIONS,
  AGENT_GATEWAY_MANAGE_API_ACTIONS,
  getAgentGatewayApiActionName,
} from '../../shared/apiContract';

export const AGENT_GATEWAY_RESOURCE = 'agentGateway';

export const AGENT_GATEWAY_PERMISSIONS = {
  manage: 'agentGateway.manage',
  dispatch: 'agentGateway.dispatchRun',
  readRuns: 'agentGateway.readRuns',
  readRun: 'agentGateway.readRun',
  readRunDetails: 'agentGateway.readRunDetails',
  readSessionMessages: 'agentGateway.readSessionMessages',
  readTerminal: 'agentGateway.readTerminal',
  resumeAgentSession: 'agentGateway.resumeAgentSession',
  messageAgentSession: 'agentGateway.messageAgentSession',
  interruptRun: 'agentGateway.interruptRun',
  terminateRun: 'agentGateway.terminateRun',
  readArtifacts: 'agentGateway.readArtifacts',
  readRawLogs: 'agentGateway.readRawLogs',
  importExternalRuns: 'agentGateway.importExternalRuns',
  writeTerminalRaw: 'agentGateway.writeTerminalRaw',
  cancelRun: 'agentGateway.cancelRun',
} as const;

export const AGENT_GATEWAY_ACTIONS = {
  manage: 'manage',
  dispatch: 'dispatch',
  readRuns: 'readRuns',
  readRun: 'readRun',
  readRunDetails: 'readRunDetails',
  readSessionMessages: 'readSessionMessages',
  readTerminal: 'readTerminal',
  resumeAgentSession: 'resumeAgentSession',
  messageAgentSession: 'messageAgentSession',
  interruptRun: 'interruptRun',
  terminateRun: 'terminateRun',
  readArtifacts: 'readArtifacts',
  readRawLogs: 'readRawLogs',
  importExternalRuns: 'importExternalRuns',
  writeTerminalRaw: 'writeTerminalRaw',
  cancelRun: 'cancelRun',
} as const;

export const AGENT_GATEWAY_INTERNAL_COLLECTIONS = [
  'agNodes',
  'agNodeInvitations',
  'agAgentProfiles',
  'agAgentSessions',
  'agAgentConversationEvents',
  'agSkills',
  'agSkillVersions',
  'agNodeSkillInstalls',
  'agTaskTemplates',
  'agPromptTemplates',
  'agDispatchBindings',
  'agRuns',
  'agRunEvents',
  'agRunArtifacts',
  'agRunSnapshots',
  'agApiCallLogs',
  'agRunControlRequests',
  'agTerminalStreamTickets',
  'agEventIngestSequences',
  'agExternalRunIdentities',
  'agExternalImportBatches',
  'agFileUploads',
] as const;

const AGENT_GATEWAY_INTERNAL_COLLECTION_ACTIONS = AGENT_GATEWAY_INTERNAL_COLLECTIONS.map(
  (collectionName) => `${collectionName}:*`,
);

const RUN_DETAIL_READ_ACTIONS = [
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRunDetails}`,
  'agRuns:list',
  'agRuns:get',
] as const;

const RUN_CONTROL_ACTIONS = [
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.cancelRun}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.interruptRun}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.terminateRun}`,
] as const;

const RUN_CANCEL_ACTIONS = [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.cancelRun}`, 'agRuns:get'] as const;

const MANAGE_API_ACTIONS = AGENT_GATEWAY_MANAGE_API_ACTIONS.map(getAgentGatewayApiActionName);
const apiAction = getAgentGatewayApiActionName;
const MANAGE_DELEGATED_API_ACTIONS = [
  AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents,
  AGENT_GATEWAY_API_ACTIONS.listRunToolCalls,
  AGENT_GATEWAY_API_ACTIONS.listToolCallStats,
  AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents,
  AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot,
  AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket,
  AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
  AGENT_GATEWAY_API_ACTIONS.messageAgentSession,
  AGENT_GATEWAY_API_ACTIONS.interruptTerminal,
  AGENT_GATEWAY_API_ACTIONS.terminateTerminal,
  AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus,
  AGENT_GATEWAY_API_ACTIONS.listRunEvents,
  AGENT_GATEWAY_API_ACTIONS.listRunArtifacts,
  AGENT_GATEWAY_API_ACTIONS.listRunSnapshots,
  AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs,
  AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent,
  AGENT_GATEWAY_API_ACTIONS.importExternalRun,
  AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations,
].map(apiAction);

export const AGENT_GATEWAY_PERMISSION_DEFINITIONS = [
  {
    name: AGENT_GATEWAY_PERMISSIONS.manage,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`,
      ...RUN_DETAIL_READ_ACTIONS,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readSessionMessages}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readTerminal}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readArtifacts}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRawLogs}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.importExternalRuns}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.resumeAgentSession}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.messageAgentSession}`,
      ...RUN_CONTROL_ACTIONS,
      ...MANAGE_API_ACTIONS,
      ...MANAGE_DELEGATED_API_ACTIONS,
      ...AGENT_GATEWAY_INTERNAL_COLLECTION_ACTIONS,
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.dispatch,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.dispatch}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunOptions),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listTaskTemplates),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.dispatchBinding),
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRuns,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRuns),
      'agRuns:list',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRun,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRuns),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getRun),
      'agRuns:list',
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRunDetails,
    actions: RUN_DETAIL_READ_ACTIONS,
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readSessionMessages,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readSessionMessages}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents),
      apiAction(AGENT_GATEWAY_API_ACTIONS.listRunToolCalls),
      apiAction(AGENT_GATEWAY_API_ACTIONS.listToolCallStats),
      apiAction(AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readTerminal,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readTerminal}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot),
      apiAction(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket),
      apiAction(AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.resumeAgentSession,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.resumeAgentSession}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.messageAgentSession,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.messageAgentSession}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.messageAgentSession),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.interruptRun,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.interruptRun}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.interruptTerminal),
      apiAction(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.terminateRun,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.terminateRun}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.terminateTerminal),
      apiAction(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readArtifacts,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readArtifacts}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts),
      apiAction(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRawLogs,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRawLogs}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.listRunEvents),
      apiAction(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots),
      apiAction(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs),
      'agRuns:get',
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.importExternalRuns,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.importExternalRuns}`,
      apiAction(AGENT_GATEWAY_API_ACTIONS.importExternalRun),
      apiAction(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations),
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.writeTerminalRaw,
    actions: [apiAction(AGENT_GATEWAY_API_ACTIONS.sendTerminalInput)],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.cancelRun,
    actions: [...RUN_CANCEL_ACTIONS, getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.cancelRun)],
  },
  {
    name: 'pm.agent-gateway.nodes',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createNodeInvitation),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listNodes),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getNode),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.updateNode),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listNodeProfiles),
      'agNodes:*',
      'agNodeInvitations:*',
      'agAgentProfiles:*',
    ],
  },
  {
    name: 'pm.agent-gateway.skills',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.uploadSkillVersion),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listSkillVersions),
      'agSkills:*',
      'agSkillVersions:*',
      'agNodeSkillInstalls:*',
    ],
  },
  {
    name: 'pm.agent-gateway.runs',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRuns),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getRun),
      'agRuns:list',
      'agRuns:get',
    ],
  },
  {
    name: 'pm.agent-gateway.task-templates',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listTaskTemplates),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getTaskTemplate),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createTaskTemplate),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate),
      'agTaskTemplates:*',
    ],
  },
  {
    name: 'pm.agent-gateway.prompt-templates',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listPromptTemplates),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getPromptTemplate),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createPromptTemplate),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate),
      'agPromptTemplates:*',
    ],
  },
  {
    name: 'pm.agent-gateway.dispatch-bindings',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listDispatchBindings),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getDispatchBinding),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createDispatchBinding),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding),
      getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding),
      'agDispatchBindings:*',
    ],
  },
] as const;

export interface AclLike {
  registerSnippet(snippet: { name: string; actions: string[] | readonly string[] }): void;
}

export function registerAgentGatewayAcl(acl: AclLike) {
  for (const definition of AGENT_GATEWAY_PERMISSION_DEFINITIONS) {
    acl.registerSnippet({
      name: definition.name,
      actions: [...definition.actions],
    });
  }
}
