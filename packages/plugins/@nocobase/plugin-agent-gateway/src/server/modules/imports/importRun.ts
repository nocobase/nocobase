/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { EXTERNAL_IMPORT_SOURCE_TYPE } from '../../../shared/externalRunImport';
import { AGENT_GATEWAY_ACTIONS } from '../../security';
import {
  ModelRecord,
  assertRunVisible,
  getBodyValues,
  getModelString,
  getModelTargetKey,
  requireAgentGatewayPermission,
} from '../../actions/utils';
import { serializeRunForManagement } from '../../actions/runLifecycle';
import { prepareExternalObservationBatch as prepareObservationBatch } from '../../services/externalImportLogs';
import { processObservationBatch } from './appendBatch';
import { prepareAppendFoundationOnce, prepareImportFoundationOnce } from './foundation';
import { getBatchKey, getExternalIdentityDescriptor, retryImportFoundation } from './identity';
import { getObservationOperations } from './observationProjection';
import { getImportProvider } from './runProjection';
import { ObservationWriteResult, prepareObservationPlan } from './serialization';

interface ExternalImportResult {
  run: ModelRecord;
  deduped: boolean;
  observations: ObservationWriteResult;
  relationUpdated: boolean;
}

async function getCompletedRun(ctx: Context, runId: string) {
  const run = (await ctx.db.getRepository('agRuns').findOne({ filterByTk: runId })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, 'Run not found');
  }
  return run;
}

export async function importExternalRun(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.importExternalRuns,
    'Agent Gateway external run import permission required',
  );
  const values = getBodyValues(ctx);
  const provider = getImportProvider(ctx, values.provider);
  const batchKey = getBatchKey(ctx, values.batchKey, false);
  const descriptor = getExternalIdentityDescriptor(ctx, values, provider);
  const preparedBatch = prepareObservationBatch(ctx, values, provider, batchKey);
  const observationPlan = prepareObservationPlan(
    ctx,
    getObservationOperations({ values, preparedBatch, provider, batchKey, includeInitialConversation: true }),
  );
  const foundation = await retryImportFoundation(() =>
    prepareImportFoundationOnce(ctx, { values, provider, descriptor, preparedBatch, observationPlan, batchKey }),
  );
  const processedBatch = await processObservationBatch(ctx, {
    run: foundation.run,
    batch: foundation.batch,
    preparedBatch,
    observationPlan: foundation.observationPlan,
    finalizationPlan: foundation.finalizationPlan,
  });
  const completedRun = await getCompletedRun(ctx, String(getModelTargetKey(foundation.run, 'id')));
  const result: ExternalImportResult = {
    run: completedRun,
    deduped: foundation.deduped,
    relationUpdated: processedBatch.relationUpdated,
    observations: processedBatch.observations,
  };
  ctx.body = {
    runId: getModelTargetKey(result.run, 'id'),
    runCode: getModelString(result.run, 'runCode'),
    deduped: result.deduped,
    relationUpdated: result.relationUpdated,
    observations: result.observations,
    run: await serializeRunForManagement(ctx, result.run),
  };
}

export async function appendExternalRunObservations(ctx: Context, runId: string) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.importExternalRuns,
    'Agent Gateway external run import permission required',
  );
  const values = getBodyValues(ctx);
  const visibleRun = await assertRunVisible(ctx, runId, 'get');
  if (getModelString(visibleRun, 'sourceType') !== EXTERNAL_IMPORT_SOURCE_TYPE) {
    ctx.throw(409, 'Only imported external runs can receive external observations');
  }
  const batchKey = getBatchKey(ctx, values.batchKey, true);
  const provider = getImportProvider(ctx, values.provider);
  const preparedBatch = prepareObservationBatch(ctx, values, provider, batchKey);
  const observationPlan = prepareObservationPlan(
    ctx,
    getObservationOperations({ values, preparedBatch, provider, batchKey, includeInitialConversation: false }),
  );
  const foundation = await retryImportFoundation(() =>
    prepareAppendFoundationOnce(ctx, { runId, values, provider, preparedBatch, observationPlan, batchKey }),
  );
  const processedBatch = await processObservationBatch(ctx, {
    run: foundation.run,
    batch: foundation.batch,
    preparedBatch,
    observationPlan: foundation.observationPlan,
    finalizationPlan: foundation.finalizationPlan,
  });
  const completedRun = await getCompletedRun(ctx, runId);
  ctx.body = {
    runId,
    run: await serializeRunForManagement(ctx, completedRun),
    observations: processedBatch.observations,
  };
}
