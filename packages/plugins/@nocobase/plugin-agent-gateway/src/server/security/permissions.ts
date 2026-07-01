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
  dispatch: 'agentGateway.dispatch',
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
  writeTerminalRaw: 'writeTerminalRaw',
  cancelRun: 'cancelRun',
} as const;

const RUN_DETAIL_READ_ACTIONS = [
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRunDetails}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readSessionMessages}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readTerminal}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readArtifacts}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRawLogs}`,
] as const;

const RUN_CONTROL_ACTIONS = [
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.cancelRun}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.interruptRun}`,
  `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.terminateRun}`,
] as const;

export const AGENT_GATEWAY_PERMISSION_DEFINITIONS = [
  {
    name: AGENT_GATEWAY_PERMISSIONS.manage,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRuns}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`,
      ...RUN_DETAIL_READ_ACTIONS,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.resumeAgentSession}`,
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.messageAgentSession}`,
      ...RUN_CONTROL_ACTIONS,
      'agNodes:*',
      'agNodeInvitations:*',
      'agAgentProfiles:*',
      'agAgentSessions:*',
      'agAgentActionAudits:*',
      'agSkills:*',
      'agSkillVersions:*',
      'agNodeSkillInstalls:*',
      'agPromptTemplates:*',
      'agDispatchBindings:*',
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
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readSessionMessages}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readTerminal,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readTerminal}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.resumeAgentSession,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.resumeAgentSession}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.messageAgentSession,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.messageAgentSession}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.interruptRun,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.interruptRun}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.terminateRun,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.terminateRun}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readArtifacts,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readArtifacts}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRawLogs,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRawLogs}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.writeTerminalRaw,
    actions: [],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.cancelRun,
    actions: RUN_CONTROL_ACTIONS,
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
