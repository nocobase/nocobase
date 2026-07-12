/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getAgentAdapter } from './adapters';
import { JsonRecord, RunLease } from './types';
import { AgentProviderKey, getExplicitAgentProviderKey } from '../shared/providerCapabilities';

export type AgentCommandOutputMode = 'structured' | 'terminal';
export type AgentTerminalBackend = 'exec' | 'tmux';

export interface ExecutionCommandSpec {
  commandKey: string;
  provider?: AgentProviderKey;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  timeoutMs?: number;
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

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getStringMap(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue === 'string') {
      result[key] = entryValue;
    }
  }
  return result;
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

export function getRequestedTerminalBackend(payload: JsonRecord, fallback?: AgentTerminalBackend) {
  return fallback || (getString(payload.terminalBackend) === 'tmux' ? 'tmux' : 'exec');
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

export function getCanonicalProvider(lease: RunLease, payload: JsonRecord) {
  return (
    getExplicitAgentProviderKey(lease.profileProvider) ||
    getExplicitAgentProviderKey(payload.provider) ||
    getExplicitAgentProviderKey(payload.agentProvider) ||
    getExplicitAgentProviderKey(payload.commandKey)
  );
}

function shouldUseStartAdapter(payload: JsonRecord, provider: AgentProviderKey, prompt: string) {
  if (provider === 'generic-cli' || !prompt.trim()) {
    return false;
  }
  const commandKey = getString(payload.commandKey);
  const profileKey = getString(payload.profileKey);
  const hasExplicitArgs = getStringArray(payload.args).length > 0;
  return (
    getExplicitAgentProviderKey(commandKey) === provider ||
    (!hasExplicitArgs && (!commandKey || commandKey === profileKey))
  );
}

function getFallbackObservationProvider(payload: JsonRecord, provider: AgentProviderKey | null) {
  if (!provider || provider === 'generic-cli') {
    return undefined;
  }
  const commandKey = getString(payload.commandKey);
  const commandProvider = getExplicitAgentProviderKey(commandKey);
  return commandProvider === provider ? provider : undefined;
}

export function getExecutionCommandSpec(
  lease: RunLease,
  cwd: string,
  outputMode: AgentCommandOutputMode,
): ExecutionCommandSpec {
  const payload = getPayload(lease);
  const commandKey = getString(payload.commandKey || payload.profileKey);
  const provider = getCanonicalProvider(lease, payload);
  const adapter = provider ? getAgentAdapter(provider) : null;
  if (getString(payload.mode) !== 'agent-session-resume') {
    const prompt = getRunPrompt(lease, payload);
    if (adapter && shouldUseStartAdapter(payload, adapter.provider, prompt)) {
      const command = adapter.buildStartCommand({
        prompt,
        cwd,
        extraArgs: getStringArray(payload.extraArgs),
        timeoutMs: getPositiveNumber(payload.timeoutMs),
        outputMode,
      });
      return {
        ...command,
        provider: adapter.provider,
        cwd: command.cwd || cwd,
        env: getStringMap(payload.env),
      };
    }
    const observationProvider = getFallbackObservationProvider(payload, provider);
    return {
      commandKey,
      ...(observationProvider ? { provider: observationProvider } : {}),
      args: getStringArray(payload.args),
      cwd,
      env: getStringMap(payload.env),
      timeoutMs: getPositiveNumber(payload.timeoutMs),
    };
  }

  if (!adapter) {
    throw new Error(`Agent provider does not support resume: ${provider || commandKey || 'unknown'}`);
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
    extraArgs: getStringArray(payload.extraArgs),
    timeoutMs: getPositiveNumber(payload.timeoutMs),
    outputMode,
  });
  return {
    ...command,
    provider: adapter.provider,
    cwd: command.cwd || cwd,
    env: getStringMap(payload.env),
  };
}
