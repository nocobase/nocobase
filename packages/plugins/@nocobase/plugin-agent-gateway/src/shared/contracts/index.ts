/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { JsonRecord } from '../json';
import { importContracts } from './imports';
import { nodeContracts } from './nodes';
import { observationContracts } from './observations';
import { runContracts } from './runs';
import { skillContracts } from './skills';
import { terminalContracts } from './terminal';
import {
  AGENT_GATEWAY_API_ACTIONS,
  AgentGatewayContractError,
  createActionContract,
  type AgentGatewayActionContract,
  type AgentGatewayApiAction,
} from './common';

export * from './common';
export * from './imports';
export * from './nodes';
export * from './observations';
export * from './runs';
export * from './skills';
export * from './terminal';

const genericContractFields: Partial<Record<AgentGatewayApiAction, readonly string[]>> = {
  [AGENT_GATEWAY_API_ACTIONS.initFileUpload]: [
    'purpose',
    'fileName',
    'mimeType',
    'sizeBytes',
    'sourceSha256',
    'expiresInSeconds',
    'metadataJson',
  ],
  [AGENT_GATEWAY_API_ACTIONS.appendFileUpload]: ['offset', 'contentBase64'],
  [AGENT_GATEWAY_API_ACTIONS.completeFileUpload]: ['sourceSha256', 'sizeBytes'],
  [AGENT_GATEWAY_API_ACTIONS.abortFileUpload]: ['reason'],
  [AGENT_GATEWAY_API_ACTIONS.upsertAgentSession]: [
    'claimToken',
    'claimAttempt',
    'leaseVersion',
    'provider',
    'providerSessionId',
    'status',
    'capabilitiesJson',
    'metadataJson',
  ],
  [AGENT_GATEWAY_API_ACTIONS.resumeAgentSession]: ['message', 'idempotencyKey', 'resumedFromRunId'],
  [AGENT_GATEWAY_API_ACTIONS.messageAgentSession]: ['message'],
  [AGENT_GATEWAY_API_ACTIONS.createTaskTemplate]: [
    'templateKey',
    'displayName',
    'description',
    'status',
    'sort',
    'defaultTitle',
    'defaultPrompt',
    'cwd',
    'nodeId',
    'agentProfileId',
    'skillVersionIdsJson',
    'artifactRoot',
    'artifactsJson',
    'metadataJson',
  ],
  [AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate]: [
    'templateKey',
    'displayName',
    'description',
    'status',
    'sort',
    'defaultTitle',
    'defaultPrompt',
    'cwd',
    'nodeId',
    'agentProfileId',
    'skillVersionIdsJson',
    'artifactRoot',
    'artifactsJson',
    'metadataJson',
  ],
  [AGENT_GATEWAY_API_ACTIONS.createPromptTemplate]: [
    'templateKey',
    'displayName',
    'description',
    'templateText',
    'status',
    'variablesSchemaJson',
    'defaultExecutionPayloadJson',
    'metadataJson',
    'defaultAgentProfileId',
  ],
  [AGENT_GATEWAY_API_ACTIONS.updatePromptTemplate]: [
    'templateKey',
    'displayName',
    'description',
    'templateText',
    'status',
    'variablesSchemaJson',
    'defaultExecutionPayloadJson',
    'metadataJson',
    'defaultAgentProfileId',
  ],
  [AGENT_GATEWAY_API_ACTIONS.previewPromptTemplate]: [
    'templateId',
    'templateKey',
    'templateText',
    'collectionName',
    'recordId',
  ],
  [AGENT_GATEWAY_API_ACTIONS.createDispatchBinding]: [
    'bindingKey',
    'collectionName',
    'outputAgentRunField',
    'promptTemplateId',
    'agentProfileId',
    'nodeId',
    'agentProfileField',
    'nodeField',
    'skillFieldsJson',
    'fieldMappingsJson',
    'filterJson',
    'payloadMappingJson',
    'metadataJson',
    'triggerType',
    'sourceAction',
    'priority',
    'enabled',
    'status',
  ],
  [AGENT_GATEWAY_API_ACTIONS.updateDispatchBinding]: [
    'bindingKey',
    'collectionName',
    'outputAgentRunField',
    'promptTemplateId',
    'agentProfileId',
    'nodeId',
    'agentProfileField',
    'nodeField',
    'skillFieldsJson',
    'fieldMappingsJson',
    'filterJson',
    'payloadMappingJson',
    'metadataJson',
    'triggerType',
    'sourceAction',
    'priority',
    'enabled',
    'status',
  ],
  [AGENT_GATEWAY_API_ACTIONS.dispatchBinding]: ['sourceRecordId', 'sourceCollection', 'idempotencyKey'],
  [AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests]: ['claimToken', 'claimAttempt', 'leaseVersion'],
  [AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus]: ['requestId'],
};

const bodylessActions = new Set<AgentGatewayApiAction>([
  AGENT_GATEWAY_API_ACTIONS.listNodes,
  AGENT_GATEWAY_API_ACTIONS.getNode,
  AGENT_GATEWAY_API_ACTIONS.listNodeProfiles,
  AGENT_GATEWAY_API_ACTIONS.listSkillVersions,
  AGENT_GATEWAY_API_ACTIONS.getSkillVersion,
  AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion,
  AGENT_GATEWAY_API_ACTIONS.listRunOptions,
  AGENT_GATEWAY_API_ACTIONS.listRuns,
  AGENT_GATEWAY_API_ACTIONS.getRun,
  AGENT_GATEWAY_API_ACTIONS.expireRunLeases,
  AGENT_GATEWAY_API_ACTIONS.listTaskTemplates,
  AGENT_GATEWAY_API_ACTIONS.getTaskTemplate,
  AGENT_GATEWAY_API_ACTIONS.listPromptTemplates,
  AGENT_GATEWAY_API_ACTIONS.getPromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.destroyPromptTemplate,
  AGENT_GATEWAY_API_ACTIONS.listDispatchBindings,
  AGENT_GATEWAY_API_ACTIONS.getDispatchBinding,
  AGENT_GATEWAY_API_ACTIONS.destroyDispatchBinding,
  AGENT_GATEWAY_API_ACTIONS.listRunConversationEvents,
  AGENT_GATEWAY_API_ACTIONS.listRunToolCalls,
  AGENT_GATEWAY_API_ACTIONS.listToolCallStats,
  AGENT_GATEWAY_API_ACTIONS.listSessionConversationEvents,
  AGENT_GATEWAY_API_ACTIONS.listRunEvents,
  AGENT_GATEWAY_API_ACTIONS.listRunArtifacts,
  AGENT_GATEWAY_API_ACTIONS.listRunSnapshots,
  AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs,
  AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent,
  AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot,
  AGENT_GATEWAY_API_ACTIONS.getTerminalStreamStats,
]);

const explicitContracts: Partial<
  Record<AgentGatewayApiAction, AgentGatewayActionContract<AgentGatewayApiAction, JsonRecord, JsonRecord>>
> = {
  ...nodeContracts,
  ...runContracts,
  ...observationContracts,
  ...importContracts,
  ...skillContracts,
  ...terminalContracts,
};

export const AGENT_GATEWAY_API_CONTRACTS = Object.fromEntries(
  Object.values(AGENT_GATEWAY_API_ACTIONS).map((action) => {
    const explicitContract = explicitContracts[action];
    if (explicitContract) {
      return [action, explicitContract];
    }
    const fields = genericContractFields[action];
    if (fields) {
      return [action, createActionContract(action, fields)];
    }
    if (bodylessActions.has(action)) {
      return [action, createActionContract(action, [])];
    }
    return [action, createActionContract(action, [])];
  }),
) as Record<AgentGatewayApiAction, AgentGatewayActionContract<AgentGatewayApiAction, JsonRecord, JsonRecord>>;

export function parseAgentGatewayActionRequest(action: AgentGatewayApiAction, value: unknown) {
  const contract = AGENT_GATEWAY_API_CONTRACTS[action];
  if (!contract) {
    throw new AgentGatewayContractError(`Unknown Agent Gateway action: ${action}`);
  }
  return contract.parseRequest(value);
}

export function parseAgentGatewayActionResponse(action: AgentGatewayApiAction, value: unknown) {
  const contract = AGENT_GATEWAY_API_CONTRACTS[action];
  if (!contract) {
    throw new AgentGatewayContractError(`Unknown Agent Gateway action: ${action}`);
  }
  return contract.parseResponse(value);
}
