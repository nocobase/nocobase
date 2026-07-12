/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
      ...AGENT_GATEWAY_INTERNAL_COLLECTION_ACTIONS,
    ],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.dispatch,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.dispatch}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRuns,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`, 'agRuns:list'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRun,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
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
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readSessionMessages}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readTerminal,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readTerminal}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.resumeAgentSession,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.resumeAgentSession}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.messageAgentSession,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.messageAgentSession}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.interruptRun,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.interruptRun}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.terminateRun,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.terminateRun}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readArtifacts,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readArtifacts}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRawLogs,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRawLogs}`, 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.importExternalRuns,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.importExternalRuns}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.writeTerminalRaw,
    actions: [],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.cancelRun,
    actions: RUN_CANCEL_ACTIONS,
  },
  {
    name: 'pm.agent-gateway.nodes',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      'agNodes:*',
      'agNodeInvitations:*',
      'agAgentProfiles:*',
    ],
  },
  {
    name: 'pm.agent-gateway.skills',
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
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
      'agRuns:list',
      'agRuns:get',
    ],
  },
  {
    name: 'pm.agent-gateway.task-templates',
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`, 'agTaskTemplates:*'],
  },
  {
    name: 'pm.agent-gateway.prompt-templates',
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`, 'agPromptTemplates:*'],
  },
  {
    name: 'pm.agent-gateway.dispatch-bindings',
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`, 'agDispatchBindings:*'],
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
