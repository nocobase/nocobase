/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AgentGatewayCollectionExposure = 'business' | 'system';
export type AgentGatewayDirectCrudPolicy = 'manage' | 'scoped-read';

export interface AgentGatewayCollectionRegistration {
  name: string;
  exposure: AgentGatewayCollectionExposure;
  directCrudPolicy: AgentGatewayDirectCrudPolicy;
  allowBusinessRelation: boolean;
  containsSecret: boolean;
  containsToken: boolean;
  containsStorageLocator: boolean;
}

export const AGENT_GATEWAY_COLLECTION_REGISTRY = [
  {
    name: 'agNodes',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: true,
    containsStorageLocator: false,
  },
  {
    name: 'agNodeInvitations',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: true,
    containsStorageLocator: false,
  },
  {
    name: 'agAgentProfiles',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agAgentSessions',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agAgentConversationEvents',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agSkills',
    exposure: 'business',
    directCrudPolicy: 'manage',
    allowBusinessRelation: true,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agSkillVersions',
    exposure: 'business',
    directCrudPolicy: 'manage',
    allowBusinessRelation: true,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: true,
  },
  {
    name: 'agNodeSkillInstalls',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agSkillDownloadCapabilities',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: true,
    containsStorageLocator: false,
  },
  {
    name: 'agTaskTemplates',
    exposure: 'business',
    directCrudPolicy: 'manage',
    allowBusinessRelation: true,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agPromptTemplates',
    exposure: 'business',
    directCrudPolicy: 'manage',
    allowBusinessRelation: true,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agDispatchBindings',
    exposure: 'business',
    directCrudPolicy: 'manage',
    allowBusinessRelation: true,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agRuns',
    exposure: 'business',
    directCrudPolicy: 'scoped-read',
    allowBusinessRelation: true,
    containsSecret: true,
    containsToken: true,
    containsStorageLocator: false,
  },
  {
    name: 'agRunEvents',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agRunArtifacts',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: true,
  },
  {
    name: 'agRunSnapshots',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agApiCallLogs',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agRunControlRequests',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agTerminalStreamTickets',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: true,
    containsStorageLocator: false,
  },
  {
    name: 'agEventIngestSequences',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agExternalRunIdentities',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agExternalImportBatches',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: true,
    containsToken: false,
    containsStorageLocator: false,
  },
  {
    name: 'agFileUploads',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: true,
  },
  {
    name: 'agMaintenanceLeases',
    exposure: 'system',
    directCrudPolicy: 'manage',
    allowBusinessRelation: false,
    containsSecret: false,
    containsToken: false,
    containsStorageLocator: false,
  },
] as const satisfies readonly AgentGatewayCollectionRegistration[];

export type AgentGatewayCollectionName = (typeof AGENT_GATEWAY_COLLECTION_REGISTRY)[number]['name'];

const collectionRegistrationByName: ReadonlyMap<string, AgentGatewayCollectionRegistration> = new Map(
  AGENT_GATEWAY_COLLECTION_REGISTRY.map((registration) => [registration.name, registration]),
);

export function getAgentGatewayCollectionRegistration(name: string) {
  return collectionRegistrationByName.get(name);
}

export function getAgentGatewayDirectCollectionActions(collectionNames: readonly AgentGatewayCollectionName[]) {
  return collectionNames.map((collectionName) => `${collectionName}:*`);
}
