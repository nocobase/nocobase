/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { createInterface } from 'readline';

import { buildTextArtifactUpload, collectDeclaredArtifactCollection } from './artifactUpload';
import { getAgentAdapter, type AgentAdapter, type NormalizedAgentEvent } from './adapters';
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
import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../shared/conversationLimits';
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
  retryInitialDelayMs?: number;
  retryMaxDelayMs?: number;
  stopSignal?: AbortSignal;
  onLoopError?: (error: unknown, state: { failureCount: number; retryDelayMs: number }) => void;
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
const LIVE_TIMELINE_SOURCE = 'terminal-live';
const DAEMON_PROGRESS_SOURCE = 'agent-gateway-daemon';
const HARNESS_PROGRESS_SOURCE = 'harness';
const PROGRESS_MARKER_PREFIX = 'AGW_PROGRESS';
const LIVE_TIMELINE_FLUSH_INTERVAL_MS = 2000;
const LIVE_TIMELINE_MAX_CHARS_PER_EVENT = 4000;
const CONVERSATION_CONTENT_JSON_BUDGET_CHARS = COMMAND_CONTENT_JSON_LIMIT_CHARS - 4096;
const RAW_PROVIDER_PREVIEW_CHARS = 4000;
const PROGRESS_EVENT_PAYLOAD_BUDGET_CHARS = 14 * 1024;
const PROGRESS_EVENT_PAYLOAD_PREVIEW_CHARS = 2000;
const SUMMARY_ARRAY_SAMPLE_LIMIT = 20;
const DEFAULT_LOOP_RETRY_INITIAL_DELAY_MS = 1000;
const DEFAULT_LOOP_RETRY_MAX_DELAY_MS = 30_000;

interface TerminalStreamHandle {
  start(): Promise<void>;
  appendText(text: string): Promise<void>;
  end(reason: TerminalEnd['reason']): Promise<void>;
  close(): void;
}

interface LiveTimelineReporter {
  appendText(text: string): Promise<void>;
  flush(): Promise<void>;
  getWarnings(): string[];
}

type RunProgressLevel = 'info' | 'warning' | 'error';

interface RunProgressAppendOptions {
  source?: string;
  phase: string;
  status: string;
  level?: RunProgressLevel;
  message?: string;
  payloadJson?: JsonRecord;
}

interface RunProgressReporter {
  append(options: RunProgressAppendOptions): Promise<void>;
  appendHarnessMarkers(text: string): Promise<void>;
  getWarnings(): string[];
}

type RunHeartbeatStatus = 'syncing_skills' | 'running' | 'finalizing';
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

function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
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

function getRequestedTerminalBackend(payload: JsonRecord, fallback?: RunDaemonOnceOptions['terminalBackend']) {
  if (fallback) {
    return fallback;
  }
  return getString(payload.terminalBackend) === 'tmux' ? 'tmux' : 'exec';
}

function getDeclaredArtifactModifiedSinceMs(lease: RunLease, payload: JsonRecord) {
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

function buildInstalledSkillPromptContext(syncResults: SyncNodeSkillVersionResult[]) {
  if (!syncResults.length) {
    return '';
  }
  return [
    '',
    '',
    'Custom Agent Gateway skills installed for this run:',
    ...syncResults.map(
      (result) =>
        `- ${result.skillVersionId}: ${path.join(result.installPath, 'SKILL.md')} (${result.status}, ${
          result.sourceDigest
        })`,
    ),
    'Read and follow the relevant SKILL.md before executing the task when applicable.',
  ].join('\n');
}

function withInstalledSkillPromptContext(lease: RunLease, syncResults: SyncNodeSkillVersionResult[]) {
  const skillContext = buildInstalledSkillPromptContext(syncResults);
  if (!skillContext) {
    return lease;
  }
  const run = isRecord(lease.run) ? lease.run : {};
  const payload = getPayload(lease);
  const prompt = getRunPrompt(lease, payload);
  return {
    ...lease,
    run: {
      ...run,
      executionPayloadJson: {
        ...payload,
        installedSkills: syncResults.map((result) => ({
          skillVersionId: result.skillVersionId,
          installPath: result.installPath,
          skillMdPath: path.join(result.installPath, 'SKILL.md'),
          status: result.status,
          sourceDigest: result.sourceDigest,
        })),
        ...(prompt ? { prompt: `${prompt}${skillContext}` } : {}),
      },
    },
  };
}

function hashText(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function getJsonText(value: unknown) {
  try {
    return JSON.stringify(value) || '';
  } catch {
    return String(value);
  }
}

function getArraySample(value: unknown, limit = SUMMARY_ARRAY_SAMPLE_LIMIT) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function getArrayCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function compactArtifactManifestForSummary(value: unknown): JsonRecord {
  const manifest = getRecord(value);
  if (!Object.keys(manifest).length) {
    return {};
  }
  const artifacts = getArraySample(manifest.artifacts);
  const skipped = getArraySample(manifest.skipped);
  const ignored = getArraySample(manifest.ignored);
  const referencedScreenshots = getArraySample(manifest.referencedScreenshots);
  const missingReferencedScreenshots = getArraySample(manifest.missingReferencedScreenshots);
  return {
    schema: getString(manifest.schema) || undefined,
    generatedAt: getString(manifest.generatedAt) || undefined,
    maxArtifactUploads: manifest.maxArtifactUploads,
    counts: getRecord(manifest.counts),
    artifactSample: artifacts,
    artifactSampleCount: artifacts.length,
    artifactCount: getArrayCount(manifest.artifacts),
    skippedSample: skipped,
    skippedSampleCount: skipped.length,
    skippedCount: getArrayCount(manifest.skipped),
    ignoredSample: ignored,
    ignoredSampleCount: ignored.length,
    ignoredCount: getArrayCount(manifest.ignored),
    referencedScreenshotSample: referencedScreenshots,
    referencedScreenshotSampleCount: referencedScreenshots.length,
    referencedScreenshotCount: getArrayCount(manifest.referencedScreenshots),
    missingReferencedScreenshotSample: missingReferencedScreenshots,
    missingReferencedScreenshotSampleCount: missingReferencedScreenshots.length,
    missingReferencedScreenshotCount: getArrayCount(manifest.missingReferencedScreenshots),
  };
}

function compactDeclaredArtifactSummary(value: unknown): JsonRecord {
  const summary = getRecord(value);
  if (!Object.keys(summary).length) {
    return {};
  }
  const declaredArtifactKeys = getArraySample(summary.declaredArtifactKeys, 50);
  const declaredArtifactFailures = getArraySample(summary.declaredArtifactFailures, SUMMARY_ARRAY_SAMPLE_LIMIT);
  return {
    declaredArtifactCount: summary.declaredArtifactCount,
    declaredArtifactKeySample: declaredArtifactKeys,
    declaredArtifactKeySampleCount: declaredArtifactKeys.length,
    declaredArtifactKeyCount: getArrayCount(summary.declaredArtifactKeys),
    declaredArtifactFailedCount: summary.declaredArtifactFailedCount,
    declaredArtifactFailures,
    declaredArtifactFailureSample: declaredArtifactFailures,
    declaredArtifactFailureSampleCount: declaredArtifactFailures.length,
    declaredArtifactFailureCount: getArrayCount(summary.declaredArtifactFailures),
    artifactManifestArtifactKey: 'declared:artifact-manifest.json',
    artifactManifest: compactArtifactManifestForSummary(summary.artifactManifest),
  };
}

function compactProgressPayloadJson(payloadJson: JsonRecord) {
  if (getJsonStringLength(payloadJson) <= PROGRESS_EVENT_PAYLOAD_BUDGET_CHARS) {
    return payloadJson;
  }
  const payloadText = getJsonText(payloadJson);
  return {
    progressPayloadCompacted: true,
    progressPayloadOriginalChars: payloadText.length,
    progressPayloadSha256: hashText(payloadText),
    progressPayloadPreview: payloadText.slice(0, PROGRESS_EVENT_PAYLOAD_PREVIEW_CHARS),
  };
}

async function registerOutputArtifact(options: {
  gateway: AgentGatewayDaemonNodeClient;
  lease: RunLease;
  streamName: 'stdout' | 'stderr';
  output: ExecDriverResult['stdout'];
}) {
  if (options.output.text) {
    await options.gateway.registerArtifact(options.lease, {
      artifactKey: `${options.streamName}-main`,
      artifactType: options.streamName,
      mimeType: 'text/plain',
      sizeBytes: Buffer.byteLength(options.output.text),
      contentText: options.output.text,
      metadata: {
        originalSizeBytes: Buffer.byteLength(options.output.text),
        uploadedBytes: Buffer.byteLength(options.output.text),
        truncated: false,
        sha256: hashText(options.output.text),
        storageMode: 'inline',
      },
    });
    return;
  }
  if (options.output.artifactPath) {
    const artifactUpload = await buildTextArtifactUpload(options.output.artifactPath, options.output.sizeBytes);
    await options.gateway.registerArtifact(options.lease, {
      artifactKey: `${options.streamName}-main`,
      artifactType: options.streamName,
      mimeType: 'text/plain',
      sizeBytes: options.output.sizeBytes,
      contentText: artifactUpload.contentText,
      metadata: artifactUpload.metadata,
    });
  }
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
        message: output.text.slice(0, 4000),
      });
      sequence += 1;
    }
    await registerOutputArtifact({
      gateway,
      lease,
      streamName,
      output,
    });
  }
}

async function reportDeclaredArtifacts(options: {
  gateway: AgentGatewayDaemonNodeClient;
  lease: RunLease;
  payload: JsonRecord;
  cwd: string;
  workspaceRoot: string;
}) {
  const collection = await collectDeclaredArtifactCollection({
    payload: options.payload,
    cwd: options.cwd,
    workspaceRoot: options.workspaceRoot,
    modifiedSinceMs: getDeclaredArtifactModifiedSinceMs(options.lease, options.payload),
  });
  const manifestUpload = collection.uploads.find((upload) => upload.artifactType === 'artifact-manifest');
  const artifactUploads = collection.uploads.filter((upload) => upload !== manifestUpload);
  const uploadedArtifactKeys: string[] = [];
  const uploadFailures: JsonRecord[] = [];
  for (const upload of artifactUploads) {
    try {
      await options.gateway.registerArtifact(options.lease, upload);
      uploadedArtifactKeys.push(upload.artifactKey);
    } catch (error) {
      uploadFailures.push({
        artifactKey: upload.artifactKey,
        artifactType: upload.artifactType,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const artifactManifest = {
    ...collection.manifest,
    counts: {
      ...getRecord(collection.manifest.counts),
      uploaded: uploadedArtifactKeys.length,
      failed: uploadFailures.length,
    },
    ...(uploadFailures.length ? { uploadFailures } : {}),
  };
  if (manifestUpload) {
    const contentText = JSON.stringify(artifactManifest, null, 2);
    const contentBytes = Buffer.byteLength(contentText);
    const upload = {
      ...manifestUpload,
      sizeBytes: contentBytes,
      contentText,
      metadata: {
        ...manifestUpload.metadata,
        originalSizeBytes: contentBytes,
        uploadedBytes: contentBytes,
        truncated: false,
        storageMode: 'inline',
        sha256: hashText(contentText),
      },
    };
    try {
      await options.gateway.registerArtifact(options.lease, upload);
      uploadedArtifactKeys.push(upload.artifactKey);
    } catch (error) {
      uploadFailures.push({
        artifactKey: upload.artifactKey,
        artifactType: upload.artifactType,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    declaredArtifactCount: uploadedArtifactKeys.length,
    declaredArtifactKeys: uploadedArtifactKeys,
    declaredArtifactFailedCount: uploadFailures.length,
    ...(uploadFailures.length ? { declaredArtifactFailures: uploadFailures } : {}),
    artifactManifest,
  };
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
        events.push(buildConversationEventRecord(adapter.provider, sequence, event, rawLine));
        sequence += 1;
      }
    }
  }

  return events;
}

function tryParseJsonRecord(value: string) {
  if (!value.trim().startsWith('{')) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getJsonStringLength(value: unknown) {
  try {
    return JSON.stringify(value)?.length || 0;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function contentJsonFitsBudget(contentJson: JsonRecord) {
  return getJsonStringLength(contentJson) <= CONVERSATION_CONTENT_JSON_BUDGET_CHARS;
}

function setContentJsonFieldIfFits(contentJson: JsonRecord, key: string, value: unknown) {
  contentJson[key] = value;
  if (contentJsonFitsBudget(contentJson)) {
    return true;
  }
  delete contentJson[key];
  return false;
}

function setOptionalContentJsonFieldIfFits(contentJson: JsonRecord, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  return setContentJsonFieldIfFits(contentJson, key, value);
}

function attachRawLineDetails(contentJson: JsonRecord, rawLine: string) {
  if (setContentJsonFieldIfFits(contentJson, 'rawLine', rawLine)) {
    return;
  }

  contentJson.rawLineTruncated = true;
  contentJson.rawLineOriginalLength = rawLine.length;
  contentJson.rawLineSha256 = hashText(rawLine);
  if (!contentJsonFitsBudget(contentJson)) {
    delete contentJson.rawLineTruncated;
    delete contentJson.rawLineOriginalLength;
    delete contentJson.rawLineSha256;
    return;
  }

  const preview = rawLine.slice(0, RAW_PROVIDER_PREVIEW_CHARS);
  setOptionalContentJsonFieldIfFits(contentJson, 'rawLinePreview', preview);
}

function attachRawProviderEventDetails(contentJson: JsonRecord, rawProviderEvent: JsonRecord) {
  if (!Object.keys(rawProviderEvent).length) {
    return;
  }
  if (setContentJsonFieldIfFits(contentJson, 'rawProviderEvent', rawProviderEvent)) {
    return;
  }

  contentJson.rawProviderEventOmitted = true;
  contentJson.rawProviderEventOriginalChars = getJsonStringLength(rawProviderEvent);
  setOptionalContentJsonFieldIfFits(contentJson, 'rawProviderEventType', getString(rawProviderEvent.type));
  setOptionalContentJsonFieldIfFits(
    contentJson,
    'rawProviderEventItemType',
    getString(getRecord(rawProviderEvent.item).type || getRecord(rawProviderEvent.payload).type),
  );
  if (!contentJsonFitsBudget(contentJson)) {
    delete contentJson.rawProviderEventOmitted;
    delete contentJson.rawProviderEventOriginalChars;
    delete contentJson.rawProviderEventType;
    delete contentJson.rawProviderEventItemType;
  }
}

function buildConversationEventRecord(
  source: string,
  sequence: number,
  event: NormalizedAgentEvent,
  rawLine?: string,
): JsonRecord {
  const eventRawLine = event.rawLine || rawLine;
  const payloadJson = event.payloadJson || {};
  const rawPayloadProviderEvent = getRecord(payloadJson.rawProviderEvent);
  const rawPayloadLine = getString(payloadJson.rawLine);
  const contentJson = {
    ...payloadJson,
  };
  delete contentJson.rawLine;
  delete contentJson.rawProviderEvent;

  const rawProviderEvent =
    event.rawEvent && Object.keys(event.rawEvent).length
      ? event.rawEvent
      : Object.keys(rawPayloadProviderEvent).length
        ? rawPayloadProviderEvent
        : tryParseJsonRecord(eventRawLine || rawPayloadLine);
  if (eventRawLine || rawPayloadLine) {
    attachRawLineDetails(contentJson, eventRawLine || rawPayloadLine);
  }
  attachRawProviderEventDetails(contentJson, rawProviderEvent);

  return {
    source,
    sequence,
    eventType: event.eventType,
    providerEventId: event.providerEventId || undefined,
    correlationId: event.correlationId || undefined,
    confidence: event.confidence ?? undefined,
    contentText: event.message || undefined,
    contentJson,
  };
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

function createLiveTimelineReporter(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  provider?: string;
}): LiveTimelineReporter {
  const adapter: AgentAdapter | null = options.provider ? getAgentAdapter(options.provider) : null;
  const structuredAdapter = adapter?.capabilities.structuredEvents ? adapter : null;
  let lineBuffer = '';
  let fallbackBuffer = '';
  let fallbackSequence = 0;
  let structuredSequence = 0;
  const pendingStructuredEvents: JsonRecord[] = [];
  let lastFlushAt = 0;
  const warnings: string[] = [];

  const isPayloadTooLargeError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return /(?:HTTP\s*413|413\b|too large)/i.test(message);
  };

  const appendWarning = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(`Live timeline append failed: ${message}`);
  };

  const queueFallbackText = (text: string) => {
    if (!text) {
      return;
    }
    fallbackBuffer += fallbackBuffer ? `\n${text}` : text;
  };

  const queueStructuredLine = (line: string) => {
    const normalizedEvents =
      structuredAdapter?.normalizeEvent({ rawLine: line, source: structuredAdapter.provider }) || [];
    if (!normalizedEvents.length) {
      queueFallbackText(line);
      return;
    }
    for (const event of normalizedEvents) {
      structuredSequence += 1;
      pendingStructuredEvents.push(
        buildConversationEventRecord(structuredAdapter.provider, structuredSequence, event, line),
      );
    }
  };

  const processCompleteLines = (text: string) => {
    if (!text) {
      return;
    }
    if (!structuredAdapter) {
      queueFallbackText(text);
      return;
    }

    lineBuffer += text;
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop() || '';
    for (const line of lines) {
      queueStructuredLine(line);
    }
  };

  const processRemainingLine = () => {
    if (!lineBuffer) {
      return;
    }
    const line = lineBuffer;
    lineBuffer = '';
    queueStructuredLine(line);
  };

  const flushQueuedEvents = async (events: JsonRecord[]) => {
    if (!events.length) {
      return;
    }
    for (let index = 0; index < events.length; index += MAX_CONVERSATION_EVENTS_PER_APPEND) {
      await options.gateway.appendConversationEvents(options.getLease(), {
        events: events.slice(index, index + MAX_CONVERSATION_EVENTS_PER_APPEND),
      });
    }
  };

  const flush = async (includePartialLine: boolean) => {
    if (includePartialLine) {
      processRemainingLine();
    }
    if (!pendingStructuredEvents.length && !fallbackBuffer) {
      return;
    }
    const structuredEvents = pendingStructuredEvents.splice(0, pendingStructuredEvents.length);
    const fallbackText = fallbackBuffer;
    fallbackBuffer = '';
    const fallbackEvents: JsonRecord[] = [];
    if (fallbackText) {
      for (let offset = 0; offset < fallbackText.length; offset += LIVE_TIMELINE_MAX_CHARS_PER_EVENT) {
        const chunk = fallbackText.slice(offset, offset + LIVE_TIMELINE_MAX_CHARS_PER_EVENT);
        fallbackSequence += 1;
        fallbackEvents.push({
          source: LIVE_TIMELINE_SOURCE,
          sequence: fallbackSequence,
          eventType: 'agent.message',
          contentText: chunk,
          contentJson: {
            live: true,
            stream: 'terminal',
            chunkLength: chunk.length,
            chunkBytes: Buffer.byteLength(chunk),
          },
        });
      }
    }

    try {
      await flushQueuedEvents([...structuredEvents, ...fallbackEvents]);
    } catch (error) {
      if (!isPayloadTooLargeError(error)) {
        pendingStructuredEvents.unshift(...structuredEvents);
        fallbackBuffer = fallbackText
          ? fallbackBuffer
            ? `${fallbackText}\n${fallbackBuffer}`
            : fallbackText
          : fallbackBuffer;
      }
      appendWarning(error);
    } finally {
      lastFlushAt = Date.now();
    }
  };

  return {
    appendText: async (text) => {
      if (!text) {
        return;
      }
      processCompleteLines(text);
      const shouldFlush =
        fallbackBuffer.length >= LIVE_TIMELINE_MAX_CHARS_PER_EVENT ||
        pendingStructuredEvents.length >= MAX_CONVERSATION_EVENTS_PER_APPEND ||
        Date.now() - lastFlushAt >= LIVE_TIMELINE_FLUSH_INTERVAL_MS;
      if (shouldFlush) {
        await flush(false);
      }
    },
    flush: async () => flush(true),
    getWarnings: () => [...warnings],
  };
}

function sanitizeProgressPart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .slice(0, 80);
}

function getProgressLevel(status: string): RunProgressLevel {
  if (status === 'failed' || status === 'timeout') {
    return 'error';
  }
  if (status === 'canceled' || status === 'skipped') {
    return 'warning';
  }
  return 'info';
}

function parseHarnessProgressMarker(rawLine: string): RunProgressAppendOptions | null {
  const trimmed = rawLine.trim();
  if (!trimmed.startsWith(PROGRESS_MARKER_PREFIX)) {
    return null;
  }
  const rest = trimmed.slice(PROGRESS_MARKER_PREFIX.length).trim();
  if (!rest) {
    return null;
  }
  const phaseMatch = rest.match(/(?:^|\s)phase=([^\s]+)/);
  const statusMatch = rest.match(/(?:^|\s)status=([^\s]+)/);
  const messageMatch = rest.match(/(?:^|\s)message=(.*)$/);
  const phase = phaseMatch ? sanitizeProgressPart(phaseMatch[1]) : '';
  const status = statusMatch ? sanitizeProgressPart(statusMatch[1]) : '';
  if (!phase || !status) {
    return null;
  }
  const message = messageMatch?.[1]?.trim();
  return {
    source: HARNESS_PROGRESS_SOURCE,
    phase,
    status,
    message: message || `${phase} ${status}`,
    payloadJson: {
      marker: PROGRESS_MARKER_PREFIX,
      phase,
      status,
    },
  };
}

function collectStringValues(value: unknown, strings: string[]) {
  if (typeof value === 'string') {
    strings.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, strings);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const item of Object.values(value)) {
    collectStringValues(item, strings);
  }
}

function extractHarnessProgressMarkerLines(rawLine: string) {
  const trimmed = rawLine.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.startsWith(PROGRESS_MARKER_PREFIX)) {
    return [trimmed];
  }
  if (!trimmed.includes(PROGRESS_MARKER_PREFIX) || !trimmed.startsWith('{')) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return [];
  }
  const strings: string[] = [];
  collectStringValues(parsed, strings);
  return strings
    .flatMap((value) => value.split(/\r?\n/))
    .map((value) => value.trim())
    .filter((value) => value.startsWith(PROGRESS_MARKER_PREFIX));
}

function createRunProgressReporter(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
}): RunProgressReporter {
  const sequenceBySource = new Map<string, number>();
  const warnings: string[] = [];
  let harnessLineBuffer = '';

  const appendWarning = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(`Progress event append failed: ${message}`);
  };

  const getNextSequence = (source: string) => {
    const sequence = (sequenceBySource.get(source) || 0) + 1;
    sequenceBySource.set(source, sequence);
    return sequence;
  };

  const append = async (event: RunProgressAppendOptions) => {
    const source = event.source || DAEMON_PROGRESS_SOURCE;
    const phase = sanitizeProgressPart(event.phase);
    const status = sanitizeProgressPart(event.status);
    if (!phase || !status) {
      return;
    }
    try {
      await options.gateway.appendEvent(options.getLease(), {
        source,
        sequence: getNextSequence(source),
        eventType: `${phase}.${status}`,
        level: event.level || getProgressLevel(status),
        message: event.message || `${phase} ${status}`,
        payloadJson: compactProgressPayloadJson({
          progress: true,
          phase,
          status,
          ...(event.payloadJson || {}),
        }),
        emittedAt: new Date().toISOString(),
      });
    } catch (error) {
      appendWarning(error);
    }
  };

  return {
    append,
    appendHarnessMarkers: async (text) => {
      if (!text) {
        return;
      }
      harnessLineBuffer += text;
      const rawLines = harnessLineBuffer.split(/\r?\n/);
      harnessLineBuffer = rawLines.pop() || '';
      for (const rawLine of rawLines) {
        for (const markerLine of extractHarnessProgressMarkerLines(rawLine)) {
          const event = parseHarnessProgressMarker(markerLine);
          if (event) {
            await append(event);
          }
        }
      }
    },
    getWarnings: () => [...warnings],
  };
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
  status: RunHeartbeatStatus | (() => RunHeartbeatStatus);
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
      .heartbeatRun(options.getLease(), typeof options.status === 'function' ? options.status() : options.status)
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
  progressReporter?: RunProgressReporter;
  observationWarnings?: string[];
  declaredArtifactSummary?: JsonRecord;
}) {
  const observationWarnings: string[] = [...(options.observationWarnings || [])];
  const declaredArtifactSummary = compactDeclaredArtifactSummary(options.declaredArtifactSummary);
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
        ...(Object.keys(declaredArtifactSummary).length ? { declaredArtifacts: declaredArtifactSummary } : {}),
        ...(observationWarnings.length ? { observationWarnings } : {}),
      },
    });
  } catch (error) {
    observationWarnings.push(error instanceof Error ? error.message : String(error));
  }

  try {
    if (options.result.status === 'succeeded') {
      await options.progressReporter?.append({
        phase: 'run.finalizing',
        status: 'succeeded',
        message: 'Run finalization completed',
        payloadJson: {
          exitCode: options.result.exitCode,
        },
      });
      await options.gateway.completeRun(options.getLease(), {
        status: 'succeeded',
        exitCode: options.result.exitCode,
        ...(Object.keys(declaredArtifactSummary).length ? { declaredArtifacts: declaredArtifactSummary } : {}),
        ...(observationWarnings.length ? { observationWarnings } : {}),
      });
      return 'succeeded';
    }
    if (options.result.status === 'timeout') {
      await options.progressReporter?.append({
        phase: 'run.finalizing',
        status: 'timeout',
        message: 'Run finalization timed out the process',
        payloadJson: {
          exitCode: options.result.exitCode,
          signal: options.result.signal,
        },
      });
      await options.gateway.timeoutRun(options.getLease(), 'Process timeout confirmed by daemon');
      return 'timeout';
    }
    if (options.result.status === 'canceled') {
      await options.progressReporter?.append({
        phase: 'run.finalizing',
        status: 'canceled',
        message: 'Run finalization acknowledged cancellation',
      });
      await options.gateway.cancelAckRun(options.getLease());
      return 'canceled';
    }
    if (options.result.status === 'lease_lost') {
      return 'lease_lost';
    }

    await options.progressReporter?.append({
      phase: 'run.finalizing',
      status: 'failed',
      message: `Run finalization failed after process exited with ${options.result.status}`,
      payloadJson: {
        exitCode: options.result.exitCode,
        signal: options.result.signal,
      },
    });
    await options.gateway.failRun(options.getLease(), `Process exited with ${options.result.status}`, {
      exitCode: options.result.exitCode,
      signal: options.result.signal,
      ...(Object.keys(declaredArtifactSummary).length ? { declaredArtifacts: declaredArtifactSummary } : {}),
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
  let executionLeaseBase = claimedLease;
  const activeLease = () => ({
    ...executionLeaseBase,
    ...lease,
  });
  const progressReporter = createRunProgressReporter({
    gateway: options.gateway,
    getLease: activeLease,
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
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'started',
      message: 'Skill sync started',
    });
    const syncResults = await syncSkillsForRun(options, activeLease());
    executionLeaseBase = withInstalledSkillPromptContext(executionLeaseBase, syncResults);
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'succeeded',
      message: 'Skill sync completed',
      payloadJson: {
        skillCount: syncResults.length,
      },
    });
  } catch (error) {
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
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

  const payload = getPayload(activeLease());
  const cwd = path.resolve(options.workspaceRoot, getString(payload.cwd) || '.');
  const terminalBackend = getRequestedTerminalBackend(payload, options.terminalBackend);
  const tmuxSessionName = getManagedTmuxSessionName(claimedLease.runId);
  const usesManagedTmux = terminalBackend === 'tmux' && !options.executeCommand;
  const requestedProvider = getCanonicalProvider(activeLease(), payload);
  const requestedAdapter = requestedProvider ? getAgentAdapter(requestedProvider) : null;
  const commandOutputMode: AgentCommandOutputMode =
    !usesManagedTmux || requestedAdapter?.capabilities.structuredEvents ? 'structured' : 'terminal';
  let terminalStream: TerminalStreamHandle | null = null;
  let liveTimelineReporter: LiveTimelineReporter | null = null;
  const cancelController = new AbortController();
  const leaseLostController = new AbortController();
  let stopHeartbeat: (() => Promise<void>) | null = null;
  let stopControlRequests: (() => Promise<void>) | null = null;
  let runHeartbeatStatus: RunHeartbeatStatus = 'running';

  try {
    const commandSpec = getExecutionCommandSpec(activeLease(), cwd, commandOutputMode);
    await progressReporter.append({
      phase: 'agent.process',
      status: 'started',
      message: 'Agent process started',
      payloadJson: {
        commandKey: commandSpec.commandKey,
        terminalBackend,
      },
    });
    if (usesManagedTmux) {
      liveTimelineReporter = createLiveTimelineReporter({
        gateway: options.gateway,
        getLease: activeLease,
        provider: commandSpec.provider,
      });
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
      status: () => runHeartbeatStatus,
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
          outputMode: commandOutputMode,
          onOutputChunk: async (chunk) => {
            await terminalStream?.appendText(chunk);
            await liveTimelineReporter?.appendText(chunk);
            await progressReporter.appendHarnessMarkers(chunk);
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
    if (!usesManagedTmux) {
      await progressReporter.appendHarnessMarkers(result.stdout.text || '');
      await progressReporter.appendHarnessMarkers(result.stderr.text || '');
    }
    await progressReporter.append({
      phase: 'agent.process',
      status: result.status === 'succeeded' ? 'succeeded' : result.status === 'timeout' ? 'timeout' : 'failed',
      message: `Agent process finished with ${result.status}`,
      payloadJson: {
        status: result.status,
        exitCode: result.exitCode,
        signal: result.signal,
      },
    });
    await liveTimelineReporter?.flush();
    runHeartbeatStatus = 'finalizing';
    try {
      const finalizingLease = await options.gateway.heartbeatRun(activeLease(), 'finalizing');
      lease = {
        ...activeLease(),
        ...finalizingLease,
      };
      if (finalizingLease.cancelRequested) {
        abortForRunCancel(cancelController, finalizingLease);
      }
    } catch {
      leaseLostController.abort();
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
    if (usesManagedTmux) {
      await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
      await terminalStream?.end(toTerminalEndReason(result.status));
    }
    const sessionObservationWarnings = liveTimelineReporter?.getWarnings() || [];
    sessionObservationWarnings.push(
      ...(await reportProviderSessionAndCollectWarnings({
        gateway: options.gateway,
        lease: activeLease(),
        provider: commandSpec.provider,
        result,
      })),
    );
    let declaredArtifactSummary: JsonRecord | undefined;
    await progressReporter.append({
      phase: 'artifacts.collect',
      status: 'started',
      message: 'Artifact collection started',
    });
    try {
      declaredArtifactSummary = await reportDeclaredArtifacts({
        gateway: options.gateway,
        lease: activeLease(),
        payload,
        cwd: commandSpec.cwd,
        workspaceRoot: options.workspaceRoot,
      });
      await progressReporter.append({
        phase: 'artifacts.collect',
        status: 'succeeded',
        message: 'Artifact collection completed',
        payloadJson: compactDeclaredArtifactSummary(declaredArtifactSummary),
      });
    } catch (error) {
      sessionObservationWarnings.push(
        `Declared artifact upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await progressReporter.append({
        phase: 'artifacts.collect',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    if (stopHeartbeat) {
      await stopHeartbeat();
      stopHeartbeat = null;
    }
    if (leaseLostController.signal.aborted) {
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
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    if (refreshedLeaseStatus === 'cancel_requested') {
      await options.gateway.cancelAckRun(activeLease());
      return {
        status: 'canceled',
        runId: claimedLease.runId,
      };
    }
    const terminalResult: ExecDriverResult =
      cancelController.signal.aborted && result.status === 'succeeded'
        ? {
            ...result,
            status: 'canceled',
          }
        : result;
    await progressReporter.append({
      phase: 'run.finalizing',
      status: 'started',
      message: 'Run finalization started',
      payloadJson: {
        status: terminalResult.status,
      },
    });
    const status = await terminalizeRun({
      gateway: options.gateway,
      getLease: activeLease,
      setLease: (nextLease) => {
        lease = nextLease;
      },
      cancelController,
      leaseLostController,
      result: terminalResult,
      progressReporter,
      observationWarnings: [...sessionObservationWarnings, ...progressReporter.getWarnings()],
      declaredArtifactSummary,
    });
    return {
      status,
      runId: claimedLease.runId,
    };
  } catch (error) {
    await liveTimelineReporter?.flush();
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
        await progressReporter.append({
          phase: 'run.finalizing',
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
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
  const retryInitialDelayMs = options.retryInitialDelayMs || DEFAULT_LOOP_RETRY_INITIAL_DELAY_MS;
  const retryMaxDelayMs = options.retryMaxDelayMs || DEFAULT_LOOP_RETRY_MAX_DELAY_MS;
  let failureCount = 0;
  while (!options.stopSignal?.aborted) {
    try {
      await runDaemonOnce(options);
      failureCount = 0;
      await delay(pollIntervalMs, options.stopSignal);
    } catch (error) {
      failureCount += 1;
      const retryDelayMs = Math.min(retryMaxDelayMs, retryInitialDelayMs * 2 ** Math.max(0, failureCount - 1));
      options.onLoopError?.(error, {
        failureCount,
        retryDelayMs,
      });
      await delay(retryDelayMs, options.stopSignal);
    }
  }
}
