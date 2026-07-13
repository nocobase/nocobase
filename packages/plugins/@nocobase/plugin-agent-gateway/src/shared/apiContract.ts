/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './contracts';

import { AGENT_GATEWAY_API_ACTIONS } from './contracts';

export const AGENT_GATEWAY_MACHINE_API_ACTIONS = [
  AGENT_GATEWAY_API_ACTIONS.registerNode,
  AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
  AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall,
  AGENT_GATEWAY_API_ACTIONS.downloadSkillVersion,
  AGENT_GATEWAY_API_ACTIONS.claimRun,
  AGENT_GATEWAY_API_ACTIONS.heartbeatRun,
  AGENT_GATEWAY_API_ACTIONS.completeRun,
  AGENT_GATEWAY_API_ACTIONS.failRun,
  AGENT_GATEWAY_API_ACTIONS.timeoutRun,
  AGENT_GATEWAY_API_ACTIONS.ackCancelRun,
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
  AGENT_GATEWAY_API_ACTIONS.getSkillVersion,
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
