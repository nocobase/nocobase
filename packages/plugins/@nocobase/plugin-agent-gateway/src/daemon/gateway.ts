/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DaemonConfig, DetectedAgentProfile, GatewayRequester, JsonRecord, RunLease } from './types';
import { NodeSkillInstallPayload } from './skillSync';

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

  getNodeAuthHeaders() {
    return {
      Authorization: `Bearer ${this.config.nodeToken}`,
    };
  }

  async heartbeatNode(options: { profiles: DetectedAgentProfile[]; currentConcurrency?: number }) {
    return await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/heartbeat`,
      nodeToken: this.config.nodeToken,
      body: {
        currentConcurrency: options.currentConcurrency || 0,
        capabilities: {
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
        profiles: options.profiles,
      },
    });
  }

  async createRun(values: JsonRecord): Promise<{ runId: string }> {
    return await this.requester.request<{ runId: string }>({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/smoke-runs:create`,
      nodeToken: this.config.nodeToken,
      body: values,
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
    const response = await this.requester.request<RunLease>({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs:claim`,
      nodeToken: this.config.nodeToken,
      body,
    });
    return response;
  }

  async heartbeatRun(lease: RunLease, status: 'claimed' | 'syncing_skills' | 'running') {
    return await this.requester.request<RunLease>({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/heartbeat`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        status,
      },
    });
  }

  async updateRunTerminal(lease: RunLease, values: JsonRecord) {
    return await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/terminal:update`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async appendEvent(lease: RunLease, values: JsonRecord) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/runs/${lease.runId}/events:append`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async appendConversationEvents(lease: RunLease, values: JsonRecord) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/runs/${lease.runId}/conversation-events:append`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async registerArtifact(lease: RunLease, values: JsonRecord) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/runs/${lease.runId}/artifacts:register`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async registerSnapshot(lease: RunLease, values: JsonRecord) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/runs/${lease.runId}/snapshots:register`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        ...values,
      },
    });
  }

  async upsertAgentSession(lease: RunLease, values: JsonRecord) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/agent-session:upsert`,
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
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/complete`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        resultSummary,
      },
    });
  }

  async failRun(lease: RunLease, errorSummary: string, resultSummary: JsonRecord = {}) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/fail`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
        errorSummary,
        resultSummary,
      },
    });
  }

  async timeoutRun(lease: RunLease, errorSummary: string) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/timeout`,
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
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${lease.runId}/cancel-ack`,
      nodeToken: this.config.nodeToken,
      body: {
        claimToken: lease.claimToken,
        claimAttempt: lease.claimAttempt,
        leaseVersion: lease.leaseVersion,
      },
    });
  }

  async skipRun(runId: string, reason: string, resultSummary: JsonRecord = {}) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/runs/${runId}/skip`,
      nodeToken: this.config.nodeToken,
      body: {
        reason,
        resultSummary,
      },
    });
  }

  async upsertSkillInstall(payload: NodeSkillInstallPayload) {
    await this.requester.request({
      method: 'POST',
      path: `/api/agent-gateway/nodes/${this.config.nodeId}/skill-installs:upsert`,
      nodeToken: this.config.nodeToken,
      body: payload,
    });
  }
}
