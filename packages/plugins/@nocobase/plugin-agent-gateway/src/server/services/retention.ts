/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import {
  EXTERNAL_IMPORT_ABANDONED_ERROR_SUMMARY,
  EXTERNAL_IMPORT_BATCH_RECOVERY_TIMEOUT_MS,
  EXTERNAL_IMPORT_INTERRUPTED_ERROR_SUMMARY,
} from '../../shared/externalRunImport';
import { IMPORTING_RUN_STATUS, TERMINAL_RUN_STATUSES } from '../../shared/runState';
import { JsonRecord, ModelRecord, getModelString, getModelTargetKey, getModelValue } from '../actions/utils';
import { AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS } from '../constants';
import {
  OBSERVABILITY_ROLLUP_EVENT_FILTER,
  RunObservabilityRollup,
  buildRunObservabilityRollup,
  getRunObservabilityRollup,
  mergeRunObservabilityRollup,
} from './observationRollup';

const DAY_MS = 24 * 60 * 60 * 1000;
export const AGENT_GATEWAY_RETENTION_BATCH_SIZE = 1000;
export const AGENT_GATEWAY_RETENTION_MAX_BATCHES_PER_COLLECTION = 10;
export const AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE = 100;

interface RetentionTarget {
  collectionName: string;
  dateField: string;
  retentionDays: number;
  filter: JsonRecord;
}

const TERMINAL_RUN_FILTER: JsonRecord = {
  'run.status': {
    $in: [...TERMINAL_RUN_STATUSES],
  },
};

const TERMINAL_OR_RUNLESS_FILTER: JsonRecord = {
  $or: [
    {
      runId: null,
    },
    TERMINAL_RUN_FILTER,
  ],
};

const RETENTION_TARGETS: RetentionTarget[] = [
  {
    collectionName: 'agRunEvents',
    dateField: 'createdAt',
    retentionDays: AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS.events,
    filter: TERMINAL_RUN_FILTER,
  },
  {
    collectionName: 'agAgentConversationEvents',
    dateField: 'createdAt',
    retentionDays: AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS.events,
    filter: TERMINAL_RUN_FILTER,
  },
  {
    collectionName: 'agApiCallLogs',
    dateField: 'createdAt',
    retentionDays: AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS.apiCallLogs,
    filter: TERMINAL_OR_RUNLESS_FILTER,
  },
  {
    collectionName: 'agRunArtifacts',
    dateField: 'createdAt',
    retentionDays: AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS.artifacts,
    filter: TERMINAL_RUN_FILTER,
  },
  {
    collectionName: 'agRunSnapshots',
    dateField: 'capturedAt',
    retentionDays: AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS.snapshots,
    filter: TERMINAL_RUN_FILTER,
  },
  {
    collectionName: 'agExternalImportBatches',
    dateField: 'updatedAt',
    retentionDays: AGENT_GATEWAY_RETENTION_DEFAULTS_DAYS.externalImportBatches,
    filter: {
      $and: [
        TERMINAL_RUN_FILTER,
        {
          status: {
            $in: ['completed', 'failed'],
          },
        },
      ],
    },
  },
];

export interface AgentGatewayRetentionResult {
  deletedByCollection: Record<string, number>;
  hasMoreByCollection: Record<string, boolean>;
  deletedTotal: number;
  recoveredImportBatches: number;
  abandonedImportRuns: number;
  hasMore: boolean;
  cleanedAt: string;
}

function getDateValue(value: unknown) {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getPositiveInteger(value: number | undefined, fallback: number, name: string) {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return result;
}

function mergeFilters(...filters: JsonRecord[]) {
  return filters.length === 1
    ? filters[0]
    : {
        $and: filters,
      };
}

async function recoverInterruptedImportBatches(
  plugin: Pick<Plugin, 'db'>,
  options: {
    now: Date;
    batchSize: number;
    maxBatches: number;
  },
) {
  const collectionName = 'agExternalImportBatches';
  if (!plugin.db.hasCollection(collectionName) || !(await plugin.db.collectionExistsInDb(collectionName))) {
    return {
      recovered: 0,
      abandonedRuns: 0,
      hasMore: false,
    };
  }

  const repository = plugin.db.getRepository(collectionName);
  const cutoff = new Date(options.now.getTime() - EXTERNAL_IMPORT_BATCH_RECOVERY_TIMEOUT_MS);
  let recovered = 0;
  let abandonedRuns = 0;
  let hasMore = false;
  for (let batchIndex = 0; batchIndex < options.maxBatches; batchIndex += 1) {
    const result = await plugin.db.sequelize.transaction(async (transaction) => {
      const candidates = (await repository.find({
        filter: {
          $and: [
            {
              lastAttemptAt: {
                $lt: cutoff,
              },
            },
            {
              $or: [
                {
                  status: 'processing',
                },
                {
                  status: 'failed',
                  'run.status': IMPORTING_RUN_STATUS,
                },
              ],
            },
          ],
        },
        fields: ['id', 'runId'],
        sort: ['lastAttemptAt', 'id'],
        limit: options.batchSize,
        transaction,
      })) as ModelRecord[];
      const batchIds = candidates.map((record) => getModelTargetKey(record, 'id')).filter(Boolean);
      if (!batchIds.length) {
        return {
          scanned: 0,
          recovered: 0,
          abandonedRuns: 0,
        };
      }
      const runIds = [
        ...new Set(
          candidates
            .map((record) => getModelTargetKey(record, 'runId'))
            .filter((runId): runId is string | number => runId !== undefined && runId !== null)
            .map(String),
        ),
      ];
      const runs = runIds.length
        ? ((await plugin.db.getRepository('agRuns').find({
            filter: {
              id: {
                $in: runIds,
              },
            },
            sort: ['id'],
            transaction,
            lock: transaction.LOCK.UPDATE,
          })) as ModelRecord[])
        : [];
      const runsById = new Map(runs.map((run) => [String(getModelTargetKey(run, 'id')), run]));
      const batches = (await repository.find({
        filter: {
          id: {
            $in: batchIds,
          },
        },
        sort: ['id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord[];
      const staleBatches = batches.filter((batch) => {
        const lastAttemptAt = getDateValue(getModelValue(batch, 'lastAttemptAt'));
        const status = getModelString(batch, 'status');
        const run = runsById.get(String(getModelTargetKey(batch, 'runId')));
        return (
          Boolean(lastAttemptAt && lastAttemptAt.getTime() < cutoff.getTime()) &&
          (status === 'processing' ||
            (status === 'failed' && Boolean(run && getModelString(run, 'status') === IMPORTING_RUN_STATUS)))
        );
      });
      const processingBatchIds = staleBatches
        .filter((batch) => getModelString(batch, 'status') === 'processing')
        .map((batch) => getModelTargetKey(batch, 'id'))
        .filter(Boolean);
      if (processingBatchIds.length) {
        await repository.update({
          filter: {
            id: {
              $in: processingBatchIds,
            },
          },
          values: {
            status: 'failed',
            errorSummary: EXTERNAL_IMPORT_INTERRUPTED_ERROR_SUMMARY,
            completedAt: null,
            lastAttemptAt: options.now,
          },
          transaction,
        });
      }
      const importingRunIds = [
        ...new Set(
          staleBatches
            .map((batch) => String(getModelTargetKey(batch, 'runId')))
            .filter((runId) => {
              const run = runsById.get(runId);
              return Boolean(run && getModelString(run, 'status') === IMPORTING_RUN_STATUS);
            }),
        ),
      ];
      if (importingRunIds.length) {
        await repository.update({
          filter: {
            runId: {
              $in: importingRunIds,
            },
            status: {
              $in: ['processing', 'failed'],
            },
          },
          values: {
            status: 'failed',
            errorSummary: EXTERNAL_IMPORT_INTERRUPTED_ERROR_SUMMARY,
            completedAt: null,
            lastAttemptAt: options.now,
          },
          transaction,
        });
        await plugin.db.getRepository('agRuns').update({
          filter: {
            id: {
              $in: importingRunIds,
            },
            status: IMPORTING_RUN_STATUS,
          },
          values: {
            status: 'abandoned',
            failedAt: options.now,
            finishedAt: options.now,
            errorSummary: EXTERNAL_IMPORT_ABANDONED_ERROR_SUMMARY,
          },
          transaction,
        });
        await materializeConversationRollups(plugin, importingRunIds, options.now, transaction);
      }
      return {
        scanned: batchIds.length,
        recovered: processingBatchIds.length,
        abandonedRuns: importingRunIds.length,
      };
    });
    if (!result.scanned) {
      break;
    }
    recovered += result.recovered;
    abandonedRuns += result.abandonedRuns;
    if (result.scanned < options.batchSize) {
      break;
    }
    if (batchIndex === options.maxBatches - 1) {
      hasMore = true;
    }
  }
  return {
    recovered,
    abandonedRuns,
    hasMore,
  };
}

async function abandonOrphanedImportingRuns(
  plugin: Pick<Plugin, 'db'>,
  options: {
    now: Date;
    batchSize: number;
    maxBatches: number;
  },
) {
  if (
    !plugin.db.hasCollection('agRuns') ||
    !plugin.db.hasCollection('agExternalImportBatches') ||
    !(await plugin.db.collectionExistsInDb('agRuns')) ||
    !(await plugin.db.collectionExistsInDb('agExternalImportBatches'))
  ) {
    return {
      abandoned: 0,
      hasMore: false,
    };
  }
  const cutoff = new Date(options.now.getTime() - EXTERNAL_IMPORT_BATCH_RECOVERY_TIMEOUT_MS);
  const runRepository = plugin.db.getRepository('agRuns');
  const batchRepository = plugin.db.getRepository('agExternalImportBatches');
  let abandoned = 0;
  let hasMore = false;
  let afterId = '';
  for (let batchIndex = 0; batchIndex < options.maxBatches; batchIndex += 1) {
    const candidates = (await runRepository.find({
      filter: {
        status: IMPORTING_RUN_STATUS,
        updatedAt: {
          $lt: cutoff,
        },
        ...(afterId
          ? {
              id: {
                $gt: afterId,
              },
            }
          : {}),
      },
      fields: ['id'],
      sort: ['id'],
      limit: options.batchSize + 1,
    })) as ModelRecord[];
    const candidatePage = candidates.slice(0, options.batchSize);
    const hasNextCandidate = candidates.length > options.batchSize;
    const runIds = candidatePage.map((run) => String(getModelTargetKey(run, 'id'))).filter(Boolean);
    if (!runIds.length) {
      break;
    }
    afterId = runIds[runIds.length - 1];
    const abandonedInBatch = await plugin.db.sequelize.transaction(async (transaction) => {
      const runs = (await runRepository.find({
        filter: {
          id: {
            $in: runIds,
          },
          status: IMPORTING_RUN_STATUS,
        },
        sort: ['id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord[];
      if (!runs.length) {
        return 0;
      }
      const lockedRunIds = runs.map((run) => String(getModelTargetKey(run, 'id')));
      const incompleteBatches = (await batchRepository.find({
        filter: {
          runId: {
            $in: lockedRunIds,
          },
          status: {
            $in: ['processing', 'failed'],
          },
        },
        sort: ['runId', '-lastAttemptAt'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord[];
      const recentRunIds = new Set(
        incompleteBatches
          .filter((batch) => {
            const lastAttemptAt = getDateValue(getModelValue(batch, 'lastAttemptAt'));
            return Boolean(lastAttemptAt && lastAttemptAt.getTime() >= cutoff.getTime());
          })
          .map((batch) => String(getModelTargetKey(batch, 'runId'))),
      );
      if (recentRunIds.size) {
        const runModel = plugin.db.getCollection('agRuns').model;
        const updatedAtField = runModel.rawAttributes.updatedAt.field || 'updatedAt';
        const idField = runModel.rawAttributes.id.field || 'id';
        await plugin.db.sequelize.getQueryInterface().bulkUpdate(
          runModel.getTableName(),
          {
            [updatedAtField]: options.now,
          },
          {
            [idField]: [...recentRunIds],
          },
          {
            transaction,
          },
        );
      }
      const abandonedRunIds = lockedRunIds.filter((runId) => !recentRunIds.has(runId));
      if (!abandonedRunIds.length) {
        return 0;
      }
      await batchRepository.update({
        filter: {
          runId: {
            $in: abandonedRunIds,
          },
          status: 'processing',
        },
        values: {
          status: 'failed',
          errorSummary: EXTERNAL_IMPORT_INTERRUPTED_ERROR_SUMMARY,
          completedAt: null,
          lastAttemptAt: options.now,
        },
        transaction,
      });
      await runRepository.update({
        filter: {
          id: {
            $in: abandonedRunIds,
          },
          status: IMPORTING_RUN_STATUS,
        },
        values: {
          status: 'abandoned',
          failedAt: options.now,
          finishedAt: options.now,
          errorSummary: EXTERNAL_IMPORT_ABANDONED_ERROR_SUMMARY,
        },
        transaction,
      });
      await materializeConversationRollups(plugin, abandonedRunIds, options.now, transaction);
      return abandonedRunIds.length;
    });
    abandoned += abandonedInBatch;
    if (!hasNextCandidate) {
      break;
    }
    if (batchIndex === options.maxBatches - 1) {
      hasMore = true;
    }
  }
  return {
    abandoned,
    hasMore,
  };
}

async function cleanRetentionTarget(
  plugin: Pick<Plugin, 'db'>,
  target: RetentionTarget,
  options: {
    now: Date;
    batchSize: number;
    maxBatches: number;
  },
) {
  if (!plugin.db.hasCollection(target.collectionName)) {
    return null;
  }
  if (!(await plugin.db.collectionExistsInDb(target.collectionName))) {
    return null;
  }

  const cutoff = new Date(options.now.getTime() - target.retentionDays * DAY_MS);
  const repository = plugin.db.getRepository(target.collectionName);
  let deleted = 0;
  let hasMore = false;
  for (let batchIndex = 0; batchIndex < options.maxBatches; batchIndex += 1) {
    const ids = await plugin.db.sequelize.transaction(async (transaction) => {
      const candidates = (await repository.find({
        filter: mergeFilters(
          {
            [target.dateField]: {
              $lt: cutoff,
            },
          },
          target.filter,
        ),
        fields: ['id'],
        sort: [target.dateField, 'id'],
        limit: options.batchSize,
        transaction,
      })) as ModelRecord[];
      const candidateIds = candidates.map((record) => getModelTargetKey(record, 'id')).filter(Boolean);
      if (!candidateIds.length) {
        return candidateIds;
      }

      // Relation filters add an outer join on PostgreSQL, which cannot be locked with FOR UPDATE.
      // Lock only the target rows after resolving the candidate IDs.
      const records = (await repository.find({
        filterByTk: candidateIds,
        fields: ['id', 'runId'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      })) as ModelRecord[];
      const batchIds = records.map((record) => getModelTargetKey(record, 'id')).filter(Boolean);
      if (!batchIds.length) {
        return batchIds;
      }
      if (target.collectionName === 'agAgentConversationEvents') {
        const runIds = [
          ...new Set(
            records
              .map((record) => getModelTargetKey(record, 'runId'))
              .filter((runId): runId is string | number => runId !== undefined && runId !== null)
              .map(String),
          ),
        ];
        await materializeConversationRollups(plugin, runIds, options.now, transaction);
      }
      await repository.destroy({
        filterByTk: batchIds,
        transaction,
      });
      return batchIds;
    });
    if (!ids.length) {
      break;
    }
    deleted += ids.length;
    if (ids.length < options.batchSize) {
      break;
    }
    if (batchIndex === options.maxBatches - 1) {
      hasMore = true;
    }
  }
  return {
    deleted,
    hasMore,
  };
}

async function materializeConversationRollups(
  plugin: Pick<Plugin, 'db'>,
  runIds: string[],
  now: Date,
  transaction: Transaction,
) {
  const runRepository = plugin.db.getRepository('agRuns');
  const eventRepository = plugin.db.getRepository('agAgentConversationEvents');
  const uniqueRunIds = [...new Set(runIds)];
  if (!uniqueRunIds.length) {
    return;
  }
  const runs = (await runRepository.find({
    filter: {
      id: {
        $in: uniqueRunIds,
      },
    },
    sort: ['id'],
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord[];
  for (const run of runs) {
    const existingRollup = getRunObservabilityRollup(run);
    if (existingRollup) {
      const hasRunningToolCalls = existingRollup.toolLifecycleJson?.calls.some((call) => call.status === 'running');
      if (!hasRunningToolCalls) {
        continue;
      }
      const finalizedRollup = mergeRunObservabilityRollup(run, [], now);
      if (finalizedRollup) {
        await runRepository.update({
          filterByTk: getModelTargetKey(run, 'id'),
          values: {
            observabilityRollupJson: finalizedRollup,
          },
          transaction,
        });
      }
      continue;
    }
    const runId = String(getModelTargetKey(run, 'id'));
    let offset = 0;
    let observabilityRollupJson: RunObservabilityRollup | null = null;
    let hasMoreEvents = true;
    while (hasMoreEvents) {
      const events = (await eventRepository.find({
        filter: mergeFilters(
          {
            runId,
          },
          OBSERVABILITY_ROLLUP_EVENT_FILTER,
        ),
        fields: [
          'id',
          'runId',
          'source',
          'sequence',
          'eventType',
          'providerEventId',
          'correlationId',
          'contentText',
          'contentJson',
          'createdAt',
        ],
        sort: ['createdAt', 'sequence', 'id'],
        limit: AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE,
        offset,
        transaction,
      })) as ModelRecord[];
      if (!events.length) {
        observabilityRollupJson ||= buildRunObservabilityRollup(run, [], now);
        break;
      }
      if (!observabilityRollupJson) {
        observabilityRollupJson = buildRunObservabilityRollup(run, events, now);
      } else {
        const rollupRun: ModelRecord = {
          get(key) {
            return key === 'observabilityRollupJson' ? observabilityRollupJson : run.get(key);
          },
        };
        const mergedRollup = mergeRunObservabilityRollup(rollupRun, events, now);
        if (!mergedRollup) {
          throw new Error(`Failed to merge Agent Gateway observability rollup for run ${runId}`);
        }
        observabilityRollupJson = mergedRollup;
      }
      offset += events.length;
      hasMoreEvents = events.length === AGENT_GATEWAY_ROLLUP_EVENT_PAGE_SIZE;
    }
    if (!observabilityRollupJson) {
      continue;
    }
    await runRepository.update({
      filterByTk: runId,
      values: {
        observabilityRollupJson,
      },
      transaction,
    });
  }
}

export async function cleanupAgentGatewayRetention(
  plugin: Pick<Plugin, 'db'>,
  options: { now?: Date; batchSize?: number; maxBatchesPerCollection?: number } = {},
): Promise<AgentGatewayRetentionResult> {
  const now = options.now || new Date();
  const batchSize = getPositiveInteger(options.batchSize, AGENT_GATEWAY_RETENTION_BATCH_SIZE, 'batchSize');
  const maxBatches = getPositiveInteger(
    options.maxBatchesPerCollection,
    AGENT_GATEWAY_RETENTION_MAX_BATCHES_PER_COLLECTION,
    'maxBatchesPerCollection',
  );
  const deletedByCollection: Record<string, number> = {};
  const hasMoreByCollection: Record<string, boolean> = {};
  const recovery = await recoverInterruptedImportBatches(plugin, {
    now,
    batchSize,
    maxBatches,
  });
  const orphanRecovery = await abandonOrphanedImportingRuns(plugin, {
    now,
    batchSize,
    maxBatches,
  });

  for (const target of RETENTION_TARGETS) {
    const deleted = await cleanRetentionTarget(plugin, target, {
      now,
      batchSize,
      maxBatches,
    });
    if (deleted !== null) {
      deletedByCollection[target.collectionName] = deleted.deleted;
      hasMoreByCollection[target.collectionName] = deleted.hasMore;
    }
  }

  return {
    deletedByCollection,
    hasMoreByCollection,
    deletedTotal: Object.values(deletedByCollection).reduce((total, count) => total + count, 0),
    recoveredImportBatches: recovery.recovered,
    abandonedImportRuns: recovery.abandonedRuns + orphanRecovery.abandoned,
    hasMore: recovery.hasMore || orphanRecovery.hasMore || Object.values(hasMoreByCollection).some(Boolean),
    cleanedAt: now.toISOString(),
  };
}
