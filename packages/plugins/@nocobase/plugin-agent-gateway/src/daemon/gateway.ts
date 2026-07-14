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
  ClaimRunResult,
  ClaimedRunLease,
  CanonicalClaimedRun,
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
import { AgentGatewayContractError } from '../shared/contracts';
import { isJsonRecord } from '../shared/json';
import {
  isAgentProviderKey,
  normalizeAgentProviderCapabilities,
  type AgentProviderCapabilities,
} from '../shared/providerCapabilities';
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

function getRequiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value) {
    throw new AgentGatewayContractError(`${label} must be a string`);
  }
  return value;
}

function getRequiredNonNegativeInteger(value: unknown, label: string) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new AgentGatewayContractError(`${label} must be a non-negative integer`);
  }
  return Number(value);
}

function getOptionalString(value: unknown, label: string) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return getRequiredString(value, label);
}

function getOptionalBoolean(value: unknown, label: string) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new AgentGatewayContractError(`${label} must be a boolean`);
  }
  return value;
}

function getOptionalFiniteNumber(value: unknown, label: string) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AgentGatewayContractError(`${label} must be a finite number`);
  }
  return value;
}

function parseClaimedRun(value: unknown): CanonicalClaimedRun {
  if (!isJsonRecord(value)) {
    throw new AgentGatewayContractError('response.run must be an object');
  }
  if (!isAgentProviderKey(value.provider)) {
    throw new AgentGatewayContractError('response.run.provider is invalid');
  }
  if (!isJsonRecord(value.capabilitiesSnapshotJson)) {
    throw new AgentGatewayContractError('response.run.capabilitiesSnapshotJson must be an object');
  }
  if (!isJsonRecord(value.executionPayloadJson)) {
    throw new AgentGatewayContractError('response.run.executionPayloadJson must be an object');
  }
  let promptSnapshot: JsonRecord | undefined;
  if (value.promptSnapshot !== undefined) {
    if (!isJsonRecord(value.promptSnapshot)) {
      throw new AgentGatewayContractError('response.run.promptSnapshot must be an object');
    }
    promptSnapshot = value.promptSnapshot;
  }
  const capabilitiesSnapshotJson: AgentProviderCapabilities = normalizeAgentProviderCapabilities(
    value.provider,
    value.capabilitiesSnapshotJson,
  );
  return {
    id: getOptionalString(value.id, 'response.run.id'),
    provider: value.provider,
    capabilitiesSnapshotJson,
    executionPolicyKey: getRequiredString(value.executionPolicyKey, 'response.run.executionPolicyKey'),
    sourceType: getRequiredString(value.sourceType, 'response.run.sourceType'),
    executionPayloadJson: value.executionPayloadJson,
    promptSnapshot,
    timeoutMs: getOptionalFiniteNumber(value.timeoutMs, 'response.run.timeoutMs'),
    startedAt: getOptionalString(value.startedAt, 'response.run.startedAt'),
    requestedAt: getOptionalString(value.requestedAt, 'response.run.requestedAt'),
    createdAt: getOptionalString(value.createdAt, 'response.run.createdAt'),
  };
}

function parseClaimRunResult(value: unknown): ClaimRunResult {
  if (!isJsonRecord(value)) {
    throw new AgentGatewayContractError('response must be an object');
  }
  if (value.claimed === false) {
    return {
      claimed: false,
      reason: getOptionalString(value.reason, 'response.reason'),
      checkedAt: getOptionalString(value.checkedAt, 'response.checkedAt'),
    };
  }
  if (value.claimed !== true) {
    throw new AgentGatewayContractError('response.claimed must be true or false');
  }
  return {
    claimed: true,
    runId: getRequiredString(value.runId, 'response.runId'),
    claimToken: getRequiredString(value.claimToken, 'response.claimToken'),
    claimAttempt: getRequiredNonNegativeInteger(value.claimAttempt, 'response.claimAttempt'),
    leaseVersion: getRequiredNonNegativeInteger(value.leaseVersion, 'response.leaseVersion'),
    claimExpiresAt: getOptionalString(value.claimExpiresAt, 'response.claimExpiresAt'),
    leaseTtlMs: getOptionalFiniteNumber(value.leaseTtlMs, 'response.leaseTtlMs'),
    serverTime: getOptionalString(value.serverTime, 'response.serverTime'),
    run: parseClaimedRun(value.run),
    profileKey: getOptionalString(value.profileKey, 'response.profileKey'),
    executionPolicyKey: getRequiredString(value.executionPolicyKey, 'response.executionPolicyKey'),
    profileCapabilities: isJsonRecord(value.profileCapabilities) ? value.profileCapabilities : undefined,
    cancelRequested: getOptionalBoolean(value.cancelRequested, 'response.cancelRequested'),
    cancelReason: getOptionalString(value.cancelReason, 'response.cancelReason'),
  };
}

function parseHeartbeatLease(lease: RunLease, value: unknown): RunLease {
  if (!isJsonRecord(value)) {
    throw new AgentGatewayContractError('response must be an object');
  }
  const runId = getRequiredString(value.runId, 'response.runId');
  if (runId !== lease.runId) {
    throw new AgentGatewayContractError('response.runId does not match the active lease');
  }
  return {
    ...lease,
    runId,
    claimAttempt: getRequiredNonNegativeInteger(value.claimAttempt, 'response.claimAttempt'),
    leaseVersion: getRequiredNonNegativeInteger(value.leaseVersion, 'response.leaseVersion'),
    claimExpiresAt: getOptionalString(value.claimExpiresAt, 'response.claimExpiresAt'),
    leaseTtlMs: getOptionalFiniteNumber(value.leaseTtlMs, 'response.leaseTtlMs'),
    serverTime: getOptionalString(value.serverTime, 'response.serverTime'),
    cancelRequested: getOptionalBoolean(value.cancelRequested, 'response.cancelRequested'),
    cancelReason: getOptionalString(value.cancelReason, 'response.cancelReason'),
  };
}

function parsePendingControlRequests(value: unknown): { requests: PendingControlRequest[] } {
  if (!isJsonRecord(value)) {
    throw new AgentGatewayContractError('response must be an object');
  }
  if (value.requests === undefined) {
    return { requests: [] };
  }
  if (!Array.isArray(value.requests)) {
    throw new AgentGatewayContractError('response.requests must be an array');
  }
  return {
    requests: value.requests.map((request, index) => {
      if (!isJsonRecord(request)) {
        throw new AgentGatewayContractError(`response.requests[${index}] must be an object`);
      }
      if (typeof request.id !== 'string' || !request.id) {
        throw new AgentGatewayContractError(`response.requests[${index}].id must be a string`);
      }
      if (typeof request.runId !== 'string' || !request.runId) {
        throw new AgentGatewayContractError(`response.requests[${index}].runId must be a string`);
      }
      if (request.action !== 'interrupt' && request.action !== 'terminate') {
        throw new AgentGatewayContractError(`response.requests[${index}].action is invalid`);
      }
      if (request.status !== 'accepted' && request.status !== 'delivered') {
        throw new AgentGatewayContractError(`response.requests[${index}].status is invalid`);
      }
      if (typeof request.createdAt !== 'string' || !request.createdAt) {
        throw new AgentGatewayContractError(`response.requests[${index}].createdAt must be a string`);
      }
      if (request.reason !== undefined && typeof request.reason !== 'string') {
        throw new AgentGatewayContractError(`response.requests[${index}].reason must be a string`);
      }
      return {
        id: request.id,
        runId: request.runId,
        action: request.action,
        status: request.status,
        reason: getOptionalString(request.reason, `response.requests[${index}].reason`),
        createdAt: request.createdAt,
      };
    }),
  };
}

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
                artifacts: true,
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

  async claimRun(options?: string | { profileKey?: string; runId?: string }): Promise<ClaimRunResult> {
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
    const claim = parseClaimRunResult(response);
    return claim.claimed === false ? claim : attachLocalRunLeaseDeadline(claim);
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
    return attachLocalRunLeaseDeadline(parseHeartbeatLease(lease, response));
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
    const response = await requestGatewayAction(this.requester, {
      action: AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests,
      method: 'POST',
      path: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.listPendingControlRequests, lease.runId),
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      },
    });
    return parsePendingControlRequests(response);
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
