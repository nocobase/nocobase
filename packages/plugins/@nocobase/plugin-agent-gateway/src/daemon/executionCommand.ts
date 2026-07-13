/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAgentAdapter } from './adapters';
import { getExecutionPolicyArgs } from './execDriver';
import { ExecutionPolicyDefinition, JsonRecord, RunLease } from './types';
import { getUnknownRunExecutionPayloadField } from '../shared/contracts';

export type AgentCommandOutputMode = 'structured' | 'terminal';
export type AgentTerminalBackend = 'exec' | 'tmux';

export interface ExecutionCommandSpec {
  executionPolicyKey: string;
  provider: ExecutionPolicyDefinition['provider'];
  args: string[];
  cwd: string;
  timeoutMs: number;
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRawString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getPositiveNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
}

function getTimestampMs(value: unknown) {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim()) {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }
  return undefined;
}

export function getPayload(lease: RunLease) {
  const run = isRecord(lease.run) ? lease.run : {};
  return isRecord(run.executionPayloadJson) ? run.executionPayloadJson : {};
}

export function getRequestedTerminalBackend(fallback?: AgentTerminalBackend) {
  return fallback || 'exec';
}

export function getDeclaredArtifactModifiedSinceMs(lease: RunLease, payload: JsonRecord) {
  if (payload.includeOlderArtifacts === true || payload.collectAllArtifacts === true) {
    return undefined;
  }
  const run = isRecord(lease.run) ? lease.run : {};
  return (
    getTimestampMs(payload.artifactModifiedSince) ||
    getTimestampMs(run.startedAt) ||
    getTimestampMs(run.requestedAt) ||
    getTimestampMs(run.createdAt)
  );
}

function getRunPrompt(lease: RunLease, payload: JsonRecord) {
  const run = isRecord(lease.run) ? lease.run : {};
  const promptSnapshot = isRecord(run.promptSnapshot) ? run.promptSnapshot : {};
  return (
    getRawString(payload.prompt) ||
    getRawString(payload.message) ||
    getRawString(promptSnapshot.renderedPrompt) ||
    getRawString(promptSnapshot.text)
  );
}

export function assertRemoteExecutionPayloadIsSafe(payload: JsonRecord) {
  const unknownField = getUnknownRunExecutionPayloadField(payload);
  if (unknownField) {
    throw new Error(`Remote execution field is not allowed: ${unknownField}`);
  }
}

export function getRequestedExecutionPolicyKey(lease: RunLease, payload = getPayload(lease)) {
  const executionPolicyKey = getString(payload.executionPolicyKey || lease.executionPolicyKey);
  if (!executionPolicyKey) {
    throw new Error('executionPolicyKey is required');
  }
  return executionPolicyKey;
}

function getBoundedTimeoutMs(payload: JsonRecord, policy: ExecutionPolicyDefinition) {
  const requestedTimeoutMs = getPositiveNumber(payload.timeoutMs);
  if (payload.timeoutMs !== undefined && !requestedTimeoutMs) {
    throw new Error('timeoutMs must be a positive finite number');
  }
  const timeoutMs = requestedTimeoutMs ?? policy.defaultTimeoutMs ?? policy.maxTimeoutMs;
  if (timeoutMs > policy.maxTimeoutMs) {
    throw new Error(`timeoutMs exceeds execution policy maximum: ${policy.maxTimeoutMs}`);
  }
  return timeoutMs;
}

export function getExecutionCommandSpec(
  lease: RunLease,
  policy: ExecutionPolicyDefinition,
  cwd: string,
  outputMode: AgentCommandOutputMode,
): ExecutionCommandSpec {
  const payload = getPayload(lease);
  const executionPolicyKey = getRequestedExecutionPolicyKey(lease, payload);
  if (executionPolicyKey !== policy.executionPolicyKey) {
    throw new Error(`Claimed execution policy does not match local policy: ${executionPolicyKey}`);
  }

  const adapter = getAgentAdapter(policy.provider);
  if (!adapter) {
    throw new Error(`Agent provider is not supported by this daemon: ${policy.provider}`);
  }
  adapter.validatePolicyArgs(getExecutionPolicyArgs(policy));
  const timeoutMs = getBoundedTimeoutMs(payload, policy);

  if (getString(payload.mode) !== 'agent-session-resume') {
    const prompt = getRunPrompt(lease, payload);
    if (!prompt.trim()) {
      throw new Error('prompt is required for start runs');
    }
    const command = adapter.buildStartCommand({
      prompt,
      cwd,
      timeoutMs,
      outputMode,
    });
    return {
      executionPolicyKey,
      provider: policy.provider,
      args: command.args,
      cwd: command.cwd || cwd,
      timeoutMs,
    };
  }

  if (!adapter.capabilities.resumeWithMessage) {
    throw new Error(`Agent provider does not support resume: ${adapter.provider}`);
  }

  const providerSessionId = getString(payload.providerSessionId);
  const message = getRawString(payload.message);
  if (!providerSessionId) {
    throw new Error('providerSessionId is required for resume runs');
  }
  if (!message.trim()) {
    throw new Error('message is required for resume runs');
  }

  const command = adapter.buildResumeCommand({
    providerSessionId,
    message,
    cwd,
    timeoutMs,
    outputMode,
  });
  return {
    executionPolicyKey,
    provider: policy.provider,
    args: command.args,
    cwd: command.cwd || cwd,
    timeoutMs,
  };
}
