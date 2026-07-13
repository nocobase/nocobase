/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AgentGatewayDaemonNodeClient } from '../gateway';
import { hashText } from '../runArtifacts';
import type { JsonRecord, RunLease } from '../types';

const DAEMON_PROGRESS_SOURCE = 'agent-gateway-daemon';
const HARNESS_PROGRESS_SOURCE = 'harness';
const PROGRESS_MARKER_PREFIX = 'AGW_PROGRESS';
const PROGRESS_EVENT_PAYLOAD_BUDGET_CHARS = 14 * 1024;
const PROGRESS_EVENT_PAYLOAD_PREVIEW_CHARS = 2000;
const HARNESS_PROGRESS_MAX_LINE_BYTES = 256 * 1024;
const PROGRESS_MAX_WARNINGS = 20;

export type RunProgressLevel = 'info' | 'warning' | 'error';

export interface RunProgressAppendOptions {
  source?: string;
  phase: string;
  status: string;
  level?: RunProgressLevel;
  message?: string;
  payloadJson?: JsonRecord;
}

export interface RunProgressReporter {
  append(options: RunProgressAppendOptions): Promise<void>;
  appendHarnessMarkers(text: string): Promise<void>;
  getWarnings(): string[];
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getJsonText(value: unknown) {
  try {
    return JSON.stringify(value) || '';
  } catch {
    return String(value);
  }
}

function getJsonStringLength(value: unknown) {
  try {
    return JSON.stringify(value)?.length || 0;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
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

export function createRunProgressReporter(options: {
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
        contentJson: compactProgressPayloadJson({
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
