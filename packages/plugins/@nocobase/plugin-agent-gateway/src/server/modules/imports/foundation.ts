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

import { AgentProviderKey } from '../../../shared/providerCapabilities';
import { EXTERNAL_IMPORT_SOURCE_TYPE } from '../../../shared/externalRunImport';
import { IMPORTING_RUN_STATUS } from '../../../shared/runState';
import {
  JsonRecord,
  ModelRecord,
  getCurrentUserId,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getVisibleRunFilter,
} from '../../actions/utils';
import { PreparedExternalObservationBatch as PreparedObservationBatch } from '../../services/externalImportLogs';
import { assertSourceRecordRelationWritable } from './businessLink';
import {
  assertMatchingBatchPayload,
  assertNoIncompleteImportBatch,
  createImportBatch,
  findImportBatch,
  startImportBatchAttempt,
} from './batchRepository';
import { ExternalIdentityDescriptor } from './identity';
import {
  PreparedImportFinalizationPlan,
  PreparedObservationPlan,
  getSourceRecordRelationPlan,
  getStoredImportFinalizationPlan,
  prepareImportFinalizationPlan,
} from './serialization';
import {
  assertImportedRunStatusTransition,
  getImportStatus,
  getNewImportingRunValues,
  getRunUpdateValues,
  isTerminalImportedRunStatus,
} from './runProjection';

const EXTERNAL_IDENTITY_COLLECTION = 'agExternalRunIdentities';

export interface PreparedImportFoundation {
  run: ModelRecord;
  batch: ModelRecord;
  observationPlan: PreparedObservationPlan;
  finalizationPlan: PreparedImportFinalizationPlan;
  deduped: boolean;
}

async function assertExistingImportedRunVisible(ctx: Context, runId: string, transaction: Transaction) {
  const visibleFilter = await getVisibleRunFilter(ctx, { id: runId }, 'get');
  const visibleRun = (await ctx.db.getRepository('agRuns').findOne({
    filter: visibleFilter,
    transaction,
  })) as ModelRecord | null;
  if (!visibleRun) {
    ctx.throw(404, 'Run not found');
  }
}

function assertIdentityMatchesDescriptor(
  ctx: Context,
  identity: ModelRecord,
  descriptor: ExternalIdentityDescriptor,
  provider: AgentProviderKey,
) {
  if (
    getModelString(identity, 'identityType') !== descriptor.identityType ||
    getModelString(identity, 'provider') !== provider ||
    (getModelString(identity, 'externalRunKey') || null) !== descriptor.externalRunKey ||
    (descriptor.explicitRunCode && getModelString(identity, 'runCode') !== descriptor.explicitRunCode)
  ) {
    ctx.throw(409, 'External run identity conflicts with the requested provider, externalRunKey, or runCode');
  }
}

function getRetryFoundation(
  ctx: Context,
  run: ModelRecord,
  batch: ModelRecord,
  observationPlan: PreparedObservationPlan,
  storedAttempt: Awaited<ReturnType<typeof startImportBatchAttempt>>,
): PreparedImportFoundation {
  return {
    run,
    batch,
    observationPlan: storedAttempt?.observationPlan || observationPlan,
    finalizationPlan: storedAttempt?.finalizationPlan || getStoredImportFinalizationPlan(ctx, batch),
    deduped: true,
  };
}

async function prepareExistingIdentityImport(
  ctx: Context,
  options: {
    values: JsonRecord;
    provider: AgentProviderKey;
    descriptor: ExternalIdentityDescriptor;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    batchKey: string;
    identity: ModelRecord;
    transaction: Transaction;
  },
) {
  assertIdentityMatchesDescriptor(ctx, options.identity, options.descriptor, options.provider);
  const runRepo = ctx.db.getRepository('agRuns');
  const runId = String(getModelValue(options.identity, 'runId'));
  let run = (await runRepo.findOne({
    filterByTk: runId,
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(409, 'External run identity points to a missing run');
  }
  if (
    getModelString(run, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE ||
    getModelString(run, 'runCode') !== getModelString(options.identity, 'runCode')
  ) {
    ctx.throw(409, 'External run identity conflicts with its Agent Gateway run');
  }
  await assertExistingImportedRunVisible(ctx, runId, options.transaction);

  const existingBatch = await findImportBatch(ctx, runId, options.batchKey, options.transaction);
  if (existingBatch) {
    assertMatchingBatchPayload(ctx, existingBatch, options.preparedBatch.payloadSha256);
    const storedAttempt = await startImportBatchAttempt(ctx, existingBatch, run, options.transaction);
    return getRetryFoundation(ctx, run, existingBatch, options.observationPlan, storedAttempt);
  }

  await assertNoIncompleteImportBatch(ctx, runId, options.transaction);
  const currentStatus = getModelString(run, 'status');
  if (currentStatus === IMPORTING_RUN_STATUS) {
    ctx.throw(409, 'Imported run has an incomplete batch; retry that batchKey before starting another import');
  }
  const status = getImportStatus(ctx, options.values, currentStatus);
  assertImportedRunStatusTransition(ctx, currentStatus, status);
  const finalRunValues = getRunUpdateValues(options.values, status, options.provider, new Date(), run);
  const sourceRecordRelation = getSourceRecordRelationPlan(options.values);
  if (sourceRecordRelation) {
    await assertSourceRecordRelationWritable(ctx, { ...sourceRecordRelation, transaction: options.transaction });
  }
  const shouldStageImport = currentStatus !== status && isTerminalImportedRunStatus(status);
  if (shouldStageImport) {
    await runRepo.update({
      filterByTk: runId,
      values: { status: IMPORTING_RUN_STATUS },
      transaction: options.transaction,
    });
    run = (await runRepo.findOne({
      filterByTk: runId,
      transaction: options.transaction,
      lock: options.transaction.LOCK.UPDATE,
    })) as ModelRecord;
  }
  const finalizationPlan = prepareImportFinalizationPlan({
    expectedRunStatus: shouldStageImport ? IMPORTING_RUN_STATUS : currentStatus,
    runUpdateValues: finalRunValues,
    sourceRecordRelation,
  });
  const batch = await createImportBatch(ctx, {
    identityId: getModelTargetKey(options.identity, 'id'),
    runId,
    batchKey: options.batchKey,
    payloadSha256: options.preparedBatch.payloadSha256,
    observationPlan: options.observationPlan,
    finalizationPlan,
    transaction: options.transaction,
  });
  return { run, batch, observationPlan: options.observationPlan, finalizationPlan, deduped: true };
}

async function prepareNewIdentityImport(
  ctx: Context,
  options: {
    values: JsonRecord;
    provider: AgentProviderKey;
    descriptor: ExternalIdentityDescriptor;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    batchKey: string;
    transaction: Transaction;
  },
) {
  const runRepo = ctx.db.getRepository('agRuns');
  const conflictingRun = (await runRepo.findOne({
    filter: { runCode: options.descriptor.runCode },
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (conflictingRun) {
    ctx.throw(409, 'runCode already belongs to another Agent Gateway run');
  }
  const status = getImportStatus(ctx, options.values);
  const finalRunValues = getRunUpdateValues(options.values, status, options.provider, new Date());
  const sourceRecordRelation = getSourceRecordRelationPlan(options.values);
  if (sourceRecordRelation) {
    await assertSourceRecordRelationWritable(ctx, { ...sourceRecordRelation, transaction: options.transaction });
  }
  const run = (await runRepo.create({
    values: {
      runCode: options.descriptor.runCode,
      ...getNewImportingRunValues(finalRunValues),
      requestedById: getCurrentUserId(ctx) || null,
    },
    transaction: options.transaction,
  })) as ModelRecord;
  const identity = (await ctx.db.getRepository(EXTERNAL_IDENTITY_COLLECTION).create({
    values: {
      id: randomUUID(),
      identityKey: options.descriptor.identityKey,
      identityType: options.descriptor.identityType,
      provider: options.provider,
      externalRunKey: options.descriptor.externalRunKey,
      runCode: options.descriptor.runCode,
      runId: getModelTargetKey(run, 'id'),
      createdById: getCurrentUserId(ctx) || null,
      metadataJson: getRecord(options.values.metadataJson),
    },
    transaction: options.transaction,
  })) as ModelRecord;
  const runId = String(getModelTargetKey(run, 'id'));
  const finalizationPlan = prepareImportFinalizationPlan({
    expectedRunStatus: IMPORTING_RUN_STATUS,
    runUpdateValues: finalRunValues,
    sourceRecordRelation,
  });
  const batch = await createImportBatch(ctx, {
    identityId: getModelTargetKey(identity, 'id'),
    runId,
    batchKey: options.batchKey,
    payloadSha256: options.preparedBatch.payloadSha256,
    observationPlan: options.observationPlan,
    finalizationPlan,
    transaction: options.transaction,
  });
  return { run, batch, observationPlan: options.observationPlan, finalizationPlan, deduped: false };
}

export async function prepareImportFoundationOnce(
  ctx: Context,
  options: {
    values: JsonRecord;
    provider: AgentProviderKey;
    descriptor: ExternalIdentityDescriptor;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    batchKey: string;
  },
): Promise<PreparedImportFoundation> {
  return await ctx.db.sequelize.transaction(async (transaction) => {
    const existingIdentity = (await ctx.db.getRepository(EXTERNAL_IDENTITY_COLLECTION).findOne({
      filter: { identityKey: options.descriptor.identityKey },
      transaction,
    })) as ModelRecord | null;
    return existingIdentity
      ? prepareExistingIdentityImport(ctx, { ...options, identity: existingIdentity, transaction })
      : prepareNewIdentityImport(ctx, { ...options, transaction });
  });
}

export async function prepareAppendFoundationOnce(
  ctx: Context,
  options: {
    runId: string;
    values: JsonRecord;
    provider: AgentProviderKey;
    preparedBatch: PreparedObservationBatch;
    observationPlan: PreparedObservationPlan;
    batchKey: string;
  },
): Promise<PreparedImportFoundation> {
  return await ctx.db.sequelize.transaction(async (transaction) => {
    const runRepo = ctx.db.getRepository('agRuns');
    let run = (await runRepo.findOne({
      filterByTk: options.runId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!run) {
      ctx.throw(404, 'Run not found');
    }
    if (getModelString(run, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE) {
      ctx.throw(409, 'Only imported external runs can receive external observations');
    }
    const identity = (await ctx.db.getRepository(EXTERNAL_IDENTITY_COLLECTION).findOne({
      filter: { runId: options.runId },
      transaction,
    })) as ModelRecord | null;
    if (!identity) {
      ctx.throw(409, 'Imported external run does not have an external identity');
    }
    if (getModelString(identity, 'provider') !== options.provider) {
      ctx.throw(409, 'provider must match the imported external run identity');
    }

    const existingBatch = await findImportBatch(ctx, options.runId, options.batchKey, transaction);
    if (existingBatch) {
      assertMatchingBatchPayload(ctx, existingBatch, options.preparedBatch.payloadSha256);
      const storedAttempt = await startImportBatchAttempt(ctx, existingBatch, run, transaction);
      return getRetryFoundation(ctx, run, existingBatch, options.observationPlan, storedAttempt);
    }

    await assertNoIncompleteImportBatch(ctx, options.runId, transaction);
    const currentStatus = getModelString(run, 'status');
    if (currentStatus === IMPORTING_RUN_STATUS) {
      ctx.throw(409, 'Imported run has an incomplete batch; retry that batchKey before appending another batch');
    }
    let finalRunValues: JsonRecord | null = null;
    let expectedRunStatus = currentStatus;
    if (getString(options.values.status)) {
      const status = getImportStatus(ctx, options.values, currentStatus);
      assertImportedRunStatusTransition(ctx, currentStatus, status);
      finalRunValues = getRunUpdateValues(options.values, status, options.provider, new Date(), run);
      if (currentStatus !== status && isTerminalImportedRunStatus(status)) {
        expectedRunStatus = IMPORTING_RUN_STATUS;
        await runRepo.update({ filterByTk: options.runId, values: { status: IMPORTING_RUN_STATUS }, transaction });
        run = (await runRepo.findOne({
          filterByTk: options.runId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        })) as ModelRecord;
      }
    }
    const finalizationPlan = prepareImportFinalizationPlan({
      expectedRunStatus,
      runUpdateValues: finalRunValues,
      sourceRecordRelation: null,
    });
    const batch = await createImportBatch(ctx, {
      identityId: getModelTargetKey(identity, 'id'),
      runId: options.runId,
      batchKey: options.batchKey,
      payloadSha256: options.preparedBatch.payloadSha256,
      observationPlan: options.observationPlan,
      finalizationPlan,
      transaction,
    });
    return { run, batch, observationPlan: options.observationPlan, finalizationPlan, deduped: false };
  });
}
