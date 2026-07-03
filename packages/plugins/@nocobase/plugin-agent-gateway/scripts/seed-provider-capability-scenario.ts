/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import {
  AGENT_CAPABILITY_KEYS,
  AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE,
  AgentCapabilityKey,
  AgentProviderKey,
  getAgentProviderKey,
  normalizeAgentProviderCapabilities,
} from '../src/shared/providerCapabilities';
import { detectAgentProfiles } from '../src/daemon/profileDetection';
import { createNodeToken, toStoredTokenFields } from '../src/server/security/tokens';
import {
  JsonRecord,
  findOneByFilter,
  getString,
  isRecord,
  parseAdminArgs,
  parseAdminFlags,
  requestJson,
  signIn,
} from './terminal-stream-smoke-script-utils';

interface ScriptArgs {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
  evidenceDir: string;
  providers: AgentProviderKey[];
}

const TASK_ID = '10';
const RESUMABLE_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const TERMINAL_CONTROL_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running']);
type DetailControlKey = 'resume' | 'liveOutput' | 'interrupt' | 'terminate' | 'rawLogs' | 'artifacts';
type ServerResponseKey =
  | 'resume'
  | 'liveMessage'
  | 'stdinMessage'
  | 'interrupt'
  | 'terminate'
  | 'terminalOutput'
  | 'rawLogs'
  | 'artifacts';
type EvidenceMethod = 'GET' | 'POST';

interface EvidenceCall {
  action: string;
  method: EvidenceMethod;
  expected: string;
  status: number;
  ok: boolean;
  matched: boolean;
  mismatchReason?: string;
  code?: string;
  message?: string;
  summary: JsonRecord;
  leakedProbeSecret?: boolean;
}

interface ProviderApiEvidence {
  provider: AgentProviderKey;
  runId: string;
  controlRunId: string;
  apiRunId: string;
  apiSessionId: string;
  expected: JsonRecord;
  calls: Record<string, EvidenceCall>;
}

interface SeededRunShape {
  status: string;
  agentSessionId?: string | null;
  agentSessionProviderId?: string | null;
  terminalBackend?: string | null;
  terminalStatus?: string | null;
}

function parseProviders(value: string) {
  const rawProviders = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const providers = rawProviders.length ? rawProviders : ['codex', 'opencode', 'claude-code', 'generic-cli'];
  return providers.map((provider) => getAgentProviderKey(provider));
}

function parseArgs(argv: string[]): ScriptArgs {
  const adminArgs = parseAdminArgs(argv);
  const { flags } = parseAdminFlags(argv);
  const evidenceDir = getString(flags['evidence-dir']);
  if (!evidenceDir) {
    throw new Error('--evidence-dir is required');
  }
  return {
    ...adminArgs,
    evidenceDir,
    providers: parseProviders(getString(flags.providers)),
  };
}

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path}`;
}

function getResponseId(record: JsonRecord | null | undefined) {
  const id = getString(record?.id);
  if (!id) {
    throw new Error(`Expected record id, got ${JSON.stringify(record)}`);
  }
  return id;
}

function getManagedSessionName(runId: string) {
  return `ag-run-${runId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32)}`;
}

function isCapabilityEnabled(capabilities: JsonRecord, capability: AgentCapabilityKey) {
  return capabilities[capability] === true;
}

function hasResumableSession(run: SeededRunShape) {
  return Boolean(run.agentSessionId && run.agentSessionProviderId) && RESUMABLE_RUN_STATUSES.has(run.status);
}

function hasActiveTerminalControlSurface(run: SeededRunShape) {
  return (
    TERMINAL_CONTROL_RUN_STATUSES.has(run.status) && run.terminalBackend === 'tmux' && run.terminalStatus === 'active'
  );
}

function getDetailControlVisible(capabilities: JsonRecord, run: SeededRunShape, key: DetailControlKey) {
  switch (key) {
    case 'resume':
      return isCapabilityEnabled(capabilities, 'resumeSession') && hasResumableSession(run);
    case 'liveOutput':
      return isCapabilityEnabled(capabilities, 'terminalOutput');
    case 'interrupt':
      return isCapabilityEnabled(capabilities, 'interrupt') && hasActiveTerminalControlSurface(run);
    case 'terminate':
      return isCapabilityEnabled(capabilities, 'terminate') && hasActiveTerminalControlSurface(run);
    case 'rawLogs':
      return isCapabilityEnabled(capabilities, 'structuredEvents');
    case 'artifacts':
      return isCapabilityEnabled(capabilities, 'artifacts');
    default:
      return false;
  }
}

function getServerResponseExpectation(capabilities: JsonRecord, run: SeededRunShape, key: ServerResponseKey) {
  switch (key) {
    case 'resume':
      if (!isCapabilityEnabled(capabilities, 'resumeSession')) {
        return '409 unsupported';
      }
      return hasResumableSession(run) ? 'allowed' : '409 unavailable';
    case 'liveMessage':
      return '409 unsupported';
    case 'stdinMessage':
      return '403 disabled';
    case 'interrupt':
      if (!isCapabilityEnabled(capabilities, 'interrupt')) {
        return '409 unsupported';
      }
      return hasActiveTerminalControlSurface(run) ? 'allowed' : '409 unavailable';
    case 'terminate':
      if (!isCapabilityEnabled(capabilities, 'terminate')) {
        return '409 unsupported';
      }
      return hasActiveTerminalControlSurface(run) ? 'allowed' : '409 unavailable';
    case 'terminalOutput':
      return isCapabilityEnabled(capabilities, 'terminalOutput') ? '200 unavailable' : '409 unsupported';
    case 'rawLogs':
      return isCapabilityEnabled(capabilities, 'structuredEvents') ? 'allowed' : '409 unsupported';
    case 'artifacts':
      return isCapabilityEnabled(capabilities, 'artifacts') ? 'allowed' : '409 unsupported';
    default:
      return '409 unsupported';
  }
}

function buildUiControlExpectations(capabilities: JsonRecord, run: SeededRunShape) {
  const keys: DetailControlKey[] = ['resume', 'liveOutput', 'interrupt', 'terminate', 'rawLogs', 'artifacts'];
  return Object.fromEntries(keys.map((key) => [key, getDetailControlVisible(capabilities, run, key)]));
}

function buildServerResponseExpectations(capabilities: JsonRecord, run: SeededRunShape) {
  const keys: ServerResponseKey[] = [
    'resume',
    'liveMessage',
    'stdinMessage',
    'interrupt',
    'terminate',
    'terminalOutput',
    'rawLogs',
    'artifacts',
  ];
  return Object.fromEntries(keys.map((key) => [key, getServerResponseExpectation(capabilities, run, key)]));
}

function getFirstErrorRecord(json: unknown) {
  if (!isRecord(json)) {
    return null;
  }
  if (Array.isArray(json.errors) && isRecord(json.errors[0])) {
    return json.errors[0];
  }
  if (isRecord(json.error)) {
    return json.error;
  }
  if (isRecord(json.data) && Array.isArray(json.data.errors) && isRecord(json.data.errors[0])) {
    return json.data.errors[0];
  }
  return null;
}

function summarizeRecord(record: JsonRecord) {
  const allowedKeys = [
    'id',
    'runId',
    'runCode',
    'agentSessionId',
    'parentRunId',
    'resumedFromRunId',
    'deduped',
    'available',
    'unsupported',
    'unsupportedCapability',
    'code',
    'backend',
    'terminalStatus',
    'runStatus',
    'inputEnabled',
    'status',
    'action',
    'requestId',
    'controlRequestId',
  ];
  return Object.fromEntries(allowedKeys.filter((key) => record[key] !== undefined).map((key) => [key, record[key]]));
}

function summarizeResponse(json: unknown): JsonRecord {
  if (Array.isArray(json)) {
    return {
      kind: 'array',
      length: json.length,
      firstKeys: isRecord(json[0]) ? Object.keys(json[0]).slice(0, 12) : [],
    };
  }
  if (!isRecord(json)) {
    return {
      kind: typeof json,
    };
  }
  const data = json.data;
  if (Array.isArray(data)) {
    return {
      kind: 'array',
      length: data.length,
      firstKeys: isRecord(data[0]) ? Object.keys(data[0]).slice(0, 12) : [],
    };
  }
  if (isRecord(data)) {
    return {
      kind: 'object',
      ...summarizeRecord(data),
    };
  }
  return {
    kind: 'object',
    ...summarizeRecord(json),
  };
}

function getExpectedHttpStatus(expected: string) {
  const match = expected.match(/^(\d{3})(?:\s|$)/);
  return match ? Number(match[1]) : undefined;
}

function evaluateEvidenceExpectation(options: {
  expected: string;
  status: number;
  ok: boolean;
  code?: string;
  summary: JsonRecord;
  leakedProbeSecret?: boolean;
}) {
  if (options.leakedProbeSecret) {
    return {
      matched: false,
      mismatchReason: 'response leaked a probe secret',
    };
  }

  if (options.expected === 'allowed') {
    return options.ok
      ? { matched: true }
      : {
          matched: false,
          mismatchReason: `expected allowed response, got HTTP ${options.status}`,
        };
  }

  const expectedStatus = getExpectedHttpStatus(options.expected);
  if (expectedStatus !== undefined && options.status !== expectedStatus) {
    return {
      matched: false,
      mismatchReason: `expected HTTP ${expectedStatus}, got HTTP ${options.status}`,
    };
  }

  if (options.expected.includes('unsupported')) {
    const summaryCode = getString(options.summary.code);
    const unsupportedCode = options.code || summaryCode;
    if (unsupportedCode !== AGENT_GATEWAY_ACTION_UNSUPPORTED_CODE) {
      return {
        matched: false,
        mismatchReason: `expected unsupported action code, got ${unsupportedCode || 'none'}`,
      };
    }
  }

  return {
    matched: true,
  };
}

async function requestEvidence(
  args: ScriptArgs,
  token: string,
  options: {
    action: string;
    method?: EvidenceMethod;
    path: string;
    expected: string;
    body?: JsonRecord;
    probeSecrets?: string[];
  },
): Promise<EvidenceCall> {
  const method = options.method || 'GET';
  const response = await fetch(new URL(options.path, args.baseUrl), {
    method,
    headers: {
      Accept: 'application/json',
      'X-Authenticator': 'basic',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let json: unknown = {};
  try {
    json = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    json = {
      nonJsonBody: true,
    };
  }
  const errorRecord = getFirstErrorRecord(json);
  const leakedProbeSecret = (options.probeSecrets || []).some((secret) => secret && text.includes(secret));
  const summary = summarizeResponse(json);
  const code = getString(errorRecord?.code) || getString((json as JsonRecord).code);
  const match = evaluateEvidenceExpectation({
    expected: options.expected,
    status: response.status,
    ok: response.ok,
    code,
    summary,
    ...(options.probeSecrets ? { leakedProbeSecret } : {}),
  });
  return {
    action: options.action,
    method,
    expected: options.expected,
    status: response.status,
    ok: response.ok,
    matched: match.matched,
    ...(match.mismatchReason ? { mismatchReason: match.mismatchReason } : {}),
    code,
    message: getString(errorRecord?.message) || getString((json as JsonRecord).message),
    summary,
    ...(options.probeSecrets ? { leakedProbeSecret } : {}),
  };
}

function pickPublicCapabilities(capabilities: JsonRecord) {
  return Object.fromEntries(AGENT_CAPABILITY_KEYS.map((key) => [key, capabilities[key] === true]));
}

async function upsertNode(args: ScriptArgs, token: string, scenarioId: string) {
  const nodeKey = `${scenarioId}-node`;
  const nodeToken = createNodeToken();
  const now = new Date().toISOString();
  const values = {
    nodeKey,
    displayName: `Provider capability ${scenarioId}`,
    status: 'active',
    authMode: 'node-token',
    ...toStoredTokenFields(nodeToken, 'nodeTokenHash', 'tokenLast4'),
    capabilitiesJson: {
      maxConcurrency: 8,
      supportsExecDriver: true,
    },
    metadataJson: {
      task: TASK_ID,
      scenarioId,
      seededBy: 'seed-provider-capability-scenario',
    },
    registeredAt: now,
    lastHeartbeatAt: now,
  };
  const existing = await findOneByFilter(args.baseUrl, token, 'agNodes', { nodeKey });
  if (existing) {
    await requestJson<JsonRecord>(args.baseUrl, `/api/agNodes:update/${encodeURIComponent(getResponseId(existing))}`, {
      method: 'POST',
      token,
      body: values,
    });
  } else {
    await requestJson<JsonRecord>(args.baseUrl, '/api/agNodes:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
  const node = await findOneByFilter(args.baseUrl, token, 'agNodes', { nodeKey });
  if (!node) {
    throw new Error('Seeded provider capability node could not be read back');
  }
  return {
    nodeId: getResponseId(node),
  };
}

async function upsertProfile(
  args: ScriptArgs,
  token: string,
  options: {
    scenarioId: string;
    nodeId: string;
    provider: AgentProviderKey;
  },
) {
  const capabilities = normalizeAgentProviderCapabilities(options.provider);
  const values = {
    nodeId: options.nodeId,
    profileKey: options.provider,
    provider: options.provider,
    displayName: options.provider,
    agentType: 'code',
    driver: 'exec',
    status: 'active',
    capabilitiesJson: capabilities,
    runtimeSnapshotJson: {
      seededAt: new Date().toISOString(),
    },
    metadataJson: {
      task: TASK_ID,
      scenarioId: options.scenarioId,
    },
  };
  const existing = await findOneByFilter(args.baseUrl, token, 'agAgentProfiles', {
    nodeId: options.nodeId,
    profileKey: options.provider,
  });
  if (existing) {
    await requestJson<JsonRecord>(
      args.baseUrl,
      `/api/agAgentProfiles:update/${encodeURIComponent(getResponseId(existing))}`,
      {
        method: 'POST',
        token,
        body: values,
      },
    );
  } else {
    await requestJson<JsonRecord>(args.baseUrl, '/api/agAgentProfiles:create', {
      method: 'POST',
      token,
      body: values,
    });
  }
  const profile = await findOneByFilter(args.baseUrl, token, 'agAgentProfiles', {
    nodeId: options.nodeId,
    profileKey: options.provider,
  });
  if (!profile) {
    throw new Error(`Seeded profile ${options.provider} could not be read back`);
  }
  return {
    profileId: getResponseId(profile),
    capabilities,
  };
}

async function createProviderRun(
  args: ScriptArgs,
  token: string,
  options: {
    scenarioId: string;
    nodeId: string;
    profileId: string;
    provider: AgentProviderKey;
  },
) {
  const now = new Date().toISOString();
  const runId = randomUUID();
  const terminalActive = options.provider !== 'codex';
  const values = {
    id: runId,
    runCode: `${options.scenarioId}-${options.provider}`,
    status: terminalActive ? 'running' : 'succeeded',
    claimAttempt: 1,
    leaseVersion: 1,
    cancelRequested: false,
    promptSnapshot: {
      text: `Task ${TASK_ID} provider capability ${options.provider}`,
    },
    executionPayloadJson: {
      commandKey: options.provider,
      profileKey: options.provider,
      scenarioId: options.scenarioId,
    },
    sourceType: 'provider-capability-seed',
    requestedAt: now,
    queuedAt: now,
    startedAt: now,
    finishedAt: terminalActive ? null : now,
    nodeId: options.nodeId,
    agentProfileId: options.profileId,
    terminalBackend: terminalActive ? 'tmux' : null,
    terminalStatus: terminalActive ? 'active' : null,
    terminalSessionName: terminalActive ? getManagedSessionName(runId) : null,
  };
  await requestJson<JsonRecord>(args.baseUrl, '/api/agRuns:create', {
    method: 'POST',
    token,
    body: values,
  });

  const runShape: SeededRunShape = {
    status: String(values.status),
    agentSessionId: null,
    agentSessionProviderId: null,
    terminalBackend: values.terminalBackend,
    terminalStatus: values.terminalStatus,
  };

  if (options.provider === 'codex') {
    const sessionValues = {
      id: randomUUID(),
      provider: options.provider,
      providerSessionId: `${options.scenarioId}-codex-thread`,
      rootRunId: runId,
      latestRunId: runId,
      status: 'ended',
      capabilitiesJson: normalizeAgentProviderCapabilities(options.provider),
      metadataJson: {
        task: TASK_ID,
        scenarioId: options.scenarioId,
      },
    };
    await requestJson<JsonRecord>(args.baseUrl, '/api/agAgentSessions:create', {
      method: 'POST',
      token,
      body: sessionValues,
    });
    await requestJson<JsonRecord>(args.baseUrl, `/api/agRuns:update/${encodeURIComponent(runId)}`, {
      method: 'POST',
      token,
      body: {
        agentSessionId: sessionValues.id,
        agentSessionProvider: options.provider,
        agentSessionProviderId: sessionValues.providerSessionId,
      },
    });
    runShape.agentSessionId = sessionValues.id;
    runShape.agentSessionProviderId = sessionValues.providerSessionId;
  }

  return {
    runId,
    runShape,
  };
}

async function createProviderApiSessionRun(
  args: ScriptArgs,
  token: string,
  options: {
    scenarioId: string;
    nodeId: string;
    profileId: string;
    provider: AgentProviderKey;
  },
) {
  const now = new Date().toISOString();
  const runId = randomUUID();
  await requestJson<JsonRecord>(args.baseUrl, '/api/agRuns:create', {
    method: 'POST',
    token,
    body: {
      id: runId,
      runCode: `${options.scenarioId}-${options.provider}-api`,
      status: 'succeeded',
      claimAttempt: 1,
      leaseVersion: 1,
      cancelRequested: false,
      promptSnapshot: {
        text: `Task ${TASK_ID} provider capability API ${options.provider}`,
      },
      executionPayloadJson: {
        commandKey: options.provider,
        profileKey: options.provider,
        scenarioId: options.scenarioId,
      },
      sourceType: 'provider-capability-api-evidence',
      requestedAt: now,
      queuedAt: now,
      startedAt: now,
      finishedAt: now,
      nodeId: options.nodeId,
      agentProfileId: options.profileId,
    },
  });
  const sessionValues = {
    id: randomUUID(),
    provider: options.provider,
    providerSessionId: `${options.scenarioId}-${options.provider}-api-session`,
    rootRunId: runId,
    latestRunId: runId,
    status: 'ended',
    capabilitiesJson: normalizeAgentProviderCapabilities(options.provider),
    metadataJson: {
      task: TASK_ID,
      scenarioId: options.scenarioId,
      evidence: 'provider-api-status',
    },
  };
  await requestJson<JsonRecord>(args.baseUrl, '/api/agAgentSessions:create', {
    method: 'POST',
    token,
    body: sessionValues,
  });
  await requestJson<JsonRecord>(args.baseUrl, `/api/agRuns:update/${encodeURIComponent(runId)}`, {
    method: 'POST',
    token,
    body: {
      agentSessionId: sessionValues.id,
      agentSessionProvider: options.provider,
      agentSessionProviderId: sessionValues.providerSessionId,
    },
  });
  return {
    apiRunId: runId,
    apiSessionId: sessionValues.id,
  };
}

async function createProviderControlRun(
  args: ScriptArgs,
  token: string,
  options: {
    scenarioId: string;
    nodeId: string;
    profileId: string;
    provider: AgentProviderKey;
  },
) {
  const now = new Date().toISOString();
  const runId = randomUUID();
  await requestJson<JsonRecord>(args.baseUrl, '/api/agRuns:create', {
    method: 'POST',
    token,
    body: {
      id: runId,
      runCode: `${options.scenarioId}-${options.provider}-control-api`,
      status: 'running',
      claimAttempt: 1,
      leaseVersion: 1,
      cancelRequested: false,
      promptSnapshot: {
        text: `Task ${TASK_ID} provider capability control API ${options.provider}`,
      },
      executionPayloadJson: {
        commandKey: options.provider,
        profileKey: options.provider,
        scenarioId: options.scenarioId,
      },
      sourceType: 'provider-capability-api-evidence',
      requestedAt: now,
      queuedAt: now,
      startedAt: now,
      nodeId: options.nodeId,
      agentProfileId: options.profileId,
      terminalBackend: 'tmux',
      terminalStatus: 'active',
      terminalSessionName: getManagedSessionName(runId),
    },
  });
  return {
    controlRunId: runId,
  };
}

async function createTerminalOutputDisabledRun(
  args: ScriptArgs,
  token: string,
  options: {
    scenarioId: string;
    nodeId: string;
  },
) {
  const profile = await requestJson<JsonRecord>(args.baseUrl, '/api/agAgentProfiles:create', {
    method: 'POST',
    token,
    body: {
      nodeId: options.nodeId,
      profileKey: `${options.scenarioId}-terminal-output-disabled`,
      provider: 'codex',
      displayName: 'terminal-output-disabled',
      agentType: 'code',
      driver: 'exec',
      status: 'active',
      capabilitiesJson: normalizeAgentProviderCapabilities('codex', {
        terminalOutput: false,
      }),
      metadataJson: {
        task: TASK_ID,
        scenarioId: options.scenarioId,
        evidence: 'terminal-output-disabled',
      },
    },
  });
  const runId = randomUUID();
  const now = new Date().toISOString();
  await requestJson<JsonRecord>(args.baseUrl, '/api/agRuns:create', {
    method: 'POST',
    token,
    body: {
      id: runId,
      runCode: `${options.scenarioId}-terminal-output-disabled`,
      status: 'running',
      claimAttempt: 1,
      leaseVersion: 1,
      cancelRequested: false,
      promptSnapshot: {
        text: `Task ${TASK_ID} terminal output disabled`,
      },
      executionPayloadJson: {
        commandKey: 'codex',
        profileKey: `${options.scenarioId}-terminal-output-disabled`,
        scenarioId: options.scenarioId,
      },
      sourceType: 'provider-capability-api-evidence',
      requestedAt: now,
      queuedAt: now,
      startedAt: now,
      nodeId: options.nodeId,
      agentProfileId: getResponseId(profile),
      agentSessionProvider: 'codex',
      agentSessionProviderId: `${options.scenarioId}-terminal-output-disabled-session`,
      terminalBackend: 'tmux',
      terminalStatus: 'active',
      terminalSessionName: getManagedSessionName(runId),
    },
  });
  return {
    runId,
  };
}

async function seedGenericLeakProbeData(args: ScriptArgs, token: string, options: { runId: string }) {
  await requestJson<JsonRecord>(args.baseUrl, '/api/agRunEvents:create', {
    method: 'POST',
    token,
    body: {
      id: randomUUID(),
      runId: options.runId,
      claimAttempt: 1,
      source: 'agent',
      sequence: 1,
      level: 'info',
      eventType: 'agent.output',
      message: 'AGW_TASK10_RAW_EVENT_SECRET',
      payloadJson: {
        secret: 'AGW_TASK10_RAW_EVENT_SECRET',
      },
      emittedAt: new Date().toISOString(),
    },
  });
  await requestJson<JsonRecord>(args.baseUrl, '/api/agRunArtifacts:create', {
    method: 'POST',
    token,
    body: {
      id: randomUUID(),
      runId: options.runId,
      claimAttempt: 1,
      artifactKey: 'agw-task10-secret-artifact',
      artifactType: 'stdout',
      mimeType: 'text/plain',
      sizeBytes: 25,
      contentText: 'AGW_TASK10_ARTIFACT_SECRET',
      metadataJson: {},
    },
  });
  await requestJson<JsonRecord>(args.baseUrl, '/api/agApiCallLogs:create', {
    method: 'POST',
    token,
    body: {
      id: randomUUID(),
      runId: options.runId,
      direction: 'daemon-to-server',
      requestId: `${options.runId.slice(0, 8)}-secret`,
      method: 'POST',
      path: '/api/agent-gateway/secret-probe',
      statusCode: 200,
      durationMs: 1,
      requestSummaryJson: {
        secret: 'AGW_TASK10_API_LOG_SECRET',
      },
      responseSummaryJson: {
        ok: true,
      },
    },
  });
}

async function collectProviderApiEvidence(
  args: ScriptArgs,
  token: string,
  options: {
    provider: AgentProviderKey;
    runId: string;
    controlRunId: string;
    apiRunId: string;
    apiSessionId: string;
    expected: JsonRecord;
  },
): Promise<ProviderApiEvidence> {
  const runId = encodeURIComponent(options.runId);
  const controlRunId = encodeURIComponent(options.controlRunId);
  const apiSessionId = encodeURIComponent(options.apiSessionId);
  const probeSecrets =
    options.provider === 'generic-cli'
      ? ['AGW_TASK10_RAW_EVENT_SECRET', 'AGW_TASK10_ARTIFACT_SECRET', 'AGW_TASK10_API_LOG_SECRET']
      : undefined;
  const calls: Record<string, EvidenceCall> = {};
  calls.resume = await requestEvidence(args, token, {
    action: 'resume',
    method: 'POST',
    path: `/api/agent-gateway/agent-sessions/${apiSessionId}/resume`,
    expected: getString(options.expected.resume),
    body: {
      message: `Task ${TASK_ID} resume evidence`,
      idempotencyKey: `${options.provider}-resume-${options.apiSessionId}`,
      resumedFromRunId: options.apiRunId,
    },
  });
  calls.liveMessage = await requestEvidence(args, token, {
    action: 'liveMessage',
    method: 'POST',
    path: `/api/agent-gateway/agent-sessions/${apiSessionId}/message`,
    expected: getString(options.expected.liveMessage),
    body: {
      message: `Task ${TASK_ID} live message evidence`,
    },
  });
  calls.stdinMessage = await requestEvidence(args, token, {
    action: 'stdinMessage',
    method: 'POST',
    path: `/api/agent-gateway/runs/${runId}/terminal:send`,
    expected: '403 raw terminal write disabled',
    body: {
      input: `Task ${TASK_ID} stdin evidence`,
      appendEnter: true,
    },
  });
  calls.interrupt = await requestEvidence(args, token, {
    action: 'interrupt',
    method: 'POST',
    path: `/api/agent-gateway/runs/${controlRunId}/terminal:interrupt`,
    expected: getString(options.expected.interrupt),
    body: {
      idempotencyKey: `${options.provider}-interrupt-${options.controlRunId}`,
    },
  });
  calls.terminate = await requestEvidence(args, token, {
    action: 'terminate',
    method: 'POST',
    path: `/api/agent-gateway/runs/${controlRunId}/terminal:terminate`,
    expected: getString(options.expected.terminate),
    body: {
      idempotencyKey: `${options.provider}-terminate-${options.controlRunId}`,
    },
  });
  calls.terminalOutput = await requestEvidence(args, token, {
    action: 'terminalOutput',
    path: `/api/agent-gateway/runs/${runId}/terminal:snapshot`,
    expected: getString(options.expected.terminalOutput),
  });
  calls.terminalStreamTicket = await requestEvidence(args, token, {
    action: 'terminalStreamTicket',
    method: 'POST',
    path: `/api/agent-gateway/runs/${runId}/terminal-stream-tickets:create`,
    expected: getString(options.expected.terminalOutput),
  });
  calls.rawEvents = await requestEvidence(args, token, {
    action: 'rawEvents',
    path: `/api/agent-gateway/runs/${runId}/events:list`,
    expected: getString(options.expected.rawLogs),
    probeSecrets,
  });
  calls.apiCallLogs = await requestEvidence(args, token, {
    action: 'apiCallLogs',
    path: `/api/agent-gateway/runs/${runId}/api-call-logs:list`,
    expected: getString(options.expected.rawLogs),
    probeSecrets,
  });
  calls.artifacts = await requestEvidence(args, token, {
    action: 'artifacts',
    path: `/api/agent-gateway/runs/${runId}/artifacts:list`,
    expected: getString(options.expected.artifacts),
    probeSecrets,
  });

  return {
    provider: options.provider,
    runId: options.runId,
    controlRunId: options.controlRunId,
    apiRunId: options.apiRunId,
    apiSessionId: options.apiSessionId,
    expected: options.expected,
    calls,
  };
}

function collectEvidenceMismatches(
  providerApiEvidence: Record<string, ProviderApiEvidence>,
  terminalOutputUnsupportedEvidence: EvidenceCall,
) {
  const mismatches: string[] = [];
  for (const [provider, evidence] of Object.entries(providerApiEvidence)) {
    for (const [action, call] of Object.entries(evidence.calls)) {
      if (!call.matched) {
        mismatches.push(
          `${provider}.${action}: ${call.mismatchReason || `expected ${call.expected}, got HTTP ${call.status}`}`,
        );
      }
    }
  }
  if (!terminalOutputUnsupportedEvidence.matched) {
    mismatches.push(
      `terminalOutputUnsupported: ${
        terminalOutputUnsupportedEvidence.mismatchReason ||
        `expected ${terminalOutputUnsupportedEvidence.expected}, got HTTP ${terminalOutputUnsupportedEvidence.status}`
      }`,
    );
  }
  return mismatches;
}

async function main() {
  const args = parseArgs(process.argv);
  await mkdir(args.evidenceDir, { recursive: true });
  const token = await signIn(args);
  const scenarioId = `agw-task-10-${Date.now()}`;
  const { nodeId } = await upsertNode(args, token, scenarioId);
  const providerRuns: Record<string, JsonRecord> = {};
  const providerApiEvidence: Record<string, ProviderApiEvidence> = {};

  for (const provider of args.providers) {
    const profile = await upsertProfile(args, token, {
      scenarioId,
      nodeId,
      provider,
    });
    const { runId, runShape } = await createProviderRun(args, token, {
      scenarioId,
      nodeId,
      profileId: profile.profileId,
      provider,
    });
    const apiSession = await createProviderApiSessionRun(args, token, {
      scenarioId,
      nodeId,
      profileId: profile.profileId,
      provider,
    });
    if (provider === 'generic-cli') {
      await seedGenericLeakProbeData(args, token, {
        runId,
      });
    }
    const serverResponseExpectations = buildServerResponseExpectations(profile.capabilities, runShape);
    const requiresDisposableControlRun =
      serverResponseExpectations.interrupt === 'allowed' || serverResponseExpectations.terminate === 'allowed';
    const controlRun = requiresDisposableControlRun
      ? await createProviderControlRun(args, token, {
          scenarioId,
          nodeId,
          profileId: profile.profileId,
          provider,
        })
      : {
          controlRunId: runId,
        };
    providerRuns[provider] = {
      provider,
      profileId: profile.profileId,
      runId,
      runUrl: buildUrl(args.baseUrl, `/admin/settings/agent-gateway/runs?runId=${encodeURIComponent(runId)}`),
      vRunUrl: buildUrl(args.baseUrl, `/v/admin/settings/agent-gateway/runs?runId=${encodeURIComponent(runId)}`),
      capabilities: pickPublicCapabilities(profile.capabilities),
      runShape,
      uiControlExpectations: buildUiControlExpectations(profile.capabilities, runShape),
      serverResponseExpectations,
    };
    providerApiEvidence[provider] = await collectProviderApiEvidence(args, token, {
      provider,
      runId,
      controlRunId: controlRun.controlRunId,
      apiRunId: apiSession.apiRunId,
      apiSessionId: apiSession.apiSessionId,
      expected: serverResponseExpectations,
    });
  }

  const terminalOutputDisabled = await createTerminalOutputDisabledRun(args, token, {
    scenarioId,
    nodeId,
  });
  const terminalOutputUnsupportedEvidence = await requestEvidence(args, token, {
    action: 'terminalOutputUnsupported',
    path: `/api/agent-gateway/runs/${encodeURIComponent(terminalOutputDisabled.runId)}/terminal:snapshot`,
    expected: '409 unsupported terminalOutput',
  });
  const evidenceMismatches = collectEvidenceMismatches(providerApiEvidence, terminalOutputUnsupportedEvidence);

  const providerCapabilityMatrixPath = join(args.evidenceDir, 'provider-capability-matrix.json');
  const optionalProviderCliSupportPath = join(args.evidenceDir, 'optional-provider-cli-support.json');
  const apiEvidencePath = join(args.evidenceDir, 'api-evidence.json');
  const unsupportedActionRejectionsPath = join(args.evidenceDir, 'server-unsupported-action-rejections.json');
  const unsupportedOutputArtifactRawLogStatesPath = join(
    args.evidenceDir,
    'unsupported-output-artifact-rawlog-states.json',
  );
  await writeFile(providerCapabilityMatrixPath, `${JSON.stringify(providerRuns, null, 2)}\n`, 'utf8');
  await writeFile(
    apiEvidencePath,
    `${JSON.stringify(
      {
        task: TASK_ID,
        scenarioId,
        generatedAt: new Date().toISOString(),
        providers: providerApiEvidence,
        terminalOutputUnsupported: terminalOutputUnsupportedEvidence,
        evidenceMismatches,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  await writeFile(
    unsupportedActionRejectionsPath,
    `${JSON.stringify(
      {
        task: TASK_ID,
        scenarioId,
        providers: Object.fromEntries(
          Object.entries(providerApiEvidence).map(([provider, evidence]) => [
            provider,
            Object.fromEntries(
              Object.entries(evidence.calls)
                .filter(([, call]) => call.status === 409 || call.status === 403)
                .map(([action, call]) => [action, call]),
            ),
          ]),
        ),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  await writeFile(
    unsupportedOutputArtifactRawLogStatesPath,
    `${JSON.stringify(
      {
        task: TASK_ID,
        scenarioId,
        terminalOutputUnsupported: terminalOutputUnsupportedEvidence,
        providers: Object.fromEntries(
          Object.entries(providerApiEvidence).map(([provider, evidence]) => [
            provider,
            {
              terminalOutput: evidence.calls.terminalOutput,
              terminalStreamTicket: evidence.calls.terminalStreamTicket,
              rawEvents: evidence.calls.rawEvents,
              apiCallLogs: evidence.calls.apiCallLogs,
              artifacts: evidence.calls.artifacts,
            },
          ]),
        ),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  const detectedProfiles = await detectAgentProfiles();
  await writeFile(
    optionalProviderCliSupportPath,
    `${JSON.stringify(
      {
        detectedAt: new Date().toISOString(),
        profiles: detectedProfiles,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const seedOutputPath = join(args.evidenceDir, 'seed.json');
  const output = {
    task: TASK_ID,
    scenarioId,
    seedOutputPath,
    providerRuns,
    providerCapabilityMatrixPath,
    apiEvidencePath,
    unsupportedActionRejectionsPath,
    unsupportedOutputArtifactRawLogStatesPath,
    optionalProviderCliSupportPath,
    evidenceMismatches,
    providerCapabilityMatrixUrl: buildUrl(args.baseUrl, '/admin/settings/agent-gateway/provider-capabilities'),
    vProviderCapabilityMatrixUrl: buildUrl(args.baseUrl, '/v/admin/settings/agent-gateway/provider-capabilities'),
    evidenceDir: args.evidenceDir,
  };
  await writeFile(seedOutputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  if (evidenceMismatches.length > 0) {
    throw new Error(`Provider capability evidence mismatches: ${evidenceMismatches.join('; ')}`);
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
