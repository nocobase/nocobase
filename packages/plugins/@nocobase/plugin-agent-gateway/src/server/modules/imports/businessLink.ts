/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import { Context } from '@nocobase/actions';
import { Transaction } from 'sequelize';

import { JsonRecord, ModelRecord, getCurrentRoleNames, getRecord, getString } from '../../actions/utils';

interface FieldLike {
  options?: JsonRecord;
  [key: string]: unknown;
}

interface CollectionLike {
  name?: string;
  hasField?(name: string): boolean;
  getField?(name: string): FieldLike | undefined;
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

interface OutputRelation {
  fieldName: string;
  foreignKey: string;
}

interface CollectionActionAccess {
  filter?: JsonRecord;
  readFields: Set<string> | null;
  writeFields: Set<string> | null;
}

export interface SourceRecordRelationPlan {
  sourceCollection: string;
  sourceRecordId: string;
  outputAgentRunField: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getObjectLike(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function getStringSet(values: unknown[]) {
  const fields = values.map((field) => getString(field)).filter(Boolean);
  return fields.length ? new Set(fields) : null;
}

function getReadableFields(params: JsonRecord) {
  const fields = Array.isArray(params.fields) ? params.fields : [];
  const appends = Array.isArray(params.appends) ? params.appends : [];
  return getStringSet([...fields, ...appends]);
}

function getWritableFields(params: JsonRecord) {
  const whitelist = Array.isArray(params.whitelist) ? params.whitelist : [];
  const fields = Array.isArray(params.fields) ? params.fields : [];
  return getStringSet(whitelist) || getStringSet(fields);
}

function mergeFilters(...filters: Array<JsonRecord | undefined>) {
  const activeFilters = filters.filter((filter): filter is JsonRecord => Boolean(filter && Object.keys(filter).length));
  if (!activeFilters.length) {
    return {};
  }
  return activeFilters.length === 1 ? activeFilters[0] : { $and: activeFilters };
}

function getFieldOption(field: FieldLike | undefined, key: string) {
  const fieldRecord = getObjectLike(field);
  const options = getObjectLike(fieldRecord.options);
  return options[key] ?? fieldRecord[key];
}

function getFieldOptionString(field: FieldLike | undefined, key: string) {
  return getString(getFieldOption(field, key));
}

function getCollection(ctx: Context, collectionName: string) {
  const collection = (ctx.db as unknown as DatabaseWithCollections).getCollection?.(collectionName);
  if (!collection) {
    ctx.throw(400, `Collection not found: ${collectionName}`);
  }
  return collection;
}

function assertOutputAgentRunField(ctx: Context, collectionName: string, fieldName: string): OutputRelation {
  const collection = getCollection(ctx, collectionName);
  const hasField = collection.hasField ? collection.hasField(fieldName) : Boolean(collection.getField?.(fieldName));
  const field = collection.getField?.(fieldName);
  if (!hasField || !field) {
    ctx.throw(400, `Field not found: ${fieldName}`);
  }
  const fieldType = getFieldOptionString(field, 'type');
  const target = getFieldOptionString(field, 'target');
  const targetKey = getFieldOptionString(field, 'targetKey') || 'id';
  const foreignKey = getFieldOptionString(field, 'foreignKey') || `${fieldName}Id`;
  if (fieldType !== 'belongsTo' || target !== 'agRuns' || targetKey !== 'id') {
    ctx.throw(400, 'outputAgentRunField must be a belongsTo relation field targeting agRuns.id');
  }
  return { fieldName, foreignKey };
}

async function getCollectionActionAccess(ctx: Context, collectionName: string, action: 'view' | 'update') {
  const collection = getCollection(ctx, collectionName);
  const roles = await getCurrentRoleNames(ctx);
  const permission = ctx.app.acl.can({ roles, resource: collectionName, action });
  if (!permission || typeof permission !== 'object') {
    ctx.throw(403, `No permission to ${action} collection: ${collectionName}`);
  }
  const params = getRecord(permission.params);
  try {
    checkFilterParams(collection, params.filter);
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, `No permission to ${action} collection: ${collectionName}`);
    }
    throw error;
  }
  const parsedParams = getRecord(
    await parseJsonTemplate(params, {
      state: ctx.state,
      timezone: ctx.get('x-timezone'),
      userProvider: createUserProvider({ db: ctx.db, currentUser: ctx.state.currentUser }),
    }),
  );
  const access: CollectionActionAccess = {
    filter: getRecord(parsedParams.filter),
    readFields: action === 'view' ? getReadableFields(parsedParams) : null,
    writeFields: action === 'update' ? getWritableFields(parsedParams) : null,
  };
  return access;
}

export async function assertSourceRecordRelationWritable(
  ctx: Context,
  options: SourceRecordRelationPlan & { transaction: Transaction },
) {
  const output = assertOutputAgentRunField(ctx, options.sourceCollection, options.outputAgentRunField);
  const viewAccess = await getCollectionActionAccess(ctx, options.sourceCollection, 'view');
  const updateAccess = await getCollectionActionAccess(ctx, options.sourceCollection, 'update');
  if (
    updateAccess.writeFields &&
    !updateAccess.writeFields.has(output.fieldName) &&
    !updateAccess.writeFields.has(output.foreignKey)
  ) {
    ctx.throw(403, `No permission to write output relation field: ${output.fieldName}`);
  }
  const repo = ctx.db.getRepository(options.sourceCollection);
  const record = (await repo.findOne({
    filterByTk: options.sourceRecordId,
    filter: mergeFilters(viewAccess.filter, updateAccess.filter),
    transaction: options.transaction,
    lock: options.transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!record) {
    ctx.throw(404, 'Source record not found');
  }
  return { output, repo };
}

export async function updateSourceRecordRelation(
  ctx: Context,
  options: SourceRecordRelationPlan & { runId: string; transaction: Transaction },
) {
  const { output, repo } = await assertSourceRecordRelationWritable(ctx, options);
  await repo.update({
    filterByTk: options.sourceRecordId,
    values: { [output.foreignKey]: options.runId },
    transaction: options.transaction,
  });
  return true;
}
