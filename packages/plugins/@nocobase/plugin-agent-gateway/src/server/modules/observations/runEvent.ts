/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';

import { redactEventPayload, redactObservabilityText } from '../../security';
import { JsonRecord, ModelRecord, getModelJson, getModelNumber, getRecord, getString } from '../../actions/utils';

const MAX_EVENT_MESSAGE_LENGTH = 4000;
const MAX_EVENT_PAYLOAD_CHARS = 16000;

export interface CreateRunEventOptions {
  runId: string;
  claimAttempt: number;
  source: string;
  sequence: unknown;
  level?: string;
  eventType: string;
  message?: unknown;
  contentJson?: unknown;
  emittedAt?: Date;
  enforceMonotonic?: boolean;
  transaction: Transaction;
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

export function getRequiredNonNegativeInteger(ctx: Context, value: unknown, name: string) {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  ) {
    ctx.throw(400, `${name} is required`);
  }
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    ctx.throw(400, `${name} is required`);
  }
  return numberValue;
}

function getEventMessage(ctx: Context, value: unknown) {
  const message = getString(value);
  if (message.length > MAX_EVENT_MESSAGE_LENGTH) {
    ctx.throw(413, 'Event message is too large; store large logs as artifacts');
  }
  return message ? redactObservabilityText(message) : null;
}

function getRedactedPayload(ctx: Context, payload: unknown) {
  const redactedPayload = redactEventPayload(payload);
  if ((JSON.stringify(redactedPayload) || '').length > MAX_EVENT_PAYLOAD_CHARS) {
    ctx.throw(413, 'Event payload is too large; store large logs as artifacts');
  }
  return redactedPayload;
}

export function serializeRunEvent(event: ModelRecord) {
  const { payloadJson, ...canonicalEvent } = getModelJson(event);
  return { ...canonicalEvent, contentJson: getRecord(payloadJson) };
}

export async function createRunEvent(ctx: Context, options: CreateRunEventOptions) {
  const source = getRequiredString(ctx, options.source, 'source');
  const sequence = getRequiredNonNegativeInteger(ctx, options.sequence, 'sequence');
  const eventRepo = ctx.db.getRepository('agRunEvents');
  const uniqueFilter = { runId: options.runId, claimAttempt: options.claimAttempt, source, sequence };
  const existingEvent = (await eventRepo.findOne({
    filter: uniqueFilter,
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (existingEvent) {
    return { ...serializeRunEvent(existingEvent), idempotent: true };
  }
  if (options.enforceMonotonic) {
    const latestEvent = (await eventRepo.findOne({
      filter: { runId: options.runId, claimAttempt: options.claimAttempt, source },
      sort: ['-sequence'],
      transaction: options.transaction,
      lock: options.transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (latestEvent && getModelNumber(latestEvent, 'sequence') >= sequence) {
      ctx.throw(409, 'Event sequence must be monotonic per source and claim attempt');
    }
  }
  const event = (await eventRepo.create({
    values: {
      id: randomUUID(),
      ...uniqueFilter,
      level: getString(options.level) || 'info',
      eventType: getRequiredString(ctx, options.eventType, 'eventType'),
      message: getEventMessage(ctx, options.message),
      payloadJson: getRedactedPayload(ctx, options.contentJson),
      emittedAt: options.emittedAt || new Date(),
    },
    transaction: options.transaction,
  })) as ModelRecord;
  return { ...serializeRunEvent(event), idempotent: false };
}
