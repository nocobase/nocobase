/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NormalizedAgentEvent } from '../adapters';
import { hashText } from '../runArtifacts';
import { COMMAND_CONTENT_JSON_LIMIT_CHARS } from '../../shared/conversationLimits';

const CONVERSATION_CONTENT_JSON_BUDGET_CHARS = COMMAND_CONTENT_JSON_LIMIT_CHARS - 4096;
const RAW_PROVIDER_PREVIEW_CHARS = 4000;

export type ConversationEventRecord = {
  source: string;
  sequence: number;
  eventType: string;
  providerEventId?: string;
  correlationId?: string;
  confidence?: number;
  contentText?: string;
  contentJson: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function tryParseRecord(value: string) {
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

function contentJsonFitsBudget(contentJson: Record<string, unknown>) {
  return getJsonStringLength(contentJson) <= CONVERSATION_CONTENT_JSON_BUDGET_CHARS;
}

function setContentJsonFieldIfFits(contentJson: Record<string, unknown>, key: string, value: unknown) {
  contentJson[key] = value;
  if (contentJsonFitsBudget(contentJson)) {
    return true;
  }
  delete contentJson[key];
  return false;
}

function setOptionalContentJsonFieldIfFits(contentJson: Record<string, unknown>, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  return setContentJsonFieldIfFits(contentJson, key, value);
}

function attachRawLineDetails(contentJson: Record<string, unknown>, rawLine: string) {
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

function attachRawProviderEventDetails(
  contentJson: Record<string, unknown>,
  rawProviderEvent: Record<string, unknown>,
) {
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

export function buildConversationEventRecord(
  source: string,
  sequence: number,
  event: NormalizedAgentEvent,
  rawLine?: string,
): ConversationEventRecord {
  const eventRawLine = event.rawLine || rawLine;
  const payloadJson = event.payloadJson || {};
  const rawPayloadProviderEvent = getRecord(payloadJson.rawProviderEvent);
  const rawPayloadLine = getString(payloadJson.rawLine);
  const contentJson: Record<string, unknown> = {
    ...payloadJson,
  };
  delete contentJson.rawLine;
  delete contentJson.rawProviderEvent;

  const rawProviderEvent =
    event.rawEvent && Object.keys(event.rawEvent).length
      ? event.rawEvent
      : Object.keys(rawPayloadProviderEvent).length
        ? rawPayloadProviderEvent
        : tryParseRecord(eventRawLine || rawPayloadLine);
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
