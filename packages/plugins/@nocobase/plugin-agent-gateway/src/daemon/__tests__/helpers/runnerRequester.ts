/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiPath } from '../../../shared/apiContract';
import { AgentGatewayHttpError } from '../../apiClient';
import { GatewayRequestOptions, GatewayRequester, JsonRecord } from '../../types';

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getRequestEvents(call: GatewayRequestOptions | undefined) {
  if (!isJsonRecord(call?.body)) {
    return [];
  }
  const events = call.body.events;
  return Array.isArray(events) ? events.filter(isJsonRecord) : [];
}

const RUN_ACTION_PATHS = {
  claim: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.claimRun, ''),
  heartbeat: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatRun, ''),
  complete: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.completeRun, ''),
  fail: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.failRun, ''),
  timeout: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.timeoutRun, ''),
  cancelAck: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.ackCancelRun, ''),
} as const;

const OBSERVABILITY_ACTION_PATHS = {
  appendEvents: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendRunEvents, ''),
  registerArtifact: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact, ''),
  registerSnapshot: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot, ''),
  upsertAgentSession: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.upsertAgentSession, ''),
  appendConversationEvents: getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.appendConversationEvents, ''),
} as const;

export function isObservabilityActionCall(
  call: GatewayRequestOptions,
  action: keyof typeof OBSERVABILITY_ACTION_PATHS,
) {
  return call.path.includes(OBSERVABILITY_ACTION_PATHS[action]);
}

export function isRunActionCall(call: GatewayRequestOptions, action: keyof typeof RUN_ACTION_PATHS) {
  return call.path.includes(RUN_ACTION_PATHS[action]);
}

export function isTerminalRunActionCall(call: GatewayRequestOptions) {
  return (['complete', 'fail', 'timeout', 'cancelAck'] as const).some((action) => isRunActionCall(call, action));
}

interface RunnerRequesterOptions {
  claimPayload?: JsonRecord;
  heartbeatDelayMs?: number;
  enforceTerminalLeaseVersion?: boolean;
  cancelOnRunHeartbeatCall?: number;
  failNodeHeartbeatOnce?: boolean;
  failClaimCount?: number;
  failCompleteOnce?: boolean;
  failAgentSessionUpsertOnce?: boolean;
  enforceAgentSessionLeaseVersion?: boolean;
  enforceArtifactLeaseVersion?: boolean;
  artifactResponseDelayMs?: number;
  failArtifactKeys?: string[];
  failConversationAppends?: boolean;
  runHeartbeatFailures?: Record<number, 'transient' | 'lease_lost' | 'permanent'>;
  transientRunHeartbeatStatusFailures?: Partial<Record<'syncing_skills' | 'running' | 'finalizing', number>>;
  failRunHeartbeatsFromCall?: number;
  leaseExpiresAt?: string;
  leaseTtlMs?: number;
  serverTime?: string;
}

export class RunnerRequester implements GatewayRequester {
  calls: GatewayRequestOptions[] = [];
  private leaseVersion = 1;
  private runHeartbeatCount = 0;
  private failCompleteOnce: boolean;
  private failAgentSessionUpsertOnce: boolean;
  private readonly transientRunHeartbeatStatusFailures: Partial<
    Record<'syncing_skills' | 'running' | 'finalizing', number>
  >;

  constructor(private readonly options: RunnerRequesterOptions = {}) {
    this.failCompleteOnce = Boolean(options.failCompleteOnce);
    this.failAgentSessionUpsertOnce = Boolean(options.failAgentSessionUpsertOnce);
    this.transientRunHeartbeatStatusFailures = {
      ...options.transientRunHeartbeatStatusFailures,
    };
  }

  private getDefaultClaimPayload() {
    return {
      claimed: true,
      runId: 'run-1',
      claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
      claimAttempt: 1,
      leaseVersion: 1,
      claimExpiresAt: this.options.leaseExpiresAt || new Date(Date.now() + 60_000).toISOString(),
      ...(this.options.leaseTtlMs !== undefined ? { leaseTtlMs: this.options.leaseTtlMs } : {}),
      ...(this.options.serverTime ? { serverTime: this.options.serverTime } : {}),
      run: {
        id: 'run-1',
        executionPayloadJson: {
          executionPolicyKey: 'node',
          prompt: 'process.stdout.write("runner complete token=RUNNER_TOKEN_SECRET")',
          cwd: '.',
        },
      },
    };
  }

  async request<T extends JsonRecord = JsonRecord>(options: GatewayRequestOptions): Promise<T> {
    this.calls.push(options);
    if (
      this.options.failNodeHeartbeatOnce &&
      options.path === getAgentGatewayApiPath(AGENT_GATEWAY_API_ACTIONS.heartbeatNode, 'node-1')
    ) {
      this.options.failNodeHeartbeatOnce = false;
      throw new Error('connect ECONNREFUSED 127.0.0.1:23001');
    }
    if (isRunActionCall(options, 'heartbeat')) {
      if (this.options.heartbeatDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.heartbeatDelayMs));
      }
      this.runHeartbeatCount += 1;
      const requestedStatus = (options.body as JsonRecord | undefined)?.status;
      if (requestedStatus === 'syncing_skills' || requestedStatus === 'running' || requestedStatus === 'finalizing') {
        const failuresRemaining = this.transientRunHeartbeatStatusFailures[requestedStatus] || 0;
        if (failuresRemaining > 0) {
          this.transientRunHeartbeatStatusFailures[requestedStatus] = failuresRemaining - 1;
          throw new Error('connect ECONNRESET');
        }
      }
      const failure = this.options.runHeartbeatFailures?.[this.runHeartbeatCount];
      if (failure === 'lease_lost') {
        throw new AgentGatewayHttpError('Run lease has expired', 409, {
          code: 'lease_lost',
          message: 'Run lease has expired',
        });
      }
      if (failure === 'permanent') {
        throw new AgentGatewayHttpError('Invalid heartbeat payload', 400);
      }
      if (
        failure === 'transient' ||
        (this.options.failRunHeartbeatsFromCall !== undefined &&
          this.runHeartbeatCount >= this.options.failRunHeartbeatsFromCall)
      ) {
        throw new Error('connect ECONNRESET');
      }
      this.leaseVersion += 1;
      return {
        runId: 'run-1',
        claimToken: 'ag_claim_CLAIM_TOKEN_SECRET',
        claimAttempt: 1,
        leaseVersion: this.leaseVersion,
        claimExpiresAt: this.options.leaseExpiresAt || new Date(Date.now() + 60_000).toISOString(),
        ...(this.options.leaseTtlMs !== undefined ? { leaseTtlMs: this.options.leaseTtlMs } : {}),
        ...(this.options.serverTime ? { serverTime: this.options.serverTime } : {}),
        cancelRequested: this.options.cancelOnRunHeartbeatCall === this.runHeartbeatCount,
      } as T;
    }
    if (isRunActionCall(options, 'claim')) {
      if (this.options.failClaimCount && this.options.failClaimCount > 0) {
        this.options.failClaimCount -= 1;
        throw new Error('connect ECONNRESET claim');
      }
      return (this.options.claimPayload || this.getDefaultClaimPayload()) as T;
    }
    if (this.failCompleteOnce && isRunActionCall(options, 'complete')) {
      this.failCompleteOnce = false;
      throw new Error('Run is canceling');
    }
    if (this.failAgentSessionUpsertOnce && isObservabilityActionCall(options, 'upsertAgentSession')) {
      this.failAgentSessionUpsertOnce = false;
      throw new Error('transient session upsert failure');
    }
    if (this.options.enforceAgentSessionLeaseVersion && isObservabilityActionCall(options, 'upsertAgentSession')) {
      const body = (options.body || {}) as JsonRecord;
      if (body.leaseVersion !== this.leaseVersion) {
        throw new Error(`stale agent session lease version: ${String(body.leaseVersion)} !== ${this.leaseVersion}`);
      }
    }
    if (isObservabilityActionCall(options, 'registerArtifact')) {
      const body = (options.body || {}) as JsonRecord;
      if (this.options.enforceArtifactLeaseVersion && body.leaseVersion !== this.leaseVersion) {
        throw new Error(`stale artifact lease version: ${String(body.leaseVersion)} !== ${this.leaseVersion}`);
      }
      if (this.options.artifactResponseDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.artifactResponseDelayMs));
      }
      if (this.options.failArtifactKeys?.includes(String(body.artifactKey || ''))) {
        throw new Error('HTTP 413');
      }
    }
    if (this.options.failConversationAppends && isObservabilityActionCall(options, 'appendConversationEvents')) {
      throw new Error('connect ECONNRESET timeline append');
    }
    if (this.options.enforceTerminalLeaseVersion && isTerminalRunActionCall(options)) {
      const body = (options.body || {}) as JsonRecord;
      if (body.leaseVersion !== this.leaseVersion) {
        throw new Error(`stale lease version: ${String(body.leaseVersion)} !== ${this.leaseVersion}`);
      }
    }
    return {
      ok: true,
    } as T;
  }
}
