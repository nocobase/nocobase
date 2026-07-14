/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { StringDecoder } from 'string_decoder';

import { getAgentAdapter, type AgentAdapter } from '../adapters';
import type { AgentGatewayDaemonNodeClient } from '../gateway';
import type { RunLease } from '../types';
import { buildConversationEventRecord, type ConversationEventRecord } from './providerEventRecords';

const MAX_CONVERSATION_EVENTS_PER_APPEND = 100;
const MAX_CONVERSATION_EVENT_BATCH_BYTES = 8 * 1024 * 1024;
const LIVE_TIMELINE_SOURCE = 'terminal-live';
const LIVE_TIMELINE_FLUSH_INTERVAL_MS = 2000;
const LIVE_TIMELINE_MAX_CHARS_PER_EVENT = 4000;
const LIVE_TIMELINE_MAX_PENDING_EVENTS = 200;
const LIVE_TIMELINE_MAX_PENDING_BYTES = 2 * 1024 * 1024;
const LIVE_TIMELINE_MAX_FALLBACK_BYTES = 256 * 1024;
const LIVE_TIMELINE_MAX_LINE_BYTES = 256 * 1024;
const LIVE_TIMELINE_MAX_WARNINGS = 20;

export interface LiveTimelineReporter {
  appendText(text: string): Promise<void>;
  flush(): Promise<void>;
  getWarnings(): string[];
}

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

export function createLiveTimelineReporter(options: {
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
  const pendingStructuredEvents: ConversationEventRecord[] = [];
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

  const getRecordBytes = (record: ConversationEventRecord) => Buffer.byteLength(JSON.stringify(record));

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

  const queueStructuredEvent = (record: ConversationEventRecord) => {
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

  const flushQueuedEvents = async (events: ConversationEventRecord[]) => {
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
    const fallbackEvents: ConversationEventRecord[] = [];
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
