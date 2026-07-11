/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { QueryTypes, type Transaction } from 'sequelize';

const EVENT_COLLECTIONS = ['agRunEvents', 'agAgentConversationEvents'] as const;
const registeredDatabases = new WeakSet<Database>();
const readyScopes = new WeakMap<Database, Set<string>>();

interface EventModel {
  isNewRecord?: boolean;
  get(name: string): unknown;
  set(name: string, value: unknown): void;
}

interface EventCreateHookOptions {
  transaction?: Transaction;
  individualHooks?: boolean;
  type?: string;
}

interface IngestAssignment {
  fieldName: 'ingestId' | 'sessionIngestId';
  model: EventModel;
  scope: string;
}

function getRequiredModelString(model: EventModel, fieldName: string) {
  const value = String(model.get(fieldName) ?? '').trim();
  if (!value) {
    throw new Error(`Agent Gateway event ${fieldName} is required before ingest cursor allocation`);
  }
  return value;
}

function getSequenceValue(value: unknown) {
  const normalized = typeof value === 'bigint' ? value : BigInt(String(value ?? 0));
  if (normalized < 0n) {
    throw new Error('Agent Gateway event ingest sequence is invalid');
  }
  return normalized;
}

export function getRunEventIngestScope(runId: string) {
  return `run-events:${runId}`;
}

export function getConversationRunIngestScope(runId: string) {
  return `conversation-run:${runId}`;
}

export function getConversationSessionIngestScope(sessionId: string) {
  return `conversation-session:${sessionId}`;
}

async function ensureEventIngestScope(db: Database, scope: string, transaction: Transaction) {
  const scopes = readyScopes.get(db) || new Set<string>();
  readyScopes.set(db, scopes);
  if (scopes.has(scope)) {
    return;
  }
  if (!db.hasCollection('agEventIngestSequences')) {
    throw new Error('Agent Gateway event ingest sequence storage is unavailable');
  }
  const [, created] = await db.getCollection('agEventIngestSequences').model.findOrCreate({
    where: {
      scope,
    },
    defaults: {
      scope,
      value: 0,
    },
    transaction,
  });
  if (created) {
    transaction.afterCommit(() => {
      scopes.add(scope);
    });
  } else {
    scopes.add(scope);
  }
}

async function reservePostgresRange(db: Database, scope: string, count: number, transaction: Transaction) {
  const collection = db.getCollection('agEventIngestSequences');
  const scopeColumn = db.quoteIdentifier(collection.getField('scope').columnName());
  const valueColumn = db.quoteIdentifier(collection.getField('value').columnName());
  const rows = await db.sequelize.query<{ value: string }>(
    [
      `UPDATE ${collection.quotedTableName()}`,
      `SET ${valueColumn} = ${valueColumn} + :count`,
      `WHERE ${scopeColumn} = :scope`,
      `RETURNING ${valueColumn} AS ${db.quoteIdentifier('value')}`,
    ].join(' '),
    {
      replacements: {
        count,
        scope,
      },
      transaction,
      type: QueryTypes.SELECT,
    },
  );
  if (!rows.length) {
    throw new Error('Agent Gateway event ingest scope is unavailable');
  }
  return getSequenceValue(rows[0].value);
}

async function reserveLockedRange(db: Database, scope: string, count: number, transaction: Transaction) {
  const sequence = await db.getCollection('agEventIngestSequences').model.findOne({
    where: {
      scope,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!sequence) {
    throw new Error('Agent Gateway event ingest scope is unavailable');
  }
  const nextValue = getSequenceValue(sequence.get('value')) + BigInt(count);
  await sequence.update(
    {
      value: nextValue.toString(),
    },
    {
      transaction,
    },
  );
  return nextValue;
}

export async function reserveEventIngestRange(db: Database, scope: string, count: number, transaction: Transaction) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Agent Gateway event ingest range size must be a positive integer');
  }
  await ensureEventIngestScope(db, scope, transaction);
  const rangeEnd = db.inDialect('postgres')
    ? await reservePostgresRange(db, scope, count, transaction)
    : await reserveLockedRange(db, scope, count, transaction);
  return {
    start: rangeEnd - BigInt(count) + 1n,
    end: rangeEnd,
  };
}

function getAssignments(collectionName: (typeof EVENT_COLLECTIONS)[number], model: EventModel) {
  const runId = getRequiredModelString(model, 'runId');
  if (collectionName === 'agRunEvents') {
    return [
      {
        fieldName: 'ingestId' as const,
        model,
        scope: getRunEventIngestScope(runId),
      },
    ];
  }

  const assignments: IngestAssignment[] = [
    {
      fieldName: 'ingestId',
      model,
      scope: getConversationRunIngestScope(runId),
    },
  ];
  const sessionId = String(model.get('sessionId') ?? '').trim();
  if (sessionId) {
    assignments.push({
      fieldName: 'sessionIngestId',
      model,
      scope: getConversationSessionIngestScope(sessionId),
    });
  }
  return assignments;
}

async function assignEventIngestIds(
  db: Database,
  collectionName: (typeof EVENT_COLLECTIONS)[number],
  models: EventModel[],
  options: EventCreateHookOptions,
) {
  if (!options.transaction) {
    throw new Error('Agent Gateway event creation requires a transaction for reliable ingest cursors');
  }
  const assignmentsByScope = new Map<string, IngestAssignment[]>();
  for (const model of models) {
    for (const assignment of getAssignments(collectionName, model)) {
      const assignments = assignmentsByScope.get(assignment.scope) || [];
      assignments.push(assignment);
      assignmentsByScope.set(assignment.scope, assignments);
    }
  }
  for (const scope of [...assignmentsByScope.keys()].sort()) {
    const assignments = assignmentsByScope.get(scope) || [];
    const range = await reserveEventIngestRange(db, scope, assignments.length, options.transaction);
    assignments.forEach((assignment, index) => {
      assignment.model.set(assignment.fieldName, (range.start + BigInt(index)).toString());
    });
  }
}

export function registerEventIngestCursorHooks(db: Database) {
  if (registeredDatabases.has(db)) {
    return;
  }
  registeredDatabases.add(db);

  for (const collectionName of EVENT_COLLECTIONS) {
    db.on(`${collectionName}.beforeValidate`, async (model: EventModel, options: EventCreateHookOptions) => {
      if (model.isNewRecord !== true || options.type === QueryTypes.BULKUPDATE) {
        return;
      }
      await assignEventIngestIds(db, collectionName, [model], options);
    });
    db.on(`${collectionName}.beforeBulkCreate`, async (models: EventModel[], options: EventCreateHookOptions) => {
      if (options.individualHooks) {
        return;
      }
      await assignEventIngestIds(db, collectionName, models, options);
    });
  }
}
