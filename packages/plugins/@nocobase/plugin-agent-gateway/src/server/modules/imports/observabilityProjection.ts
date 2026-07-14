/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';

import { isTerminalRunStatus } from '../../../shared/runState';
import { JsonRecord, ModelRecord, getString } from '../../actions/utils';
import {
  OBSERVABILITY_ROLLUP_EVENT_FILTER,
  buildRunObservabilityRollup,
  getRunObservabilityRollup,
  mergeRunObservabilityRollup,
} from '../../services/observationRollup';
import { ObservationOperation } from './serialization';

function getConversationEventFilter(operations: ObservationOperation[]): JsonRecord | null {
  const identitiesBySource = new Map<string, { providerEventIds: Set<string>; sequences: Set<number> }>();
  for (const operation of operations) {
    if (operation.type !== 'conversation-event' && operation.type !== 'initial-conversation') {
      continue;
    }
    const source = getString(operation.values.source);
    const sequence = Number(operation.values.sequence);
    if (!source || !Number.isInteger(sequence) || sequence < 0) {
      continue;
    }
    const identities = identitiesBySource.get(source) || {
      providerEventIds: new Set<string>(),
      sequences: new Set<number>(),
    };
    const providerEventId = getString(operation.values.providerEventId);
    if (providerEventId) {
      identities.providerEventIds.add(providerEventId);
    } else {
      identities.sequences.add(sequence);
    }
    identitiesBySource.set(source, identities);
  }
  const filters: JsonRecord[] = [];
  for (const [source, identities] of identitiesBySource) {
    if (identities.providerEventIds.size) {
      filters.push({ source, providerEventId: { $in: [...identities.providerEventIds] } });
    }
    if (identities.sequences.size) {
      filters.push({ source, sequence: { $in: [...identities.sequences] } });
    }
  }
  return filters.length ? { $or: filters } : null;
}

export async function mergeExternalImportObservabilityRollup(
  ctx: Context,
  options: {
    run: ModelRecord;
    runId: string;
    batchId: string;
    operations: ObservationOperation[];
    finalStatus: string;
    resultSummaryJson: unknown;
    transaction: Transaction;
  },
) {
  const existingRollup = getRunObservabilityRollup(options.run);
  const identityFilter = existingRollup ? getConversationEventFilter(options.operations) : null;
  const events =
    existingRollup && !identityFilter
      ? []
      : ((await ctx.db.getRepository('agAgentConversationEvents').find({
          filter: {
            $and: [
              { runId: options.runId },
              OBSERVABILITY_ROLLUP_EVENT_FILTER,
              ...(identityFilter ? [identityFilter] : []),
            ],
          },
          sort: ['createdAt', 'sequence', 'id'],
          transaction: options.transaction,
        })) as ModelRecord[]);
  return existingRollup
    ? mergeRunObservabilityRollup(options.run, events, new Date(), {
        externalImportBatchId: options.batchId,
        closeDanglingToolCalls: isTerminalRunStatus(options.finalStatus),
        resultSummaryJson: options.resultSummaryJson,
      })
    : buildRunObservabilityRollup(options.run, events, new Date(), {
        closeDanglingToolCalls: isTerminalRunStatus(options.finalStatus),
        resultSummaryJson: options.resultSummaryJson,
      });
}
