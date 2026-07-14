/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createReadStream } from 'fs';
import { promises as fs } from 'fs';
import { StringDecoder } from 'string_decoder';

import { getAgentAdapter } from '../adapters';
import type { ExecDriverResult } from '../execDriver';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import type { RunLease } from '../types';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../../shared/conversationLimits';
import { hasAgentCapabilitySignal, normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { delay } from '../supervisor/shutdown';
import { buildConversationEventRecord, type ConversationEventRecord } from './providerEventRecords';

const MAX_PROVIDER_SESSION_SCAN_BYTES = 256 * 1024;
const PROVIDER_SESSION_UPSERT_MAX_ATTEMPTS = 3;
const PROVIDER_SESSION_UPSERT_RETRY_DELAY_MS = 250;
const MAX_CONVERSATION_EVENTS_PER_APPEND = 100;
const MAX_CONVERSATION_EVENT_BATCH_BYTES = 8 * 1024 * 1024;
const MAX_PROVIDER_NORMALIZATION_LINE_BYTES = COMMAND_CONTENT_JSON_LIMIT_CHARS + 256 * 1024;

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
  const events: ConversationEventRecord[] = [];
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
        capabilitiesJson: { ...capabilities },
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

export async function reportProviderSessionAndCollectWarnings(options: {
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
