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
  readRun: 'agentGateway.readRun',
  readRunDetails: 'agentGateway.readRunDetails',
  cancelRun: 'agentGateway.cancelRun',
} as const;

export const AGENT_GATEWAY_ACTIONS = {
  manage: 'manage',
  dispatch: 'dispatch',
  readRun: 'readRun',
  readRunDetails: 'readRunDetails',
  cancelRun: 'cancelRun',
} as const;

export const AGENT_GATEWAY_PERMISSION_DEFINITIONS = [
  {
    name: AGENT_GATEWAY_PERMISSIONS.manage,
    actions: [
      `${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.manage}`,
      'agNodes:*',
      'agNodeInvitations:*',
      'agAgentProfiles:*',
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
    name: AGENT_GATEWAY_PERMISSIONS.readRun,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRun}`, 'agRuns:list', 'agRuns:get'],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.readRunDetails,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.readRunDetails}`],
  },
  {
    name: AGENT_GATEWAY_PERMISSIONS.cancelRun,
    actions: [`${AGENT_GATEWAY_RESOURCE}:${AGENT_GATEWAY_ACTIONS.cancelRun}`],
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
