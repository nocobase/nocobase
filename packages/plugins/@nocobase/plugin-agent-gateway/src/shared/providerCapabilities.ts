/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE = 'AGENT_GATEWAY_ACTION_UNSUPPORTED' as const;

export const AGENT_PROVIDER_KEYS = ['codex', 'opencode', 'claude-code', 'generic-cli'] as const;

export type AgentProviderKey = (typeof AGENT_PROVIDER_KEYS)[number];

export const AGENT_CAPABILITY_KEYS = [
  'structuredEvents',
  'terminalOutput',
  'resumeSession',
  'liveSemanticMessage',
  'stdinMessage',
  'interrupt',
  'terminate',
  'artifacts',
] as const;

export type AgentCapabilityKey = (typeof AGENT_CAPABILITY_KEYS)[number];

export interface AgentProviderCapabilities {
  structuredEvents: boolean;
  terminalOutput: boolean;
  resumeSession: boolean;
  liveSemanticMessage: boolean;
  stdinMessage: boolean;
  interrupt: boolean;
  terminate: boolean;
  artifacts: boolean;
  detectSessionId: boolean;
  resumeWithMessage: boolean;
}

export type JsonRecord = Record<string, unknown>;

export const DEFAULT_AGENT_PROVIDER_CAPABILITIES: Record<AgentProviderKey, AgentProviderCapabilities> = {
  codex: {
    structuredEvents: true,
    terminalOutput: true,
    resumeSession: true,
    liveSemanticMessage: false,
    stdinMessage: false,
    interrupt: true,
    terminate: true,
    artifacts: true,
    detectSessionId: true,
    resumeWithMessage: true,
  },
  opencode: {
    structuredEvents: true,
    terminalOutput: true,
    resumeSession: false,
    liveSemanticMessage: false,
    stdinMessage: false,
    interrupt: true,
    terminate: true,
    artifacts: true,
    detectSessionId: false,
    resumeWithMessage: false,
  },
  'claude-code': {
    structuredEvents: true,
    terminalOutput: true,
    resumeSession: false,
    liveSemanticMessage: false,
    stdinMessage: false,
    interrupt: true,
    terminate: true,
    artifacts: true,
    detectSessionId: false,
    resumeWithMessage: false,
  },
  'generic-cli': {
    structuredEvents: false,
    terminalOutput: true,
    resumeSession: false,
    liveSemanticMessage: false,
    stdinMessage: false,
    interrupt: false,
    terminate: true,
    artifacts: false,
    detectSessionId: false,
    resumeWithMessage: false,
  },
};

export function isAgentProviderKey(value: unknown): value is AgentProviderKey {
  return typeof value === 'string' && AGENT_PROVIDER_KEYS.includes(value as AgentProviderKey);
}

export function getAgentProviderKey(value: unknown, fallback: AgentProviderKey = 'generic-cli'): AgentProviderKey {
  return isAgentProviderKey(value) ? value : fallback;
}

export function getExplicitAgentProviderKey(value: unknown): AgentProviderKey | null {
  return isAgentProviderKey(value) ? value : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getCapabilityRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function hasAgentCapabilitySignal(value: unknown) {
  const record = getCapabilityRecord(value);
  const topLevelCapabilityKeys = [
    ...AGENT_CAPABILITY_KEYS,
    'detectSessionId',
    'resumeWithMessage',
    'terminalStream',
    'terminalInput',
    'supportsArtifacts',
  ];
  const hasTopLevelSignal = topLevelCapabilityKeys.some((key) => Object.prototype.hasOwnProperty.call(record, key));
  if (hasTopLevelSignal) {
    return true;
  }

  return [
    ['terminal', ['input', 'interrupt', 'terminate']],
    ['terminalControl', ['interrupt', 'terminate']],
  ].some(([key, nestedKeys]) => {
    const nested = getCapabilityRecord(record[key as string]);
    return (nestedKeys as string[]).some((nestedKey) => Object.prototype.hasOwnProperty.call(nested, nestedKey));
  });
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function getNestedBoolean(record: JsonRecord, key: string, nestedKey: string) {
  const nested = getCapabilityRecord(record[key]);
  const value = nested[nestedKey];
  return typeof value === 'boolean' ? value : undefined;
}

function getBooleanByAliases(record: JsonRecord, aliases: string[], fallback: boolean) {
  for (const alias of aliases) {
    const value = record[alias];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return fallback;
}

function normalizeNonGenericCapabilities(provider: AgentProviderKey, raw: JsonRecord): AgentProviderCapabilities {
  const defaults = DEFAULT_AGENT_PROVIDER_CAPABILITIES[provider];
  const explicitResumeSession = typeof raw.resumeSession === 'boolean' ? raw.resumeSession : undefined;
  const explicitResumeWithMessage = typeof raw.resumeWithMessage === 'boolean' ? raw.resumeWithMessage : undefined;
  const providerCanResumeWithMessage = defaults.resumeWithMessage === true;
  const resumeSession = providerCanResumeWithMessage
    ? explicitResumeSession ?? (explicitResumeWithMessage === true ? true : defaults.resumeSession)
    : defaults.resumeSession;
  const resumeWithMessage = providerCanResumeWithMessage
    ? resumeSession && (explicitResumeWithMessage ?? defaults.resumeWithMessage)
    : defaults.resumeWithMessage;
  return {
    structuredEvents: getBoolean(raw.structuredEvents, defaults.structuredEvents),
    terminalOutput: getBooleanByAliases(raw, ['terminalOutput', 'terminalStream'], defaults.terminalOutput),
    resumeSession,
    liveSemanticMessage: false,
    stdinMessage: getBooleanByAliases(
      raw,
      ['stdinMessage', 'terminalInput'],
      getNestedBoolean(raw, 'terminal', 'input') ?? defaults.stdinMessage,
    ),
    interrupt: getBoolean(
      raw.interrupt,
      getNestedBoolean(raw, 'terminal', 'interrupt') ??
        getNestedBoolean(raw, 'terminalControl', 'interrupt') ??
        defaults.interrupt,
    ),
    terminate: getBoolean(
      raw.terminate,
      getNestedBoolean(raw, 'terminal', 'terminate') ??
        getNestedBoolean(raw, 'terminalControl', 'terminate') ??
        defaults.terminate,
    ),
    artifacts: getBooleanByAliases(raw, ['artifacts', 'supportsArtifacts'], defaults.artifacts),
    detectSessionId: getBoolean(raw.detectSessionId, defaults.detectSessionId),
    resumeWithMessage,
  };
}

export function normalizeAgentProviderCapabilities(
  providerInput: unknown,
  capabilitiesInput: unknown = {},
): JsonRecord & AgentProviderCapabilities {
  const provider = getAgentProviderKey(providerInput);
  const raw = getCapabilityRecord(capabilitiesInput);
  const normalized = normalizeNonGenericCapabilities(provider, raw);
  return {
    ...raw,
    ...normalized,
  };
}

export function isAgentCapabilitySupported(
  providerInput: unknown,
  capabilitiesInput: unknown,
  capability: AgentCapabilityKey,
) {
  const explicitCapability = getCapabilityRecord(capabilitiesInput)[capability];
  if (typeof explicitCapability === 'boolean') {
    return explicitCapability;
  }
  return normalizeAgentProviderCapabilities(providerInput, capabilitiesInput)[capability] === true;
}

export function getUnsupportedCapabilityMessage(capability: AgentCapabilityKey) {
  switch (capability) {
    case 'resumeSession':
      return 'Agent session resume is not supported by this provider';
    case 'liveSemanticMessage':
      return 'Agent session live message is not supported by this provider';
    case 'stdinMessage':
      return 'Agent CLI stdin message is not supported by this provider';
    case 'interrupt':
      return 'Agent CLI interrupt is not supported by this provider';
    case 'terminate':
      return 'Agent CLI terminate is not supported by this provider';
    case 'terminalOutput':
      return 'Agent CLI terminal output is not supported by this provider';
    case 'artifacts':
      return 'Agent artifacts are not supported by this provider';
    case 'structuredEvents':
      return 'Structured agent events are not supported by this provider';
    default:
      return 'Agent provider capability is not supported';
  }
}
