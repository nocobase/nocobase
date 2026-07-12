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
import { StringDecoder } from 'string_decoder';

import {
  buildDeclaredArtifactManifestUpload,
  buildTextArtifactUpload,
  processDeclaredArtifactUploads,
} from './artifactUpload';
import { isAgentGatewayLeaseLostError, isAgentGatewayRetryableError } from './apiClient';
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
import {
  AgentProfileDetector,
  createCachedProfileDetector,
  detectAgentProfiles,
  DetectAgentProfilesOptions,
} from './profileDetection';
import {
  SkillVersionInstallRecord,
  SkillVersionSource,
  syncNodeSkillVersion,
  SyncNodeSkillVersionResult,
} from './skillSync';
import {
  cleanupProjectSkillsForRun,
  cleanupStaleProjectSkills,
  createProjectSkillRunState,
  installProjectSkillsForRun,
  ProjectSkillCleanupResult,
  ProjectSkillRunState,
} from './projectSkills';
import { JsonRecord, PendingControlRequest, RunLease } from './types';
import { getLocalRunLeaseDeadlineMonotonicMs, getMonotonicTimeMs } from './leaseDeadline';
import { TerminalRingBuffer } from './terminalRingBuffer';
import { DaemonTerminalStreamClient, DaemonTerminalStreamClientOptions } from './terminalStreamClient';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../shared/conversationLimits';
import { AGENT_GATEWAY_TERMINATE_CONTROL_CANCEL_REASON } from '../shared/runControl';
import { hasAgentCapabilitySignal, normalizeAgentProviderCapabilities } from '../shared/providerCapabilities';
import {
  AgentCommandOutputMode,
  getCanonicalProvider,
  getDeclaredArtifactModifiedSinceMs,
  getExecutionCommandSpec,
  getPayload,
  getRequestedTerminalBackend,
} from './executionCommand';
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
  detectProfiles?: AgentProfileDetector;
  claimProfileKey?: string;
  claimRunId?: string;
  runHeartbeatIntervalMs?: number;
  syncSkillVersion?: typeof syncNodeSkillVersion;
  executeCommand?: typeof executeAllowlistedCommand;
  maxOutputSpoolBytes?: number;
  terminalRingBufferMaxBytes?: number;
  terminalStreamClientFactory?: (options: DaemonTerminalStreamClientOptions) => TerminalStreamHandle;
  stopSignal?: AbortSignal;
}

export interface DaemonRunLoopOptions extends RunDaemonOnceOptions {
  pollIntervalMs?: number;
  profileRefreshIntervalMs?: number;
  retryInitialDelayMs?: number;
  retryMaxDelayMs?: number;
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
const MAX_CONVERSATION_EVENT_BATCH_BYTES = 8 * 1024 * 1024;
const MAX_PROVIDER_NORMALIZATION_LINE_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS + 256 * 1024;
const LIVE_TIMELINE_SOURCE = 'terminal-live';
const DAEMON_PROGRESS_SOURCE = 'agent-gateway-daemon';
const HARNESS_PROGRESS_SOURCE = 'harness';
const PROGRESS_MARKER_PREFIX = 'AGW_PROGRESS';
const LIVE_TIMELINE_FLUSH_INTERVAL_MS = 2000;
const LIVE_TIMELINE_MAX_CHARS_PER_EVENT = 4000;
const LIVE_TIMELINE_MAX_PENDING_EVENTS = 200;
const LIVE_TIMELINE_MAX_PENDING_BYTES = 2 * 1024 * 1024;
const LIVE_TIMELINE_MAX_FALLBACK_BYTES = 256 * 1024;
const LIVE_TIMELINE_MAX_LINE_BYTES = 256 * 1024;
const LIVE_TIMELINE_MAX_WARNINGS = 20;
const CONVERSATION_CONTENT_JSON_BUDGET_CHARS = COMMAND_CONTENT_JSON_LIMIT_CHARS - 4096;
const RAW_PROVIDER_PREVIEW_CHARS = 4000;
const PROGRESS_EVENT_PAYLOAD_BUDGET_CHARS = 14 * 1024;
const PROGRESS_EVENT_PAYLOAD_PREVIEW_CHARS = 2000;
const HARNESS_PROGRESS_MAX_LINE_BYTES = 256 * 1024;
const PROGRESS_MAX_WARNINGS = 20;
const SUMMARY_ARRAY_SAMPLE_LIMIT = 20;
const DEFAULT_LOOP_RETRY_INITIAL_DELAY_MS = 1000;
const DEFAULT_LOOP_RETRY_MAX_DELAY_MS = 30_000;
const DEFAULT_RUN_HEARTBEAT_RETRY_DELAY_MS = 250;

function takeUtf8Prefix(text: string, maxBytes: number) {
  const content = Buffer.from(text);
  if (content.byteLength <= maxBytes) {
    return {
      text,
      bytes: content.byteLength,
    };
  }
  const decoder = new StringDecoder('utf8');
  const prefix = decoder.write(content.subarray(0, Math.max(0, maxBytes)));
  return {
    text: prefix,
    bytes: Buffer.byteLength(prefix),
  };
}

interface TerminalStreamHandle {
  start(): Promise<void>;
  appendText(text: string): Promise<void>;
  end(reason: TerminalEnd['reason']): Promise<boolean>;
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

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function isWithin(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function resolveWorkspaceCwd(workspaceRoot: string, cwd: string) {
  const requestedCwd = path.resolve(workspaceRoot, cwd || '.');
  const [realWorkspaceRoot, realCwd] = await Promise.all([fs.realpath(workspaceRoot), fs.realpath(requestedCwd)]);
  if (!isWithin(realWorkspaceRoot, realCwd)) {
    throw new Error('cwd must stay inside the configured workspace root');
  }
  return realCwd;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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

function compactProjectSkillState(projectSkillState: ProjectSkillRunState | null) {
  if (!projectSkillState) {
    return {};
  }
  return {
    projectSkillInstall: {
      stagingRoot: projectSkillState.stagingRoot,
      installed: projectSkillState.installed.map((item) => ({
        skillVersionId: item.skillVersionId,
        skillName: item.skillName,
        targetPath: item.targetPath,
        sourceDigest: item.sourceDigest,
      })),
      skipped: projectSkillState.skipped.map((item) => ({
        skillVersionId: item.skillVersionId,
        skillName: item.skillName,
        targetPath: item.targetPath,
        sourceDigest: item.sourceDigest,
        reason: item.reason,
      })),
    },
  };
}

function withInstalledSkillMetadata(
  lease: RunLease,
  syncResults: SyncNodeSkillVersionResult[],
  projectSkillState: ProjectSkillRunState | null,
) {
  if (!syncResults.length && !projectSkillState) {
    return lease;
  }
  const run = isRecord(lease.run) ? lease.run : {};
  const payload = getPayload(lease);
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
        ...compactProjectSkillState(projectSkillState),
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
  if (options.output.text !== null && (options.output.text || options.output.truncated)) {
    await options.gateway.registerArtifact(options.lease, {
      artifactKey: `${options.streamName}-main`,
      artifactType: options.streamName,
      mimeType: 'text/plain',
      sizeBytes: options.output.sizeBytes,
      contentText: options.output.text,
      metadata: {
        originalSizeBytes: options.output.sizeBytes,
        uploadedBytes: Buffer.byteLength(options.output.text),
        truncated: options.output.truncated === true,
        ...(options.output.capturedBytes !== undefined ? { capturedBytes: options.output.capturedBytes } : {}),
        ...(options.output.truncated ? { spoolTruncated: true } : {}),
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
      metadata: {
        ...artifactUpload.metadata,
        ...(options.output.capturedBytes !== undefined ? { capturedBytes: options.output.capturedBytes } : {}),
        ...(options.output.truncated ? { truncated: true, spoolTruncated: true } : {}),
      },
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
  getLease(): RunLease;
  payload: JsonRecord;
  cwd: string;
}) {
  const uploadedArtifactKeys: string[] = [];
  const uploadFailures: JsonRecord[] = [];
  const collection = await processDeclaredArtifactUploads({
    payload: options.payload,
    cwd: options.cwd,
    modifiedSinceMs: getDeclaredArtifactModifiedSinceMs(options.getLease(), options.payload),
    onUpload: async (upload) => {
      try {
        await options.gateway.registerArtifact(options.getLease(), upload);
        uploadedArtifactKeys.push(upload.artifactKey);
      } catch (error) {
        uploadFailures.push({
          artifactKey: upload.artifactKey,
          artifactType: upload.artifactType,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  });
  const finalManifest = {
    ...collection.manifest,
    counts: {
      ...getRecord(collection.manifest.counts),
      uploaded: uploadedArtifactKeys.length,
      failed: uploadFailures.length,
    },
    ...(uploadFailures.length ? { uploadFailures } : {}),
  };
  const manifestUpload = buildDeclaredArtifactManifestUpload(finalManifest);
  try {
    await options.gateway.registerArtifact(options.getLease(), manifestUpload.upload);
    uploadedArtifactKeys.push(manifestUpload.upload.artifactKey);
  } catch (error) {
    uploadFailures.push({
      artifactKey: manifestUpload.upload.artifactKey,
      artifactType: manifestUpload.upload.artifactType,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    declaredArtifactCount: uploadedArtifactKeys.length,
    declaredArtifactKeys: uploadedArtifactKeys,
    declaredArtifactFailedCount: uploadFailures.length,
    ...(uploadFailures.length ? { declaredArtifactFailures: uploadFailures } : {}),
    artifactManifest: manifestUpload.manifest,
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

async function processOutputLinesForProviderEvents(
  output: ExecDriverResult['stdout'],
  onLine: (rawLine: string) => Promise<void>,
) {
  let lineBuffer = '';
  let lineTruncated = false;
  let truncatedLines = 0;
  let droppedBytes = 0;

  const appendSegment = (segment: string) => {
    if (lineTruncated || !segment) {
      droppedBytes += lineTruncated ? Buffer.byteLength(segment) : 0;
      return;
    }
    const remainingBytes = MAX_PROVIDER_NORMALIZATION_LINE_BYTES - Buffer.byteLength(lineBuffer);
    const captured = takeUtf8Prefix(segment, remainingBytes);
    lineBuffer += captured.text;
    const segmentBytes = Buffer.byteLength(segment);
    if (captured.bytes < segmentBytes) {
      lineTruncated = true;
      droppedBytes += segmentBytes - captured.bytes;
    }
  };

  const emitLine = async () => {
    if (lineTruncated) {
      truncatedLines += 1;
    }
    await onLine(lineBuffer);
    lineBuffer = '';
    lineTruncated = false;
  };

  const processText = async (text: string) => {
    let offset = 0;
    while (offset < text.length) {
      const newlineIndex = text.indexOf('\n', offset);
      if (newlineIndex < 0) {
        appendSegment(text.slice(offset));
        return;
      }
      const lineEnd = newlineIndex > offset && text[newlineIndex - 1] === '\r' ? newlineIndex - 1 : newlineIndex;
      appendSegment(text.slice(offset, lineEnd));
      await emitLine();
      offset = newlineIndex + 1;
    }
  };

  if (output.text) {
    await processText(output.text);
  } else if (output.artifactPath) {
    const decoder = new StringDecoder('utf8');
    const reader = createReadStream(output.artifactPath);
    for await (const rawChunk of reader) {
      const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(String(rawChunk));
      await processText(decoder.write(chunk));
    }
    await processText(decoder.end());
  }
  if (lineBuffer || lineTruncated) {
    await emitLine();
  }
  return {
    truncatedLines,
    droppedBytes,
  };
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

async function reportProviderConversationEvents(options: {
  gateway: AgentGatewayDaemonNodeClient;
  getLease(): RunLease;
  provider?: string;
  result: ExecDriverResult;
}) {
  const adapter = options.provider ? getAgentAdapter(options.provider) : null;
  if (!adapter?.capabilities.structuredEvents) {
    return;
  }

  let sequence = 1;
  let batchBytes = 0;
  let truncatedLines = 0;
  let droppedBytes = 0;
  const events: JsonRecord[] = [];
  const flush = async () => {
    if (!events.length) {
      return;
    }
    const batch = events.splice(0, events.length);
    batchBytes = 0;
    await options.gateway.appendConversationEvents(options.getLease(), {
      events: batch,
    });
  };
  for (const outputRecord of [options.result.stdout, options.result.stderr]) {
    const lineStats = await processOutputLinesForProviderEvents(outputRecord, async (rawLine) => {
      for (const event of adapter.normalizeEvent({ rawLine, source: options.provider })) {
        const record = buildConversationEventRecord(adapter.provider, sequence, event, rawLine);
        const recordBytes = Buffer.byteLength(JSON.stringify(record));
        if (
          events.length &&
          (events.length >= MAX_CONVERSATION_EVENTS_PER_APPEND ||
            batchBytes + recordBytes > MAX_CONVERSATION_EVENT_BATCH_BYTES)
        ) {
          await flush();
        }
        events.push(record);
        batchBytes += recordBytes;
        sequence += 1;
        if (events.length >= MAX_CONVERSATION_EVENTS_PER_APPEND || batchBytes >= MAX_CONVERSATION_EVENT_BATCH_BYTES) {
          await flush();
        }
      }
    });
    truncatedLines += lineStats.truncatedLines;
    droppedBytes += lineStats.droppedBytes;
  }
  await flush();
  return {
    truncatedLines,
    droppedBytes,
  };
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
  getLease(): RunLease;
  provider?: string;
  result: ExecDriverResult;
}) {
  const detected = await detectProviderSessionId(options.provider, options.result);
  if (!detected) {
    return null;
  }

  let lastError: unknown;
  const profileCapabilities = options.getLease().profileCapabilities;
  const capabilities = hasAgentCapabilitySignal(profileCapabilities)
    ? normalizeAgentProviderCapabilities(detected.adapter.provider, profileCapabilities)
    : detected.adapter.capabilities;
  for (let attempt = 1; attempt <= PROVIDER_SESSION_UPSERT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await options.gateway.upsertAgentSession(options.getLease(), {
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
  getLease(): RunLease;
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
    const normalizationStats = await reportProviderConversationEvents(options);
    if (normalizationStats?.truncatedLines || normalizationStats?.droppedBytes) {
      warnings.push(
        `Agent timeline normalization truncated: truncatedLines=${normalizationStats.truncatedLines}, droppedBytes=${normalizationStats.droppedBytes}`,
      );
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
  let pendingStructuredBytes = 0;
  let droppingOversizedLine = false;
  let structuredSequenceReliable = true;
  let droppedStructuredEvents = 0;
  let droppedStructuredBytes = 0;
  let droppedFallbackBytes = 0;
  let truncatedLines = 0;
  let droppedLineBytes = 0;
  let suppressedWarnings = 0;
  let lastFlushAt = 0;
  const warnings: string[] = [];

  const isPayloadTooLargeError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return /(?:HTTP\s*413|413\b|too large)/i.test(message);
  };

  const appendWarning = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (warnings.length < LIVE_TIMELINE_MAX_WARNINGS) {
      warnings.push(`Live timeline append failed: ${message}`);
    } else {
      suppressedWarnings += 1;
    }
  };

  const getRecordBytes = (record: JsonRecord) => Buffer.byteLength(JSON.stringify(record));

  const queueFallbackText = (text: string) => {
    if (!text) {
      return;
    }
    const addition = fallbackBuffer ? `\n${text}` : text;
    const additionBytes = Buffer.byteLength(addition);
    const remainingBytes = Math.max(0, LIVE_TIMELINE_MAX_FALLBACK_BYTES - Buffer.byteLength(fallbackBuffer));
    const captured = takeUtf8Prefix(addition, remainingBytes);
    fallbackBuffer += captured.text;
    droppedFallbackBytes += additionBytes - captured.bytes;
  };

  const queueStructuredEvent = (record: JsonRecord) => {
    const recordBytes = getRecordBytes(record);
    if (
      pendingStructuredEvents.length >= LIVE_TIMELINE_MAX_PENDING_EVENTS ||
      pendingStructuredBytes + recordBytes > LIVE_TIMELINE_MAX_PENDING_BYTES
    ) {
      droppedStructuredEvents += 1;
      droppedStructuredBytes += recordBytes;
      return;
    }
    pendingStructuredEvents.push(record);
    pendingStructuredBytes += recordBytes;
  };

  const queueStructuredLine = (line: string) => {
    if (!structuredSequenceReliable) {
      queueFallbackText(line);
      return;
    }
    const normalizedEvents =
      structuredAdapter?.normalizeEvent({ rawLine: line, source: structuredAdapter.provider }) || [];
    if (!normalizedEvents.length) {
      queueFallbackText(line);
      return;
    }
    for (const event of normalizedEvents) {
      structuredSequence += 1;
      queueStructuredEvent(buildConversationEventRecord(structuredAdapter.provider, structuredSequence, event, line));
    }
  };

  const queueOversizedLine = (line: string) => {
    const lineBytes = Buffer.byteLength(line);
    const captured = takeUtf8Prefix(line, LIVE_TIMELINE_MAX_LINE_BYTES);
    queueFallbackText(captured.text);
    structuredSequenceReliable = false;
    truncatedLines += 1;
    droppedLineBytes += lineBytes - captured.bytes;
  };

  const processCompleteLines = (text: string) => {
    if (!text) {
      return;
    }
    if (!structuredAdapter) {
      queueFallbackText(text);
      return;
    }

    let remainingText = text;
    if (droppingOversizedLine) {
      const newlineIndex = remainingText.search(/\r?\n/);
      if (newlineIndex < 0) {
        droppedLineBytes += Buffer.byteLength(remainingText);
        return;
      }
      const newlineLength = remainingText[newlineIndex] === '\r' ? 2 : 1;
      droppedLineBytes += Buffer.byteLength(remainingText.slice(0, newlineIndex + newlineLength));
      remainingText = remainingText.slice(newlineIndex + newlineLength);
      droppingOversizedLine = false;
    }

    lineBuffer += remainingText;
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop() || '';
    for (const line of lines) {
      if (Buffer.byteLength(line) > LIVE_TIMELINE_MAX_LINE_BYTES) {
        queueOversizedLine(line);
      } else {
        queueStructuredLine(line);
      }
    }
    if (Buffer.byteLength(lineBuffer) > LIVE_TIMELINE_MAX_LINE_BYTES) {
      queueOversizedLine(lineBuffer);
      lineBuffer = '';
      droppingOversizedLine = true;
    }
  };

  const processRemainingLine = () => {
    if (!lineBuffer) {
      return;
    }
    const line = lineBuffer;
    lineBuffer = '';
    if (Buffer.byteLength(line) > LIVE_TIMELINE_MAX_LINE_BYTES) {
      queueOversizedLine(line);
    } else {
      queueStructuredLine(line);
    }
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
    pendingStructuredBytes = 0;
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
        for (const event of structuredEvents) {
          queueStructuredEvent(event);
        }
        queueFallbackText(fallbackText);
      } else {
        droppedStructuredEvents += structuredEvents.length;
        droppedStructuredBytes += structuredEvents.reduce((total, event) => total + getRecordBytes(event), 0);
        droppedFallbackBytes += Buffer.byteLength(fallbackText);
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
        Buffer.byteLength(fallbackBuffer) >= LIVE_TIMELINE_MAX_CHARS_PER_EVENT ||
        pendingStructuredEvents.length >= MAX_CONVERSATION_EVENTS_PER_APPEND ||
        pendingStructuredBytes >= MAX_CONVERSATION_EVENT_BATCH_BYTES ||
        Date.now() - lastFlushAt >= LIVE_TIMELINE_FLUSH_INTERVAL_MS;
      if (shouldFlush) {
        await flush(false);
      }
    },
    flush: async () => flush(true),
    getWarnings: () => {
      const truncationWarning =
        droppedStructuredEvents || droppedStructuredBytes || droppedFallbackBytes || truncatedLines || droppedLineBytes
          ? [
              `Live timeline truncated: droppedStructuredEvents=${droppedStructuredEvents}, droppedStructuredBytes=${droppedStructuredBytes}, droppedFallbackBytes=${droppedFallbackBytes}, truncatedLines=${truncatedLines}, droppedLineBytes=${droppedLineBytes}`,
            ]
          : [];
      const suppressionWarning = suppressedWarnings
        ? [`Live timeline append warnings suppressed: count=${suppressedWarnings}`]
        : [];
      return [...warnings, ...truncationWarning, ...suppressionWarning];
    },
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
  let droppingOversizedHarnessLine = false;
  let droppedHarnessBytes = 0;
  let suppressedWarnings = 0;

  const appendWarning = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (warnings.length < PROGRESS_MAX_WARNINGS) {
      warnings.push(`Progress event append failed: ${message}`);
    } else {
      suppressedWarnings += 1;
    }
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
      let remainingText = text;
      if (droppingOversizedHarnessLine) {
        const newlineIndex = remainingText.search(/\r?\n/);
        if (newlineIndex < 0) {
          droppedHarnessBytes += Buffer.byteLength(remainingText);
          return;
        }
        const newlineLength = remainingText[newlineIndex] === '\r' ? 2 : 1;
        droppedHarnessBytes += Buffer.byteLength(remainingText.slice(0, newlineIndex + newlineLength));
        remainingText = remainingText.slice(newlineIndex + newlineLength);
        droppingOversizedHarnessLine = false;
      }
      harnessLineBuffer += remainingText;
      const rawLines = harnessLineBuffer.split(/\r?\n/);
      harnessLineBuffer = rawLines.pop() || '';
      for (const rawLine of rawLines) {
        if (Buffer.byteLength(rawLine) > HARNESS_PROGRESS_MAX_LINE_BYTES) {
          droppedHarnessBytes += Buffer.byteLength(rawLine);
          continue;
        }
        for (const markerLine of extractHarnessProgressMarkerLines(rawLine)) {
          const event = parseHarnessProgressMarker(markerLine);
          if (event) {
            await append(event);
          }
        }
      }
      if (Buffer.byteLength(harnessLineBuffer) > HARNESS_PROGRESS_MAX_LINE_BYTES) {
        droppedHarnessBytes += Buffer.byteLength(harnessLineBuffer);
        harnessLineBuffer = '';
        droppingOversizedHarnessLine = true;
      }
    },
    getWarnings: () => [
      ...warnings,
      ...(droppedHarnessBytes ? [`Harness progress parsing truncated: droppedBytes=${droppedHarnessBytes}`] : []),
      ...(suppressedWarnings ? [`Progress event append warnings suppressed: count=${suppressedWarnings}`] : []),
    ],
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

function forwardAbortSignal(signal: AbortSignal | undefined, controller: AbortController) {
  if (!signal) {
    return () => {};
  }
  const abort = () => {
    controller.abort(signal.reason);
  };
  if (signal.aborted) {
    abort();
    return () => {};
  }
  signal.addEventListener('abort', abort, { once: true });
  return () => {
    signal.removeEventListener('abort', abort);
  };
}

function throwIfSignalAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }
  if (signal.reason instanceof Error) {
    throw signal.reason;
  }
  const error = new Error('Run phase aborted');
  error.name = 'AbortError';
  throw error;
}

async function syncSkillsForRun(
  options: RunDaemonOnceOptions,
  lease: RunLease,
  skillsRoot = options.skillsRoot,
  signal?: AbortSignal,
): Promise<SyncNodeSkillVersionResult[]> {
  const payload = getPayload(lease);
  const skillVersions = dedupeSkillVersions(getSkillVersions(payload));
  const results: SyncNodeSkillVersionResult[] = [];
  for (const skillVersion of skillVersions) {
    throwIfSignalAborted(signal);
    results.push(
      await (options.syncSkillVersion || syncNodeSkillVersion)({
        nodeId: options.gateway.nodeId,
        skillsRoot,
        skillVersion,
        downloadHeaders: options.gateway.getNodeAuthHeaders(),
        trustedArchiveServerUrl: options.gateway.serverUrl,
        signal,
        writeInstallStatus: async (installPayload) => {
          await options.gateway.upsertSkillInstall(installPayload);
        },
      }),
    );
  }
  throwIfSignalAborted(signal);
  return results;
}

function compactProjectSkillCleanupResult(result: ProjectSkillCleanupResult): JsonRecord {
  return {
    removedCount: result.removed.length,
    skippedCount: result.skipped.length,
    existingCount: result.existing.length,
    warningCount: result.warnings.length,
    removed: result.removed.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT).map((item) => ({
      skillVersionId: item.skillVersionId,
      skillName: item.skillName,
      targetPath: item.targetPath,
    })),
    skipped: result.skipped.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT).map((item) => ({
      skillVersionId: item.skillVersionId,
      skillName: item.skillName,
      targetPath: item.targetPath,
    })),
    existing: result.existing.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT).map((item) => ({
      skillVersionId: item.skillVersionId,
      skillName: item.skillName,
      targetPath: item.targetPath,
    })),
  };
}

function compactProjectSkillJanitorResult(result: { removedPaths: string[]; warnings: string[] }): JsonRecord {
  return {
    removedCount: result.removedPaths.length,
    warningCount: result.warnings.length,
    removedPaths: result.removedPaths.slice(0, SUMMARY_ARRAY_SAMPLE_LIMIT),
  };
}

async function markProjectSkillsRemoved(options: {
  gateway: AgentGatewayDaemonNodeClient;
  nodeId: string;
  cleanupResult: ProjectSkillCleanupResult;
}) {
  for (const removed of [...options.cleanupResult.removed, ...options.cleanupResult.existing]) {
    await options.gateway.upsertSkillInstall({
      nodeId: options.nodeId,
      skillVersionId: removed.skillVersionId,
      status: 'removed',
      lastSeenAt: new Date().toISOString(),
      capabilitiesSnapshotJson: {
        projectSkillPath: removed.targetPath,
        sourceDigest: removed.sourceDigest,
      },
      settingsSnapshotJson: {
        cleanup: true,
        skillName: removed.skillName,
      },
    });
  }
}

async function heartbeatRunWithRetry(
  gateway: AgentGatewayDaemonNodeClient,
  lease: RunLease,
  status: RunHeartbeatStatus,
  signal?: AbortSignal,
) {
  const leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(lease);
  for (;;) {
    throwIfSignalAborted(signal);
    try {
      return await gateway.heartbeatRun(lease, status);
    } catch (error) {
      const remainingMs = leaseDeadlineMs - getMonotonicTimeMs();
      if (isAgentGatewayLeaseLostError(error) || !isAgentGatewayRetryableError(error) || remainingMs <= 0) {
        throw error;
      }
      await delay(Math.min(DEFAULT_RUN_HEARTBEAT_RETRY_DELAY_MS, remainingMs), signal);
    }
  }
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
  let stopped = false;
  let leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(options.getLease());
  let leaseDeadlineTimer: ReturnType<typeof setTimeout> | null = null;
  const abortForLeaseLoss = () => {
    if (!options.leaseLostController.signal.aborted) {
      options.leaseLostController.abort();
    }
  };
  const scheduleLeaseDeadline = (lease: RunLease) => {
    leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(lease);
    if (leaseDeadlineTimer) {
      clearTimeout(leaseDeadlineTimer);
    }
    const remainingMs = leaseDeadlineMs - getMonotonicTimeMs();
    if (remainingMs <= 0) {
      abortForLeaseLoss();
      return;
    }
    leaseDeadlineTimer = setTimeout(abortForLeaseLoss, remainingMs);
  };
  scheduleLeaseDeadline(options.getLease());
  const sendHeartbeat = () => {
    if (stopped || inFlight || options.leaseLostController.signal.aborted) {
      return;
    }
    inFlight = options.gateway
      .heartbeatRun(options.getLease(), typeof options.status === 'function' ? options.status() : options.status)
      .then((lease) => {
        const nextLease = {
          ...options.getLease(),
          ...lease,
        };
        options.setLease(nextLease);
        if (!stopped) {
          scheduleLeaseDeadline(nextLease);
        }
        if (lease.cancelRequested) {
          abortForRunCancel(options.cancelController, lease);
        }
      })
      .catch((error) => {
        if (
          isAgentGatewayLeaseLostError(error) ||
          !isAgentGatewayRetryableError(error) ||
          getMonotonicTimeMs() >= leaseDeadlineMs
        ) {
          abortForLeaseLoss();
        }
      })
      .finally(() => {
        inFlight = null;
      });
  };
  const timer = setInterval(() => {
    sendHeartbeat();
  }, options.intervalMs);
  return async () => {
    stopped = true;
    clearInterval(timer);
    await inFlight;
    if (leaseDeadlineTimer) {
      clearTimeout(leaseDeadlineTimer);
      leaseDeadlineTimer = null;
    }
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
  const leaseDeadlineMs = getLocalRunLeaseDeadlineMonotonicMs(options.getLease());
  for (;;) {
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
    } catch (error) {
      const remainingMs = leaseDeadlineMs - getMonotonicTimeMs();
      if (isAgentGatewayLeaseLostError(error) || !isAgentGatewayRetryableError(error) || remainingMs <= 0) {
        options.leaseLostController.abort();
        return 'lease_lost';
      }
      await delay(Math.min(DEFAULT_RUN_HEARTBEAT_RETRY_DELAY_MS, remainingMs));
    }
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
      return await client.end(reason);
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
  if (options.stopSignal?.aborted) {
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'daemon_stopped',
    };
  }
  let lease: RunLease;
  try {
    lease = await heartbeatRunWithRetry(options.gateway, claimedLease, 'syncing_skills', options.stopSignal);
  } catch {
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'skill_sync_heartbeat_failed',
    };
  }
  let executionLeaseBase = claimedLease;
  const activeLease = () => ({
    ...executionLeaseBase,
    ...lease,
  });
  const progressReporter = createRunProgressReporter({
    gateway: options.gateway,
    getLease: activeLease,
  });
  let cwd = '';
  let projectSkillState: ProjectSkillRunState | null = null;
  let projectSkillCleanupDone = false;
  const cleanupProjectSkills = async (reportProgress = true) => {
    if (!projectSkillState || projectSkillCleanupDone) {
      return [];
    }
    projectSkillCleanupDone = true;
    try {
      if (reportProgress) {
        await progressReporter.append({
          phase: 'skill.cleanup',
          status: 'started',
          message: 'Temporary project Skill cleanup started',
        });
      }
      const cleanupResult = await cleanupProjectSkillsForRun(projectSkillState);
      await markProjectSkillsRemoved({
        gateway: options.gateway,
        nodeId: options.gateway.nodeId,
        cleanupResult,
      });
      if (reportProgress) {
        await progressReporter.append({
          phase: 'skill.cleanup',
          status: 'succeeded',
          message: 'Temporary project Skill cleanup completed',
          payloadJson: compactProjectSkillCleanupResult(cleanupResult),
        });
      }
      return cleanupResult.warnings;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (reportProgress) {
        await progressReporter.append({
          phase: 'skill.cleanup',
          status: 'failed',
          level: 'warning',
          message,
        });
      }
      return [`Temporary project Skill cleanup failed: ${message}`];
    }
  };

  const syncCancelController = new AbortController();
  const syncLeaseLostController = new AbortController();
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }
  const stopForwardingSyncAbort = forwardAbortSignal(options.stopSignal, syncLeaseLostController);
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
    const syncPayload = getPayload(activeLease());
    cwd = await resolveWorkspaceCwd(options.workspaceRoot, getString(syncPayload.cwd) || '.');
    if (getSkillVersions(syncPayload).length) {
      projectSkillState = createProjectSkillRunState(cwd, claimedLease.runId);
    }
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'started',
      message: 'Skill sync started',
    });
    const syncResults = await syncSkillsForRun(
      options,
      activeLease(),
      projectSkillState?.stagingRoot,
      syncLeaseLostController.signal,
    );
    if (!syncLeaseLostController.signal.aborted && !syncCancelController.signal.aborted) {
      if (syncResults.length && !projectSkillState) {
        projectSkillState = createProjectSkillRunState(cwd, claimedLease.runId);
      }
      if (projectSkillState) {
        const provider = getCanonicalProvider(activeLease(), syncPayload);
        const adapter = provider ? getAgentAdapter(provider) : null;
        const projectSkillTargetDirs = adapter?.projectSkillTargetDirs || [];
        if (projectSkillTargetDirs.length) {
          const janitorResult = await cleanupStaleProjectSkills({
            cwd,
            runId: claimedLease.runId,
            projectSkillTargetDirs,
          });
          if (janitorResult.removedPaths.length || janitorResult.warnings.length) {
            await progressReporter.append({
              phase: 'skill.janitor',
              status: janitorResult.warnings.length ? 'warning' : 'succeeded',
              level: janitorResult.warnings.length ? 'warning' : 'info',
              message: 'Stale temporary project Skill cleanup completed',
              payloadJson: compactProjectSkillJanitorResult(janitorResult),
            });
          }
        }
        projectSkillState = await installProjectSkillsForRun({
          state: projectSkillState,
          provider,
          projectSkillTargetDirs,
          syncResults,
        });
      }
    }
    executionLeaseBase = withInstalledSkillMetadata(executionLeaseBase, syncResults, projectSkillState);
    await progressReporter.append({
      phase: 'skill.sync',
      status: 'succeeded',
      message: 'Skill sync completed',
      payloadJson: {
        skillCount: syncResults.length,
      },
    });
  } catch (error) {
    if (!syncLeaseLostController.signal.aborted) {
      await progressReporter.append({
        phase: 'skill.sync',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
      stopSyncHeartbeat = null;
    }
    await cleanupProjectSkills();
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
    stopForwardingSyncAbort();
    if (stopSyncHeartbeat) {
      await stopSyncHeartbeat();
    }
  }
  if (syncLeaseLostController.signal.aborted) {
    await cleanupProjectSkills();
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'skill_sync_lease_lost',
    };
  }
  if (syncCancelController.signal.aborted) {
    await cleanupProjectSkills();
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
      reason: 'skill_sync_canceled',
    };
  }

  try {
    lease = await heartbeatRunWithRetry(options.gateway, activeLease(), 'running', options.stopSignal);
  } catch {
    await cleanupProjectSkills();
    return {
      status: 'lease_lost',
      runId: claimedLease.runId,
      reason: 'execution_heartbeat_failed',
    };
  }
  if (lease.cancelRequested) {
    await options.gateway.cancelAckRun(activeLease());
    return {
      status: 'canceled',
      runId: claimedLease.runId,
    };
  }

  const payload = getPayload(activeLease());
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
  const stopForwardingExecutionAbort = forwardAbortSignal(options.stopSignal, leaseLostController);
  let stopHeartbeat: (() => Promise<void>) | null = null;
  let stopControlRequests: (() => Promise<void>) | null = null;
  let runHeartbeatStatus: RunHeartbeatStatus = 'running';
  const managedOutputArtifactPaths = new Set<string>();

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
          maxOutputSpoolBytes: options.maxOutputSpoolBytes,
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
          maxOutputSpoolBytes: options.maxOutputSpoolBytes,
        });
    if (!options.executeCommand) {
      for (const output of [result.stdout, result.stderr]) {
        if (output.artifactPath) {
          managedOutputArtifactPaths.add(output.artifactPath);
        }
      }
    }
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
    } catch (error) {
      if (
        isAgentGatewayLeaseLostError(error) ||
        getMonotonicTimeMs() >= getLocalRunLeaseDeadlineMonotonicMs(activeLease())
      ) {
        leaseLostController.abort();
      }
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
    let terminalEndDelivered = true;
    if (usesManagedTmux) {
      await closeTmuxTerminalQuietly(options, activeLease(), claimedLease.runId, result.exitCode);
      terminalEndDelivered = (await terminalStream?.end(toTerminalEndReason(result.status))) ?? false;
    }
    const sessionObservationWarnings = liveTimelineReporter?.getWarnings() || [];
    if (!terminalEndDelivered) {
      sessionObservationWarnings.push('Terminal stream final frame was not acknowledged before run finalization');
    }
    for (const [streamName, output] of [
      ['stdout', result.stdout],
      ['stderr', result.stderr],
    ] as const) {
      if (output.truncated) {
        sessionObservationWarnings.push(
          `${streamName} spool truncated after ${output.capturedBytes ?? output.sizeBytes} captured bytes`,
        );
      }
    }
    sessionObservationWarnings.push(
      ...(await reportProviderSessionAndCollectWarnings({
        gateway: options.gateway,
        getLease: activeLease,
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
        getLease: activeLease,
        payload,
        cwd: commandSpec.cwd,
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
    sessionObservationWarnings.push(...(await cleanupProjectSkills()));
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
    await cleanupProjectSkills();
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
    stopForwardingExecutionAbort();
    if (stopHeartbeat) {
      await stopHeartbeat();
    }
    if (stopControlRequests) {
      await stopControlRequests();
    }
    await cleanupProjectSkills(false);
    terminalStream?.close();
    for (const artifactPath of managedOutputArtifactPaths) {
      await fs.unlink(artifactPath).catch(() => {
        // The runner owns logs created by its default exec and tmux backends.
      });
    }
  }
}

export async function runDaemonOnce(options: RunDaemonOnceOptions): Promise<DaemonRunOnceResult> {
  const profiles = options.detectProfiles
    ? await options.detectProfiles(options.stopSignal)
    : await detectAgentProfiles({ ...options.detectOptions, signal: options.stopSignal });
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
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    timer = setTimeout(finish, ms);
    if (signal?.aborted) {
      finish();
      return;
    }
    signal?.addEventListener('abort', finish, { once: true });
  });
}

export async function runDaemonLoop(options: DaemonRunLoopOptions) {
  const pollIntervalMs = options.pollIntervalMs || 10_000;
  const retryInitialDelayMs = options.retryInitialDelayMs || DEFAULT_LOOP_RETRY_INITIAL_DELAY_MS;
  const retryMaxDelayMs = options.retryMaxDelayMs || DEFAULT_LOOP_RETRY_MAX_DELAY_MS;
  const detectProfiles =
    options.detectProfiles ||
    createCachedProfileDetector({
      ...options.detectOptions,
      refreshIntervalMs: options.profileRefreshIntervalMs,
    });
  let failureCount = 0;
  while (!options.stopSignal?.aborted) {
    try {
      const result = await runDaemonOnce({
        ...options,
        detectProfiles,
      });
      failureCount = 0;
      if (result.status === 'idle') {
        await delay(pollIntervalMs, options.stopSignal);
      }
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
