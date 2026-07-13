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
import { StringDecoder } from 'string_decoder';

import { isAgentGatewayLeaseLostError, isAgentGatewayRetryableError } from '../apiClient';
import { getAgentAdapter, type AgentAdapter, type NormalizedAgentEvent } from '../adapters';
import { AgentGatewayDaemonNodeClient } from '../gateway';
import { ExecDriverResult, executePolicyCommand, getExecutionPolicy } from '../execDriver';
import { AgentProfileDetector, DetectAgentProfilesOptions } from '../profileDetection';
import {
  SkillVersionInstallRecord,
  SkillVersionSource,
  syncNodeSkillVersion,
  SyncNodeSkillVersionResult,
} from '../skillSync';
import {
  cleanupProjectSkillsForRun,
  cleanupStaleProjectSkills,
  createProjectSkillRunState,
  installProjectSkillsForRun,
  ProjectSkillCleanupResult,
  ProjectSkillRunState,
} from '../projectSkills';
import { ClaimedRunLease, ExecutionPolicyDefinition, ExecutionPolicySet, JsonRecord, RunLease } from '../types';
import { getLocalRunLeaseDeadlineMonotonicMs, getMonotonicTimeMs } from '../leaseDeadline';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../../shared/conversationLimits';
import { hasAgentCapabilitySignal, normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import {
  AgentCommandOutputMode,
  assertRemoteExecutionPayloadIsSafe,
  getExecutionCommandSpec,
  getPayload,
  getRequestedExecutionPolicyKey,
  getRequestedTerminalBackend,
} from '../executionCommand';
import { compactDeclaredArtifactSummary, hashText } from '../runArtifacts';
import { getManagedTmuxSessionName } from '../tmuxTerminal';
import type { DaemonTerminalStreamClientOptions } from '../terminalStreamClient';
import { delay } from '../supervisor/shutdown';
import {
  abortForRunCancel,
  forwardAbortSignal,
  heartbeatRunWithRetry,
  heartbeatWhileRunPhase,
  recoverTerminalConflict,
  refreshRunLeaseBeforeTerminal,
  throwIfSignalAborted,
  type RunHeartbeatStatus,
} from './leaseHeartbeat';
import type { TerminalStreamHandle } from './terminalBackend';
import { resolveExecutionServices, type ExecutionServiceOverrides } from './services';

export interface RunDaemonOnceOptions {
  gateway: AgentGatewayDaemonNodeClient;
  executionPolicies: ExecutionPolicySet;
  skillsRoot: string;
  artifactDir: string;
  terminalBackend?: 'exec' | 'tmux';
  detectOptions?: DetectAgentProfilesOptions;
  detectProfiles?: AgentProfileDetector;
  claimProfileKey?: string;
  claimRunId?: string;
  runHeartbeatIntervalMs?: number;
  syncSkillVersion?: typeof syncNodeSkillVersion;
  executeCommand?: typeof executePolicyCommand;
  maxOutputSpoolBytes?: number;
  terminalRingBufferMaxBytes?: number;
  terminalStreamClientFactory?: (options: DaemonTerminalStreamClientOptions) => TerminalStreamHandle;
  services?: ExecutionServiceOverrides;
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
const MAX_CONVERSATION_EVENT_BATCH_BYTES = 8 * 1024 * 1024;
const MAX_PROVIDER_NORMALIZATION_LINE_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS + 256 * 1024;
const LIVE_TIMELINE_SOURCE = 'terminal-live';
const LIVE_TIMELINE_FLUSH_INTERVAL_MS = 2000;
const LIVE_TIMELINE_MAX_CHARS_PER_EVENT = 4000;
const LIVE_TIMELINE_MAX_PENDING_EVENTS = 200;
const LIVE_TIMELINE_MAX_PENDING_BYTES = 2 * 1024 * 1024;
const LIVE_TIMELINE_MAX_FALLBACK_BYTES = 256 * 1024;
const LIVE_TIMELINE_MAX_LINE_BYTES = 256 * 1024;
const LIVE_TIMELINE_MAX_WARNINGS = 20;
const CONVERSATION_CONTENT_JSON_BUDGET_CHARS = COMMAND_CONTENT_JSON_LIMIT_CHARS - 4096;
const RAW_PROVIDER_PREVIEW_CHARS = 4000;
const SUMMARY_ARRAY_SAMPLE_LIMIT = 20;
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

interface LiveTimelineReporter {
  appendText(text: string): Promise<void>;
  flush(): Promise<void>;
  getWarnings(): string[];
}

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
  if (path.isAbsolute(cwd)) {
    throw new Error('cwd must be relative to the configured workspace root');
  }
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
  lease: ClaimedRunLease,
  syncResults: SyncNodeSkillVersionResult[],
  projectSkillState: ProjectSkillRunState | null,
): ClaimedRunLease {
  if (!syncResults.length && !projectSkillState) {
    return lease;
  }
  const run = lease.run;
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
        capabilitiesJson: capabilities,
        metadataJson: {
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

export async function executeClaimedRun(
  options: RunDaemonOnceOptions,
  claimedLease: ClaimedRunLease,
): Promise<DaemonRunOnceResult> {
  const services = resolveExecutionServices(options.services);
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
  const progressReporter = services.observations.createProgressReporter({
    gateway: options.gateway,
    getLease: activeLease,
  });
  let cwd = '';
  let executionPolicy: ExecutionPolicyDefinition | null = null;
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
    assertRemoteExecutionPayloadIsSafe(syncPayload);
    const executionPolicyKey = getRequestedExecutionPolicyKey(activeLease(), syncPayload);
    executionPolicy = getExecutionPolicy(options.executionPolicies, executionPolicyKey);
    cwd = await resolveWorkspaceCwd(executionPolicy.workspaceRoot, getString(syncPayload.cwd) || '.');
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
        const provider = executionPolicy.provider;
        const adapter = getAgentAdapter(provider);
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
  const terminalBackend = getRequestedTerminalBackend(options.terminalBackend);
  const tmuxSessionName = getManagedTmuxSessionName(claimedLease.runId);
  const usesManagedTmux = terminalBackend === 'tmux' && !options.executeCommand;
  if (!executionPolicy) {
    throw new Error('Execution policy was not resolved before command execution');
  }
  const requestedAdapter = getAgentAdapter(executionPolicy.provider);
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
    const commandSpec = getExecutionCommandSpec(activeLease(), executionPolicy, cwd, commandOutputMode);
    await progressReporter.append({
      phase: 'agent.process',
      status: 'started',
      message: 'Agent process started',
      payloadJson: {
        executionPolicyKey: commandSpec.executionPolicyKey,
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
      terminalStream = services.terminal.createStream({
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
        stopControlRequests = services.controlRequests.start({
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
      ? await services.terminal.executeTmux({
          runId: claimedLease.runId,
          policy: executionPolicy,
          args: commandSpec.args,
          cwd: commandSpec.cwd,
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
      : await (options.executeCommand || executePolicyCommand)({
          executionPolicyKey: commandSpec.executionPolicyKey,
          executionPolicies: options.executionPolicies,
          args: commandSpec.args,
          cwd: commandSpec.cwd,
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
        await services.terminal.close(options, activeLease(), claimedLease.runId, result.exitCode);
        await terminalStream?.end('disconnected');
      }
      return {
        status: 'lease_lost',
        runId: claimedLease.runId,
      };
    }
    let terminalEndDelivered = true;
    if (usesManagedTmux) {
      await services.terminal.close(options, activeLease(), claimedLease.runId, result.exitCode);
      terminalEndDelivered = (await terminalStream?.end(services.terminal.toEndReason(result.status))) ?? false;
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
      declaredArtifactSummary = await services.observations
        .createArtifactCollector({
          gateway: options.gateway,
          getLease: activeLease,
        })
        .collect({
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
    const status = await services.observations.complete({
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
      await services.terminal.close(options, activeLease(), claimedLease.runId, null);
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

export async function claimAndExecuteOnce(
  options: RunDaemonOnceOptions,
  onActiveRunChange?: (active: boolean) => void,
): Promise<DaemonRunOnceResult> {
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
  onActiveRunChange?.(true);
  try {
    return await executeClaimedRun(options, {
      ...claim,
      claimed: true,
      run: (claim.run || {}) as ClaimedRunLease['run'],
      executionPolicyKey: claim.executionPolicyKey || '',
    });
  } finally {
    onActiveRunChange?.(false);
  }
}
