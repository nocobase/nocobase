/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { createInterface } from 'readline';

import { buildTextArtifactUpload } from './artifactUpload';
import { getAgentAdapter } from './adapters';
import { AgentGatewayDaemonNodeClient } from './gateway';
import { TerminalEnd } from '../shared/terminalStreamProtocol';
import {
  ExecCommandAllowlist,
  ExecDriverResult,
  ExecTerminalStatus,
  executeAllowlistedCommand,
  getAllowlistedDefinition,
} from './execDriver';
import { detectAgentProfiles, DetectAgentProfilesOptions } from './profileDetection';
import {
  SkillVersionInstallRecord,
  SkillVersionSource,
  syncNodeSkillVersion,
  SyncNodeSkillVersionResult,
} from './skillSync';
import { JsonRecord, PendingControlRequest, RunLease } from './types';
import { TerminalRingBuffer } from './terminalRingBuffer';
import { DaemonTerminalStreamClient, DaemonTerminalStreamClientOptions } from './terminalStreamClient';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../shared/runControl';
import {
  AgentProviderKey,
  hasAgentCapabilitySignal,
  getExplicitAgentProviderKey,
  normalizeAgentProviderCapabilities,
} from '../shared/providerCapabilities';
import {
  executeTmuxCommand,
  getManagedTmuxSessionName,
  interruptTmuxSession,
  TMUX_TERMINATE_CANCEL_REASON,
  terminateTmuxSession,
} from './tmuxTerminal';

export interface RunDaemonOnceOptions {
  gateway: AgentGatewayDaemonNodeClient;
  allowlist: ExecCommandAllowlist;
  workspaceRoot: string;
  skillsRoot: string;
  artifactDir: string;
  terminalBackend?: 'exec' | 'tmux';
  detectOptions?: DetectAgentProfilesOptions;
  claimProfileKey?: string;
  claimRunId?: string;
  runHeartbeatIntervalMs?: number;
  syncSkillVersion?: typeof syncNodeSkillVersion;
  executeCommand?: typeof executeAllowlistedCommand;
  terminalRingBufferMaxBytes?: number;
  terminalStreamClientFactory?: (options: DaemonTerminalStreamClientOptions) => TerminalStreamHandle;
}

export interface DaemonRunLoopOptions extends RunDaemonOnceOptions {
  pollIntervalMs?: number;
  stopSignal?: AbortSignal;
}

export interface DaemonRunOnceResult {
  status: 'idle' | 'succeeded' | 'failed' | 'timeout' | 'canceled' | 'lease_lost';
  runId?: string;
  reason?: string;
}

const DEFAULT_RUN_HEARTBEAT_INTERVAL_MS = 10_000;
const MAX_PROVIDER_SESSION_SCAN_BYTES = 256 * 1024;
const PROVIDER_SESSION_UPSERT_MAX_ATTEMPTS = 3;
const PROVIDER_SESSION_UPSERT_RETRY_DELAY_MS = 250;
const MAX_CONVERSATION_EVENTS_PER_APPEND = 100;

interface TerminalStreamHandle {
  start(): Promise<void>;
  appendText(text: string): Promise<void>;
  end(reason: TerminalEnd['reason']): Promise<void>;
  close(): void;
}

type AgentCommandOutputMode = 'structured' | 'terminal';

interface ExecutionCommandSpec {
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

function getPayload(lease: RunLease) {
  const run = isRecord(lease.run) ? lease.run : {};
  return isRecord(run.executionPayloadJson) ? run.executionPayloadJson : {};
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

function getNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined;
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

function getCanonicalProvider(lease: RunLease, payload: JsonRecord) {
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
  if (commandProvider) {
    return commandProvider === provider ? provider : undefined;
  }
  if (commandKey) {
    return undefined;
  }
  return undefined;
}

function getExecutionCommandSpec(
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
        timeoutMs: getNumber(payload.timeoutMs),
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
      timeoutMs: getNumber(payload.timeoutMs),
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
    timeoutMs: getNumber(payload.timeoutMs),
    outputMode,
  });
  return {
    ...command,
    provider: adapter.provider,
    cwd: command.cwd || cwd,
    env: getStringMap(payload.env),
  };
}

function isSkillVersionSource(value: unknown): value is SkillVersionSource {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === 'zip') {
    return (
      typeof value.sha256 === 'string' &&
      (typeof value.archivePath === 'string' || typeof value.archiveUrl === 'string')
    );
  }
  if (value.type === 'github') {
    return typeof value.repoUrl === 'string';
  }
  return false;
}

function getSkillVersions(payload: JsonRecord) {
  const versions: SkillVersionInstallRecord[] = [];
  const appendVersion = (value: unknown) => {
    if (!isRecord(value) || typeof value.skillVersionId !== 'string' || !isSkillVersionSource(value.source)) {
      return;
    }
    versions.push({
      skillVersionId: value.skillVersionId,
      versionLabel: getString(value.versionLabel) || value.skillVersionId,
      source: value.source,
    });
  };

  appendVersion(payload.skillVersion);
  if (Array.isArray(payload.skillVersions)) {
    for (const value of payload.skillVersions) {
      appendVersion(value);
    }
  }
  return versions;
}

async function reportExecOutputs(gateway: AgentGatewayDaemonNodeClient, lease: RunLease, result: ExecDriverResult) {
  let sequence = 1;
  for (const [streamName, output] of [
    ['stdout', result.stdout],
    ['stderr', result.stderr],
  ] as const) {
    if (output.text) {
      await gateway.appendEvent(lease, {
        source: streamName,
        sequence,
        eventType: 'agent.output.chunk',
        level: streamName === 'stderr' && result.status !== 'succeeded' ? 'error' : 'info',
        message: output.text,
      });
      sequence += 1;
    }
    if (output.artifactPath) {
      const artifactUpload = await buildTextArtifactUpload(output.artifactPath, output.sizeBytes);
      await gateway.registerArtifact(lease, {
        artifactKey: `${streamName}-main`,
        artifactType: streamName,
        mimeType: 'text/plain',
        sizeBytes: output.sizeBytes,
        contentText: artifactUpload.contentText,
        metadata: artifactUpload.metadata,
      });
    }
  }
}

async function readOutputForProviderSessionDetection(output: ExecDriverResult['stdout']) {
  if (output.text) {
    return output.text;
  }
  if (!output.artifactPath) {
    return '';
  }

  const file = await fs.open(output.artifactPath, 'r');
  try {
    const buffer = Buffer.alloc(
      Math.min(output.sizeBytes || MAX_PROVIDER_SESSION_SCAN_BYTES, MAX_PROVIDER_SESSION_SCAN_BYTES),
    );
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    await file.close();
  }
}

async function* readOutputLinesForProviderEvents(output: ExecDriverResult['stdout']) {
  if (output.text) {
    for (const rawLine of output.text.split(/\r?\n/)) {
      yield rawLine;
    }
    return;
  }
  if (!output.artifactPath) {
    return;
  }

  const lines = createInterface({
    input: createReadStream(output.artifactPath, {
      encoding: 'utf8',
    }),
    crlfDelay: Infinity,
  });
  for await (const rawLine of lines) {
    yield rawLine;
  }
}

async function detectProviderSessionId(provider: string | undefined, result: ExecDriverResult) {
  const adapter = provider ? getAgentAdapter(provider) : null;
  if (!adapter?.capabilities.detectSessionId) {
    return null;
  }

  for (const outputRecord of [result.stdout, result.stderr]) {
    const output = await readOutputForProviderSessionDetection(outputRecord);
    if (!output) {
      continue;
    }
    for (const rawLine of output.split(/\r?\n/)) {
      const providerSessionId = adapter.detectSessionId({
        rawLine,
        source: provider,
      });
      if (providerSessionId) {
        return {
          adapter,
          providerSessionId,
        };
      }
    }
  }

  return null;
}

async function collectProviderConversationEvents(provider: string | undefined, result: ExecDriverResult) {
  const adapter = provider ? getAgentAdapter(provider) : null;
  if (!adapter?.capabilities.structuredEvents) {
    return [];
  }

  let sequence = 1;
  const events: JsonRecord[] = [];
  for (const outputRecord of [result.stdout, result.stderr]) {
    for await (const rawLine of readOutputLinesForProviderEvents(outputRecord)) {
      for (const event of adapter.normalizeEvent({ rawLine, source: provider })) {
        events.push({
          source: adapter.provider,
          sequence,
          eventType: event.eventType,
          providerEventId: event.providerEventId || undefined,
          correlationId: event.correlationId || undefined,
          confidence: event.confidence ?? undefined,
          contentText: event.message || undefined,
          contentJson: event.payloadJson || {},
        });
        sequence += 1;
      }
    }
  }

  return events;
}

async function reportProviderSessionIfDetected(options: {
  gateway: AgentGatewayDaemonNodeClient;
  lease: RunLease;
  provider?: string;
  result: ExecDriverResult;
}) {
  const detected = await detectProviderSessionId(options.provider, options.result);
  if (!detected) {
    return null;
  }

  let lastError: unknown;
  const capabilities = hasAgentCapabilitySignal(options.lease.profileCapabilities)
    ? normalizeAgentProviderCapabilities(detected.adapter.provider, options.lease.profileCapabilities)
    : detected.adapter.capabilities;
  for (let attempt = 1; attempt <= PROVIDER_SESSION_UPSERT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await options.gateway.upsertAgentSession(options.lease, {
        provider: detected.adapter.provider,
        providerSessionId: detected.providerSessionId,
        status: 'active',
        capabilities,
        metadata: {
          detectedFrom: 'exec-jsonl',
          provider: detected.adapter.provider,
          upsertAttempt: attempt,
        },
      });
      return detected.providerSessionId;
    } catch (error) {
      lastError = error;
      if (attempt < PROVIDER_SESSION_UPSERT_MAX_ATTEMPTS) {
        await delay(PROVIDER_SESSION_UPSERT_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function reportProviderSessionAndCollectWarnings(options: {
  gateway: AgentGatewayDaemonNodeClient;
  lease: RunLease;
  provider?: string;
  result: ExecDriverResult;
}) {
  const warnings: string[] = [];
  try {
    await reportProviderSessionIfDetected(options);
  } catch (error) {
    warnings.push(`Agent session upsert failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    const events = await collectProviderConversationEvents(options.provider, options.result);
    for (let index = 0; index < events.length; index += MAX_CONVERSATION_EVENTS_PER_APPEND) {
      await options.gateway.appendConversationEvents(options.lease, {
        events: events.slice(index, index + MAX_CONVERSATION_EVENTS_PER_APPEND),
      });
    }
  } catch (error) {
    warnings.push(`Agent timeline append failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return warnings;
}

function dedupeSkillVersions(skillVersions: SkillVersionInstallRecord[]) {
  const result: SkillVersionInstallRecord[] = [];
  const seen = new Set<string>();
  for (const skillVersion of skillVersions) {
    if (!seen.has(skillVersion.skillVersionId)) {
      result.push(skillVersion);
      seen.add(skillVersion.skillVersionId);
    }
  }
  return result;
}

function abortForRunCancel(cancelController: AbortController, lease: RunLease) {
  cancelController.abort(
    lease.cancelReason === AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON ? TMUX_TERMINATE_CANCEL_REASON : undefined,
  );
}

async function syncSkillsForRun(options: RunDaemonOnceOptions, lease: RunLease): Promise<SyncNodeSkillVersionResult[]> {
  const payload = getPayload(lease);
  const skillVersions = dedupeSkillVersions(getSkillVersions(payload));
  const results: SyncNodeSkillVersionResult[] = [];
  for (const skillVersion of skillVersions) {
    results.push(
      await (options.syncSkillVersion || syncNodeSkillVersion)({
        nodeId: options.gateway.nodeId,
        skillsRoot: options.skillsRoot,
        skillVersion,
        downloadHeaders: options.gateway.getNodeAuthHeaders(),
        trustedArchiveServerUrl: options.gateway.serverUrl,
        writeInstallStatus: async (installPayload) => {
          await options.gateway.upsertSkillInstall(installPayload);
        },
      }),
    );
  }
  return results;
}

function heartbeatWhileRunPhase(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  status: 'syncing_skills' | 'running';
  cancelController: AbortController;
  leaseLostController: AbortController;
  intervalMs: number;
}) {
  let inFlight: Promise<void> | null = null;
  const sendHeartbeat = () => {
    if (inFlight) {
      return;
    }
    inFlight = options.gateway
      .heartbeatRun(options.getLease(), options.status)
      .then((lease) => {
        options.setLease({
          ...options.getLease(),
          ...lease,
        });
        if (lease.cancelRequested) {
          abortForRunCancel(options.cancelController, lease);
        }
      })
      .catch(() => {
        options.leaseLostController.abort();
      })
      .finally(() => {
        inFlight = null;
      });
  };
  const timer = setInterval(() => {
    sendHeartbeat();
  }, options.intervalMs);
  return async () => {
    clearInterval(timer);
    await inFlight;
  };
}

function controlRequestWhileRunPhase(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  sessionName: string | null;
  cancelController: AbortController;
  intervalMs: number;
}) {
  let inFlight: Promise<void> | null = null;
  const handledRequestIds = new Set<string>();
  const deliveredRequestIds = new Set<string>();
  const finalAckByRequestId = new Map<
    string,
    {
      status: 'succeeded' | 'failed';
      values: JsonRecord;
    }
  >();

  const ackControlRequest = async (
    requestId: string,
    status: 'delivered' | 'succeeded' | 'failed',
    values: JsonRecord = {},
  ) => {
    try {
      await options.gateway.ackControlRequest(options.getLease(), requestId, status, values);
    } catch {
      await delay(Math.min(options.intervalMs, 250));
      await options.gateway.ackControlRequest(options.getLease(), requestId, status, values);
    }
  };

  const ackFinalControlRequest = async (
    requestId: string,
    finalAck: {
      status: 'succeeded' | 'failed';
      values: JsonRecord;
    },
  ) => {
    await ackControlRequest(requestId, finalAck.status, finalAck.values);
    finalAckByRequestId.delete(requestId);
    handledRequestIds.add(requestId);
  };

  const drainFinalAcks = async () => {
    for (let attempt = 0; attempt < 3 && finalAckByRequestId.size > 0; attempt += 1) {
      for (const [requestId, finalAck] of Array.from(finalAckByRequestId.entries())) {
        try {
          await ackFinalControlRequest(requestId, finalAck);
        } catch {
          // The run is exiting; keep drain bounded and let the server-side
          // delivered state show that the control reached the daemon.
        }
      }
      if (finalAckByRequestId.size > 0) {
        await delay(Math.min(options.intervalMs, 250));
      }
    }
  };

  const handleRequest = async (request: PendingControlRequest) => {
    if (handledRequestIds.has(request.id)) {
      return;
    }
    const cachedFinalAck = finalAckByRequestId.get(request.id);
    if (cachedFinalAck) {
      await ackFinalControlRequest(request.id, cachedFinalAck);
      return;
    }
    if (request.status === 'delivered' && !deliveredRequestIds.has(request.id)) {
      const finalAck = {
        status: 'failed' as const,
        values: {
          resultMessage: 'Control request was already delivered before this daemon instance; duplicate signal skipped',
          metadataJson: {
            action: request.action,
            duplicateSignalSkipped: true,
          },
        },
      };
      finalAckByRequestId.set(request.id, finalAck);
      await ackFinalControlRequest(request.id, finalAck);
      return;
    }
    if (request.status !== 'delivered' && !deliveredRequestIds.has(request.id)) {
      await ackControlRequest(request.id, 'delivered', {
        metadataJson: {
          action: request.action,
        },
      });
      deliveredRequestIds.add(request.id);
    }

    let finalAck: {
      status: 'succeeded' | 'failed';
      values: JsonRecord;
    };
    try {
      if (request.action === 'interrupt') {
        if (!options.sessionName) {
          throw new Error('No managed tmux session is available for interrupt');
        }
        await interruptTmuxSession(options.sessionName);
      } else if (request.action === 'terminate') {
        if (!options.sessionName) {
          throw new Error('No managed tmux session is available for terminate');
        }
        options.cancelController.abort(TMUX_TERMINATE_CANCEL_REASON);
        await terminateTmuxSession(options.sessionName);
      } else {
        throw new Error(`Unsupported control request action: ${String(request.action)}`);
      }
      finalAck = {
        status: 'succeeded',
        values: {
          metadataJson: {
            action: request.action,
          },
        },
      };
    } catch (error) {
      finalAck = {
        status: 'failed',
        values: {
          resultMessage: error instanceof Error ? error.message : String(error),
          metadataJson: {
            action: request.action,
          },
        },
      };
    }
    finalAckByRequestId.set(request.id, finalAck);
    await ackFinalControlRequest(request.id, finalAck);
  };

  const poll = () => {
    if (inFlight) {
      return;
    }
    inFlight = options.gateway
      .listPendingControlRequests(options.getLease())
      .then(async (result) => {
        for (const request of result.requests || []) {
          await handleRequest(request);
        }
      })
      .catch(() => {
        // Control polling is best-effort. Heartbeat remains the authoritative
        // lease-lost detector for the run.
      })
      .finally(() => {
        inFlight = null;
      });
  };

  poll();
  const timer = setInterval(poll, options.intervalMs);
  return async () => {
    clearInterval(timer);
    await inFlight;
    await drainFinalAcks();
  };
}

async function refreshRunLeaseBeforeTerminal(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
}) {
  try {
    const refreshedLease = await options.gateway.heartbeatRun(options.getLease(), 'running');
    options.setLease({
      ...options.getLease(),
      ...refreshedLease,
    });
    if (refreshedLease.cancelRequested) {
      abortForRunCancel(options.cancelController, refreshedLease);
      return 'cancel_requested';
    }
    return 'active';
  } catch {
    options.leaseLostController.abort();
    return 'lease_lost';
  }
}

async function recoverTerminalConflict(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
}) {
  const refreshedLeaseStatus = await refreshRunLeaseBeforeTerminal(options);
  if (refreshedLeaseStatus === 'cancel_requested') {
    await options.gateway.cancelAckRun(options.getLease());
    return 'canceled';
  }
  if (refreshedLeaseStatus === 'lease_lost') {
    return 'lease_lost';
  }
  return null;
}

async function terminalizeRun(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  setLease(lease: RunLease): void;
  cancelController: AbortController;
  leaseLostController: AbortController;
  result: ExecDriverResult;
  observationWarnings?: string[];
}) {
  const observationWarnings: string[] = [...(options.observationWarnings || [])];
  try {
    await reportExecOutputs(options.gateway, options.getLease(), options.result);
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }
  try {
    await options.gateway.registerSnapshot(options.getLease(), {
      snapshotType: 'agent',
      snapshot: {
        status: options.result.status,
        exitCode: options.result.exitCode,
        signal: options.result.signal,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      },
    });
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }

  try {
    if (options.result.status === 'succeeded') {
      await options.gateway.completeRun(options.getLease(), {
        status: 'succeeded',
        exitCode: options.result.exitCode,
        ...(observationWarnings.length ? { observationWarnings } : {}),
      });
      return 'succeeded';
    }
    if (options.result.status === 'timeout') {
      await options.gateway.timeoutRun(options.getLease(), 'Process timeout confirmed by daemon');
      return 'timeout';
    }
    if (options.result.status === 'canceled') {
      await options.gateway.cancelAckRun(options.getLease());
      return 'canceled';
    }
    if (options.result.status === 'lease_lost') {
      return 'lease_lost';
    }

    await options.gateway.failRun(options.getLease(), `Process exited with ${options.result.status}`, {
      exitCode: options.result.exitCode,
      signal: options.result.signal,
    });
    return 'failed';
  } catch (error) {
    const recoveredStatus = await recoverTerminalConflict(options);
    if (recoveredStatus) {
      return recoveredStatus;
    }
    throw error;
  }
}

async function closeTmuxTerminalQuietly(
  options: RunDaemonOnceOptions,
  lease: RunLease,
  runId: string,
  exitCode: number | null,
) {
  try {
    await options.gateway.updateRunTerminal(lease, {
      terminalBackend: 'tmux',
      terminalSessionName: getManagedTmuxSessionName(runId),
      terminalStatus: 'closed',
      terminalEndedAt: new Date().toISOString(),
      terminalExitCode: exitCode,
    });
  } catch {
    // Terminal metadata is observational; run terminalization remains authoritative.
  }
}

function createTerminalStreamHandle(options: DaemonTerminalStreamClientOptions): TerminalStreamHandle {
  const client = new DaemonTerminalStreamClient(options);
  return {
    start: async () => {
      await client.start();
    },
    appendText: async (text) => {
      await client.appendText(text);
    },
    end: async (reason) => {
      await client.end(reason);
    },
    close: () => {
      client.close();
    },
  };
}

function createRunTerminalStream(options: {
  runOptions: RunDaemonOnceOptions;
  runId: string;
  sessionName: string;
  getLease(): RunLease;
}) {
  const ringBuffer = new TerminalRingBuffer({
    runId: options.runId,
    sessionName: options.sessionName,
    maxBytes: options.runOptions.terminalRingBufferMaxBytes,
  });
  const factory = options.runOptions.terminalStreamClientFactory || createTerminalStreamHandle;
  return factory({
    serverUrl: options.runOptions.gateway.serverUrl,
    nodeId: options.runOptions.gateway.nodeId,
    nodeToken: options.runOptions.gateway.nodeToken,
    runId: options.runId,
    sessionName: options.sessionName,
    ringBuffer,
    getLease: options.getLease,
  });
}

function toTerminalEndReason(status: ExecTerminalStatus): TerminalEnd['reason'] {
  if (status === 'succeeded') {
    return 'completed';
  }
  if (status === 'lease_lost') {
    return 'disconnected';
  }
  return status;
}

export async function executeClaimedRun(
  options: RunDaemonOnceOptions,
  claimedLease: RunLease,
): Promise<DaemonRunOnceResult> {
  let lease = await options.gateway.heartbeatRun(claimedLease, 'syncing_skills');
  const activeLease = () => ({
    ...claimedLease,
    ...lease,
  });

  const syncCancelController = new AbortController();
  const syncLeaseLostController = new AbortController();
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }
  let stopSyncHeartbeat: (() => Promise<void>) | null = heartbeatWhileRunPhase({
    gateway: options.gateway,
    getLease: activeLease,
    setLease: (nextLease) => {
      lease = nextLease;
    },
    status: 'syncing_skills',
    cancelController: syncCancelController,
    leaseLostController: syncLeaseLostController,
    intervalMs: options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS,
  });
  try {
    await syncSkillsForRun(options, activeLease());
  } catch (error) {
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
      stopSyncHeartbeat = null;
    }
    if (syncLeaseLostController.signal.aborted) {
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
        reason: 'skill_sync_lease_lost',
      };
    }
    if (syncCancelController.signal.aborted) {
      await options.gateway.cancelAckRun(activeLease());
      return {
        status: 'canceled',
        runId: claimedLease.runId,
        reason: 'skill_sync_canceled',
      };
    }
    try {
      await options.gateway.failRun(activeLease(), error instanceof Error ? error.message : String(error));
    } catch {
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
        reason: 'skill_sync_terminal_failed',
      };
    }
    return {
      status: 'failed',
      runId: claimedLease.runId,
      reason: 'skill_sync_failed',
    };
  } finally {
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
    }
  }
  if (syncLeaseLostController.signal.aborted) {
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'skill_sync_lease_lost',
    };
  }
  if (syncCancelController.signal.aborted) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
      reason: 'skill_sync_canceled',
    };
  }

  lease = await options.gateway.heartbeatRun(activeLease(), 'running');
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }

  const payload = getPayload(claimedLease);
  const cwd = path.resolve(options.workspaceRoot, getString(payload.cwd) || '.');
  const terminalBackend = options.terminalBackend || 'exec';
  const tmuxSessionName = getManagedTmuxSessionName(claimedLease.runId);
  const usesManagedTmux = terminalBackend === 'tmux' && !options.executeCommand;
  let terminalStream: TerminalStreamHandle | null = null;
  const cancelController = new AbortController();
  const leaseLostController = new AbortController();
  let stopHeartbeat: (() => Promise<void>) | null = null;
  let stopControlRequests: (() => Promise<void>) | null = null;

  try {
    const commandSpec = getExecutionCommandSpec(claimedLease, cwd, usesManagedTmux ? 'terminal' : 'structured');
    if (usesManagedTmux) {
      terminalStream = createRunTerminalStream({
        runOptions: options,
        runId: claimedLease.runId,
        sessionName: tmuxSessionName,
        getLease: activeLease,
      });
      await terminalStream.start();
    }
    const startManagedTmuxControls = async (terminalStartedAt: string) => {
      await options.gateway.updateRunTerminal(activeLease(), {
        terminalBackend: 'tmux',
        terminalSessionName: tmuxSessionName,
        terminalStatus: 'active',
        terminalStartedAt,
      });
      if (!stopControlRequests) {
        stopControlRequests = controlRequestWhileRunPhase({
          gateway: options.gateway,
          getLease: activeLease,
          sessionName: tmuxSessionName,
          cancelController,
          intervalMs: Math.max(
            250,
            Math.floor((options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS) / 2),
          ),
        });
      }
    };
    stopHeartbeat = heartbeatWhileRunPhase({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      status: 'running',
      cancelController,
      leaseLostController,
      intervalMs: options.runHeartbeatIntervalMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS,
    });

    const result = usesManagedTmux
      ? await executeTmuxCommand({
          runId: claimedLease.runId,
          definition: getAllowlistedDefinition(options.allowlist, commandSpec.commandKey),
          args: commandSpec.args,
          cwd: commandSpec.cwd,
          workspaceRoot: options.workspaceRoot,
          env: commandSpec.env,
          timeoutMs: commandSpec.timeoutMs || DEFAULT_RUN_HEARTBEAT_INTERVAL_MS * 180,
          cancelSignal: cancelController.signal,
          leaseLostSignal: leaseLostController.signal,
          artifactDir: options.artifactDir,
          onOutputChunk: async (chunk) => {
            await terminalStream?.appendText(chunk);
          },
          onSessionStarted: async (metadata) => {
            await startManagedTmuxControls(metadata.startedAt);
          },
        })
      : await (options.executeCommand || executeAllowlistedCommand)({
          commandKey: commandSpec.commandKey,
          allowlist: options.allowlist,
          args: commandSpec.args,
          cwd: commandSpec.cwd,
          workspaceRoot: options.workspaceRoot,
          env: commandSpec.env,
          timeoutMs: commandSpec.timeoutMs,
          cancelSignal: cancelController.signal,
          leaseLostSignal: leaseLostController.signal,
          artifactDir: options.artifactDir,
        });
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (stopControlRequests) {
      await stopControlRequests();
      stopControlRequests = null;
    }
    if (leaseLostController.signal.aborted) {
      if (usesManagedTmux) {
        await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
        await terminalStream?.end('disconnected');
      }
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    const refreshedLeaseStatus = await refreshRunLeaseBeforeTerminal({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      cancelController,
      leaseLostController,
    });
    if (refreshedLeaseStatus === 'lease_lost') {
      if (usesManagedTmux) {
        await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
        await terminalStream?.end('disconnected');
      }
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    if (refreshedLeaseStatus === 'cancel_requested') {
      if (usesManagedTmux) {
        await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
        await terminalStream?.end('canceled');
      }
      await reportProviderSessionAndCollectWarnings({
        gateway: options.gateway,
        lease: activeLease(),
        provider: commandSpec.provider,
        result,
      });
      await options.gateway.cancelAckRun(activeLease());
      return {
        status: 'canceled',
        runId: claimedLease.runId,
      };
    }
    if (usesManagedTmux) {
      await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
      await terminalStream?.end(toTerminalEndReason(result.status));
    }
    const sessionObservationWarnings = await reportProviderSessionAndCollectWarnings({
      gateway: options.gateway,
      lease: activeLease(),
      provider: commandSpec.provider,
      result,
    });
    const terminalResult: ExecDriverResult =
      cancelController.signal.aborted && result.status === 'succeeded'
        ? {
            ...result,
            status: 'canceled',
          }
        : result;
    const status = await terminalizeRun({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      cancelController,
      leaseLostController,
      result: terminalResult,
      observationWarnings: sessionObservationWarnings,
    });
    return {
      status,
      runId: claimedLease.runId,
    };
  } catch (error) {
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (stopControlRequests) {
      await stopControlRequests();
      stopControlRequests = null;
    }
    if (usesManagedTmux) {
      await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, null);
      await terminalStream?.end(leaseLostController.signal.aborted ? 'disconnected' : 'failed');
    }
    if (!leaseLostController.signal.aborted) {
      try {
        await options.gateway.failRun(activeLease(), error instanceof Error ? error.message : String(error));
      } catch {
        const recoveredStatus = await recoverTerminalConflict({
          gateway: options.gateway,
          getLease: activeLease,
          setLease: (nextLease) => {
            lease = nextLease;
          },
          cancelController,
          leaseLostController,
        });
        if (recoveredStatus) {
          return {
            status: recoveredStatus,
            runId: claimedLease.runId,
          };
        }
        return {
          status: 'lease_lost',
          runId: claimedLease.runId,
        };
      }
    }
    return {
      status: leaseLostController.signal.aborted ? 'lease_lost' : 'failed',
      runId: claimedLease.runId,
    };
  } finally {
    if (stopHeartbeat) {
      await stopHeartbeat();
    }
    if (stopControlRequests) {
      await stopControlRequests();
    }
    terminalStream?.close();
  }
}

export async function runDaemonOnce(options: RunDaemonOnceOptions): Promise<DaemonRunOnceResult> {
  const profiles = await detectAgentProfiles(options.detectOptions);
  await options.gateway.heartbeatNode({
    profiles,
  });
  const claim = await options.gateway.claimRun({
    profileKey: options.claimProfileKey,
    runId: options.claimRunId,
  });
  if (claim.claimed === false || !claim.runId) {
    return {
      status: 'idle',
      reason: 'no_claimable_run',
    };
  }
  return await executeClaimedRun(options, {
    ...claim,
    claimed: true,
  });
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export async function runDaemonLoop(options: DaemonRunLoopOptions) {
  const pollIntervalMs = options.pollIntervalMs || 10_000;
  while (!options.stopSignal?.aborted) {
    await runDaemonOnce(options);
    await delay(pollIntervalMs, options.stopSignal);
  }
}
