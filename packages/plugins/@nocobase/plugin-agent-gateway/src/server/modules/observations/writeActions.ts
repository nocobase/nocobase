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

import { authenticateNodeToken, redactSnapshotJson } from '../../security';
import { JsonRecord, ModelRecord, getBodyValues, getDate, getRecord, getString } from '../../actions/utils';
import { validateRunLease } from '../../actions/runLifecycle';
import { createRunArtifact } from './registerArtifact';
import { createRunEvent } from './runEvent';

const MAX_METADATA_JSON_CHARS = 16 * 1024;
const MAX_SNAPSHOT_JSON_CHARS = 64 * 1024;
const SUPPORTED_SNAPSHOT_TYPES = new Set(['node', 'agent', 'skill', 'nocobase', 'workspace', 'custom']);
const OBSERVABILITY_WRITE_RUN_STATUSES = ['claimed', 'syncing_skills', 'running', 'finalizing', 'stalled'] as const;

async function getCurrentNodeId(ctx: Context) {
  const auth = await authenticateNodeToken(ctx);
  return String(auth.subject.nodeId);
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

function getBoundedRedactedJson(ctx: Context, value: unknown, name: string, maxChars: number) {
  if ((JSON.stringify(value) || '').length > maxChars) {
    ctx.throw(413, `${name} is too large`);
  }
  const redactedValue = redactSnapshotJson(value);
  if ((JSON.stringify(redactedValue) || '').length > maxChars) {
    ctx.throw(413, `${name} is too large`);
  }
  return redactedValue;
}

async function withValidatedLease<T>(
  ctx: Context,
  runId: string,
  operation: (options: { values: JsonRecord; claimAttempt: number; transaction: Transaction }) => Promise<T>,
) {
  const nodeId = await getCurrentNodeId(ctx);
  const values = getBodyValues(ctx);
  return await ctx.db.sequelize.transaction(async (transaction) => {
    const lease = await validateRunLease(ctx, nodeId, runId, values, transaction, {
      allowExpiredLeaseStatuses: ['finalizing', 'stalled'],
      allowStaleLeaseVersion: true,
      allowedStatuses: OBSERVABILITY_WRITE_RUN_STATUSES,
    });
    return lease ? operation({ values, claimAttempt: lease.claimAttempt, transaction }) : null;
  });
}

export async function appendEvent(ctx: Context, runId: string) {
  const result = await withValidatedLease(ctx, runId, ({ values, claimAttempt, transaction }) =>
    createRunEvent(ctx, {
      runId,
      claimAttempt,
      source: getString(values.source),
      sequence: values.sequence,
      level: getString(values.level) || 'info',
      eventType: getString(values.eventType),
      message: values.message,
      contentJson: values.contentJson,
      emittedAt: getDate(values.emittedAt) || new Date(),
      enforceMonotonic: true,
      transaction,
    }),
  );
  if (result) {
    ctx.body = result;
  }
}

export async function registerArtifact(ctx: Context, runId: string) {
  const result = await withValidatedLease(ctx, runId, ({ values, claimAttempt, transaction }) =>
    createRunArtifact(ctx, { runId, claimAttempt, values, transaction }),
  );
  if (result) {
    ctx.body = result;
  }
}

export async function registerSnapshot(ctx: Context, runId: string) {
  const result = await withValidatedLease(ctx, runId, async ({ values, claimAttempt, transaction }) => {
    const snapshotType = getRequiredString(ctx, values.snapshotType, 'snapshotType');
    if (!SUPPORTED_SNAPSHOT_TYPES.has(snapshotType)) {
      ctx.throw(400, 'Unsupported snapshot type');
    }
    const snapshot = (await ctx.db.getRepository('agRunSnapshots').create({
      values: {
        id: randomUUID(),
        runId,
        claimAttempt,
        snapshotType,
        snapshotJson: getBoundedRedactedJson(ctx, values.snapshotJson, 'Snapshot JSON', MAX_SNAPSHOT_JSON_CHARS),
        metadataJson: getBoundedRedactedJson(ctx, values.metadataJson, 'Snapshot metadata', MAX_METADATA_JSON_CHARS),
        capturedAt: getDate(values.capturedAt) || new Date(),
      },
      transaction,
    })) as ModelRecord;
    return getRecord(snapshot.toJSON());
  });
  if (result) {
    ctx.body = result;
  }
}
