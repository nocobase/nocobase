/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DaemonConfig,
  DetectedAgentProfile,
  GatewayRequester,
  JsonRecord,
  PendingControlRequest,
  RunLease,
  requestGatewayAction,
} from './types';
import { arch, hostname, platform } from 'os';
import { NodeSkillInstallPayload } from './skillSync';
import { attachLocalRunLeaseDeadline } from './leaseDeadline';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../shared/apiContract';
import type {
  AckControlRequest,
  AppendObservationRequest,
  AppendRunEventRequest,
  RegisterRunArtifactRequest,
  RegisterRunSnapshotRequest,
  UpdateRunTerminalRequest,
  UpsertAgentSessionRequest,
} from '../shared/contracts';

type UpdateRunTerminalValues = Pick<
  UpdateRunTerminalRequest,
  | 'terminalBackend'
  | 'terminalSessionName'
  | 'terminalStatus'
  | 'terminalExitCode'
  | 'terminalStartedAt'
  | 'terminalEndedAt'
  | 'terminalLastActivityAt'
>;
type AppendRunEventValues = Pick<
  AppendRunEventRequest,
  'ingestId' | 'source' | 'sequence' | 'eventType' | 'level' | 'message' | 'contentJson' | 'emittedAt'
>;
type AppendConversationEventValues = Pick<AppendObservationRequest, 'events'>;
type RegisterRunArtifactValues = Pick<
  RegisterRunArtifactRequest,
  | 'artifactKey'
  | 'artifactType'
  | 'fileName'
  | 'mimeType'
  | 'sizeBytes'
  | 'sourceSha256'
  | 'uploadId'
  | 'contentText'
  | 'metadataJson'
>;
type RegisterRunSnapshotValues = Pick<
  RegisterRunSnapshotRequest,
  'snapshotType' | 'snapshotJson' | 'capturedAt' | 'metadataJson'
>;
type UpsertAgentSessionValues = Pick<
  UpsertAgentSessionRequest,
  'provider' | 'providerSessionId' | 'status' | 'capabilitiesJson' | 'metadataJson'
>;
type AckControlRequestValues = Pick<AckControlRequest, 'reason' | 'resultMessage'>;

export class AgentGatewayDaemonNodeClient {
  constructor(
    private readonly requester: GatewayRequester,
    private readonly config: DaemonConfig,
  ) {}

  get nodeId() {
    return this.config.nodeId;
  }

  get serverUrl() {
    return this.config.serverUrl;
  }

  get nodeToken() {
    return this.config.nodeToken;
  }

  getNodeAuthHeaders() {
    return {
      Authorization: `Bearer ${this.config.nodeToken}`,
    };
  }

  async heartbeatNode(options: {
    profiles?: DetectedAgentProfile[];
    profilesHash?: string;
    currentConcurrency?: number;
    includeNodeSnapshot?: boolean;
  }) {
    return await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.heartbeatNode,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, this.config.nodeId),
      nodeToken: this.config.nodeToken,
      body: {
        installationId: this.config.installationId,
        currentConcurrency: options.currentConcurrency || 0,
        ...(options.includeNodeSnapshot
          ? {
              daemonVersion: 'agent-gateway-daemon/0.1.0',
              hostInfo: {
                hostname: hostname(),
                platform: platform(),
                arch: arch(),
              },
              capabilitiesJson: {
                maxConcurrency: 1,
                supportsExecDriver: true,
                supportsArtifacts: true,
                supportsSnapshots: true,
                terminal: {
                  backend: 'tmux',
                  attach: true,
                  input: true,
                  interrupt: true,
                  terminate: true,
                },
              },
            }
          : {}),
        ...(options.profiles ? { profiles: options.profiles, profilesHash: options.profilesHash } : {}),
      },
    });
  }

  async claimRun(options?: string | { profileKey?: string; runId?: string }): Promise<RunLease> {
    const body =
      typeof options === 'string'
        ? {
            profileKey: options,
          }
        : {
            ...(options?.profileKey ? { profileKey: options.profileKey } : {}),
            ...(options?.runId ? { runId: options.runId } : {}),
          };
    const response = await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.claimRun,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, this.config.nodeId),
      nodeToken: this.config.nodeToken,
      body,
    });
    return response.claimed === false ? response : attachLocalRunLeaseDeadline(response);
  }

  async heartbeatRun(lease: RunLease, status: 'claimed' | 'syncing_skills' | 'running' | 'finalizing') {
    const response = await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.heartbeatRun,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        status,
      },
    });
    return attachLocalRunLeaseDeadline(response);
  }

  async updateRunTerminal(lease: RunLease, values: UpdateRunTerminalValues) {
    return await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.updateRunTerminal,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.updateRunTerminal, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async appendEvent(lease: RunLease, values: AppendRunEventValues) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.appendRunEvents,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async appendConversationEvents(lease: RunLease, values: AppendConversationEventValues) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.appendConversationEvents,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendConversationEvents, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async registerArtifact(lease: RunLease, values: RegisterRunArtifactValues) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.registerRunArtifact,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async registerSnapshot(lease: RunLease, values: RegisterRunSnapshotValues) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async upsertAgentSession(lease: RunLease, values: UpsertAgentSessionValues) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.upsertAgentSession,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.upsertAgentSession, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async completeRun(lease: RunLease, resultSummary: JsonRecord) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.completeRun,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.completeRun, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        resultSummaryJson: resultSummary,
      },
    });
  }

  async failRun(lease: RunLease, errorSummary: string, resultSummary: JsonRecord = {}) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.failRun,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.failRun, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        errorSummary,
        resultSummaryJson: resultSummary,
      },
    });
  }

  async timeoutRun(lease: RunLease, errorSummary: string) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.timeoutRun,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.timeoutRun, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        errorSummary,
      },
    });
  }

  async cancelAckRun(lease: RunLease) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.ackCancelRun,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.ackCancelRun, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      },
    });
  }

  async listPendingControlRequests(lease: RunLease) {
    return (await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      },
    })) as { requests: PendingControlRequest[] };
  }

  async ackControlRequest(
    lease: RunLease,
    requestId: string,
    status: 'delivered' | 'succeeded' | 'failed',
    values: AckControlRequestValues = {},
  ) {
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.ackControlRequest,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.ackControlRequest, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        requestId,
        status,
        ...values,
      },
    });
  }

  async upsertSkillInstall(payload: NodeSkillInstallPayload) {
    const body = {
      skillVersionId: payload.skillVersionId,
      status: payload.status,
      installedAt: payload.installedAt,
      lastSeenAt: payload.lastSeenAt,
      capabilitiesSnapshotJson: payload.capabilitiesSnapshotJson,
      settingsSnapshotJson: payload.settingsSnapshotJson,
      capabilityToken: payload.capabilityToken,
      runId: payload.runId,
      claimAttempt: payload.claimAttempt,
      sourceSha256: payload.sourceSha256,
    };
    await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.upsertNodeSkillInstall, this.config.nodeId),
      nodeToken: this.config.nodeToken,
      body,
    });
  }
}
