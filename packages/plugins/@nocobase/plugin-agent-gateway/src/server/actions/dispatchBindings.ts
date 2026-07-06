/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import { AGENT_GATEWAY_ACTIONS, redactText } from '../security';
import {
  AGENT_GATEWAY_ERROR_CODES,
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getCurrentUserId,
  getCurrentRoleNames,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  getVisibleRunFilter,
  hasModelGetter,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';
import { renderPromptTemplate } from './promptTemplates';

const BINDING_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_BINDING_STATUS = 'active';
const DISABLED_BINDING_STATUSES = new Set(['disabled', 'inactive']);
const CLAIMABLE_RUN_STATUS = 'queued';
const NON_TERMINAL_RUN_STATUSES = new Set(['queued', 'claimed', 'syncing_skills', 'running', 'canceling']);
const TERMINAL_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const RELATION_FIELD_TYPES = new Set(['belongsTo', 'hasOne', 'hasMany', 'belongsToMany']);
const SKILL_SELECTION_TARGETS = new Set(['agSkillVersions', 'agNodeSkillInstalls']);

interface FieldLike {
  type?: string;
  target?: string;
  targetKey?: string;
  foreignKey?: string;
  options?: JsonRecord;
}

interface CollectionLike {
  name?: string;
  hasField?(name: string): boolean;
  getField?(name: string): FieldLike | undefined;
  filterTargetKey?: string | string[] | null;
  model?: {
    primaryKeyAttribute?: string;
    primaryKeyAttributes?: string[];
    rawAttributes?: Record<string, { primaryKey?: boolean }>;
  } & Partial<ModelStaticLike>;
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

interface ModelStaticLike {
  findByPk(value: string, options?: JsonRecord): Promise<ModelRecord | null>;
  findOne(options?: JsonRecord): Promise<ModelRecord | null>;
  destroy(options: JsonRecord): Promise<number>;
}

interface BindingPayloadOptions {
  partial?: boolean;
  existing?: ModelRecord;
  transaction?: Transaction;
}

interface OutputRelation {
  fieldName: string;
  foreignKey: string;
}

interface CollectionActionAccess {
  collectionName: string;
  filter: JsonRecord;
  readFields: Set<string> | null;
  writeFields: Set<string> | null;
}

interface DispatchResult {
  bindingId: string | number;
  bindingKey: string;
  run: JsonRecord;
  idempotent: boolean;
  runId: string;
  runCode: string;
  agentSessionId: string | null;
  sourceCollection: string;
  sourceRecordId: string;
  outputAgentRunField: string;
  relationUpdated: boolean;
  deduped: boolean;
}

interface NodeAndProfileSelection {
  nodeId: string | null;
  agentProfileId: string | null;
}

interface SkillSelectionResult {
  values: JsonRecord;
  resolved: JsonRecord;
}

interface HookOptions {
  transaction?: Transaction;
}

function hasOwnKey(values: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(values, key);
}

function getObjectLike(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? (value as JsonRecord) : {};
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
  return collection as CollectionLike;
}

function getCollectionModel(ctx: Context, collectionName: string) {
  const model = getCollection(ctx, collectionName).model;
  if (
    !model ||
    typeof model.findByPk !== 'function' ||
    typeof model.findOne !== 'function' ||
    typeof model.destroy !== 'function'
  ) {
    ctx.throw(400, `Collection not found: ${collectionName}`);
  }
  return model as ModelStaticLike;
}

function getCollectionField(ctx: Context, collection: CollectionLike, fieldName: string) {
  const hasField = collection.hasField ? collection.hasField(fieldName) : Boolean(collection.getField?.(fieldName));
  const field = collection.getField?.(fieldName);
  if (!hasField || !field) {
    ctx.throw(400, `Field not found: ${fieldName}`);
  }
  return field as FieldLike;
}

function getRequiredString(ctx: Context, value: unknown, name: string) {
  const stringValue = getString(value);
  if (!stringValue) {
    ctx.throw(400, `${name} is required`);
  }
  return stringValue;
}

function getRequiredTargetKey(ctx: Context, value: unknown, name: string) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    const targetKey = String(value).trim();
    if (targetKey) {
      return targetKey;
    }
  }

  ctx.throw(400, `${name} is required`);
}

function getOptionalId(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function getOptionalModelId(model: ModelRecord, key: string) {
  return getOptionalId(getModelValue(model, key));
}

function getBooleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return fallback;
}

function getJsonConfig(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  return getRecord(value);
}

function getStatusFromValue(ctx: Context, value: unknown, fallback = ACTIVE_BINDING_STATUS) {
  const status = getString(value) || fallback;
  if (status !== ACTIVE_BINDING_STATUS && !DISABLED_BINDING_STATUSES.has(status)) {
    ctx.throw(400, 'Binding status must be active, disabled, or inactive');
  }
  return status;
}

function getStringSet(values: unknown) {
  if (!Array.isArray(values)) {
    return null;
  }

  const fields = values.map((field) => getString(field)).filter(Boolean);
  return fields.length ? new Set(fields) : null;
}

function getReadableFields(params: JsonRecord) {
  const fields = Array.isArray(params.fields) ? params.fields : [];
  const appends = Array.isArray(params.appends) ? params.appends : [];
  return getStringSet([...fields, ...appends]);
}

function getWritableFields(params: JsonRecord) {
  return getStringSet(params.whitelist) || getStringSet(params.fields);
}

function hasFilter(filter?: JsonRecord) {
  return Boolean(filter && Object.keys(filter).length);
}

function mergeFilters(...filters: Array<JsonRecord | undefined>) {
  const activeFilters = filters.filter((filter): filter is JsonRecord => hasFilter(filter));
  if (!activeFilters.length) {
    return {};
  }
  if (activeFilters.length === 1) {
    return activeFilters[0];
  }
  return {
    $and: activeFilters,
  };
}

function serializeBinding(binding: ModelRecord) {
  return getModelJson(binding);
}

function serializeRun(run: ModelRecord) {
  const json = getModelJson(run);
  delete json.claimTokenHash;
  delete json.claimAttempt;
  delete json.leaseVersion;
  delete json.claimTokenLast4;
  delete json.claimExpiresAt;
  delete json.terminalSessionName;
  delete json.promptSnapshot;
  delete json.executionPayloadJson;
  return json;
}

function getPrimaryKeyName(ctx: Context, collection: CollectionLike) {
  const rawPrimaryKeys = Object.entries(collection.model?.rawAttributes || {})
    .filter(([, attribute]) => attribute.primaryKey === true)
    .map(([name]) => name);
  if (rawPrimaryKeys.length === 1) {
    return rawPrimaryKeys[0];
  }

  const primaryKeyAttributes = collection.model?.primaryKeyAttributes;
  if (Array.isArray(primaryKeyAttributes) && primaryKeyAttributes.length === 1) {
    return primaryKeyAttributes[0];
  }

  const primaryKey = collection.model?.primaryKeyAttribute;
  if (primaryKey) {
    return primaryKey;
  }

  ctx.throw(400, `Collection ${collection.name || ''} must have a single primary key`);
}

function getPrimaryKeyFilter(ctx: Context, collection: CollectionLike, recordId: string) {
  const primaryKey = getPrimaryKeyName(ctx, collection);
  return {
    [primaryKey]: recordId,
  };
}

function assertReadableField(ctx: Context, access: CollectionActionAccess, fieldName: string, label: string) {
  if (access.readFields && !access.readFields.has(fieldName)) {
    ctx.throw(403, `No permission to read ${label}: ${fieldName}`);
  }
}

function assertWritableOutputField(ctx: Context, access: CollectionActionAccess, output: OutputRelation) {
  if (access.writeFields && !access.writeFields.has(output.fieldName) && !access.writeFields.has(output.foreignKey)) {
    ctx.throw(403, `No permission to write output relation field: ${output.fieldName}`);
  }
}

async function getCollectionActionAccess(
  ctx: Context,
  collectionName: string,
  action: 'view' | 'update',
): Promise<CollectionActionAccess> {
  const collection = getCollection(ctx, collectionName);
  const roles = await getCurrentRoleNames(ctx);
  const permission = ctx.app.acl.can({
    roles,
    resource: collectionName,
    action,
  });

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
      userProvider: createUserProvider({
        db: ctx.db,
        currentUser: ctx.state.currentUser,
      }),
    }),
  );

  return {
    collectionName,
    filter: getRecord(parsedParams.filter),
    readFields: action === 'view' ? getReadableFields(parsedParams) : null,
    writeFields: action === 'update' ? getWritableFields(parsedParams) : null,
  };
}

async function assertSelectableRecordVisible(
  ctx: Context,
  collectionName: string,
  recordId: string,
  label: string,
  transaction: Transaction,
): Promise<void> {
  const access = await getCollectionActionAccess(ctx, collectionName, 'view');
  const collection = getCollection(ctx, collectionName);
  const visibleCount = await ctx.db.getRepository(collectionName).count({
    filter: mergeFilters(getPrimaryKeyFilter(ctx, collection, recordId), access.filter),
    transaction,
  });
  if (!visibleCount) {
    ctx.throw(403, `No permission to select ${label}`);
  }
}

function assertOutputAgentRunField(ctx: Context, collectionName: string, fieldName: string): OutputRelation {
  const collection = getCollection(ctx, collectionName);
  const field = getCollectionField(ctx, collection, fieldName);
  const fieldType = getFieldOptionString(field, 'type');
  const target = getFieldOptionString(field, 'target');
  const targetKey = getFieldOptionString(field, 'targetKey') || 'id';
  const foreignKey = getFieldOptionString(field, 'foreignKey') || `${fieldName}Id`;

  if (fieldType !== 'belongsTo' || target !== 'agRuns' || targetKey !== 'id') {
    ctx.throw(400, 'outputAgentRunField must be a belongsTo relation field targeting agRuns.id');
  }

  return {
    fieldName,
    foreignKey,
  };
}

function assertConfiguredSelectionField(
  ctx: Context,
  collection: CollectionLike,
  fieldName: string,
  targetCollection: string,
) {
  if (!fieldName) {
    return;
  }

  const field = getCollectionField(ctx, collection, fieldName);
  const fieldType = getFieldOptionString(field, 'type');
  if (!['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(fieldType)) {
    return;
  }

  const target = getFieldOptionString(field, 'target');
  if (target !== targetCollection) {
    ctx.throw(400, `${fieldName} must target ${targetCollection}`);
  }
}

function getMappedFieldNames(config: unknown) {
  const fieldNames: string[] = [];
  if (!config) {
    return fieldNames;
  }

  if (Array.isArray(config)) {
    for (const item of config) {
      const fieldName = getString(item);
      if (fieldName) {
        fieldNames.push(fieldName);
      }
    }
  } else if (typeof config === 'object') {
    for (const fieldName of Object.values(config as JsonRecord)
      .map((value) => getString(value))
      .filter(Boolean)) {
      fieldNames.push(fieldName);
    }
  }

  return fieldNames;
}

function validateFieldMappingConfig(ctx: Context, collection: CollectionLike, config: unknown, label: string) {
  const fieldNames = getMappedFieldNames(config);
  for (const fieldName of fieldNames) {
    try {
      getCollectionField(ctx, collection, fieldName);
    } catch {
      ctx.throw(400, `${label} references an unknown field: ${fieldName}`);
    }
  }
}

function validateSkillFieldConfig(ctx: Context, collection: CollectionLike, config: unknown) {
  for (const fieldName of getMappedFieldNames(config)) {
    const field = getCollectionField(ctx, collection, fieldName);
    const fieldType = getFieldOptionString(field, 'type');
    const target = getFieldOptionString(field, 'target');
    if (!RELATION_FIELD_TYPES.has(fieldType) || !SKILL_SELECTION_TARGETS.has(target)) {
      ctx.throw(400, 'skillFieldsJson must reference relation fields targeting agSkillVersions or agNodeSkillInstalls');
    }
  }
}

async function validatePromptTemplate(ctx: Context, promptTemplateId: string, transaction?: Transaction) {
  const template = (await ctx.db.getRepository('agPromptTemplates').findOne({
    filter: {
      id: promptTemplateId,
    },
    transaction,
  })) as ModelRecord | null;

  if (!template) {
    ctx.throw(400, 'Prompt template not found');
  }
}

function getBindingCollectionName(binding: ModelRecord) {
  return getModelString(binding, 'collectionName') || getModelString(binding, 'sourceCollection');
}

function getBindingEnabled(binding: ModelRecord) {
  const enabled = getModelValue(binding, 'enabled');
  if (typeof enabled === 'boolean') {
    return enabled;
  }
  return getModelString(binding, 'status') === ACTIVE_BINDING_STATUS;
}

function getBindingPayload(ctx: Context, values: JsonRecord, options: BindingPayloadOptions = {}) {
  const payload: JsonRecord = {};

  if (!options.partial || hasOwnKey(values, 'bindingKey')) {
    const bindingKey = getRequiredString(ctx, values.bindingKey, 'bindingKey');
    if (!BINDING_KEY_PATTERN.test(bindingKey)) {
      ctx.throw(
        400,
        'bindingKey must start with a letter and contain only letters, numbers, underscore, dot, colon, or hyphen',
      );
    }
    payload.bindingKey = bindingKey;
  }

  if (!options.partial || hasOwnKey(values, 'collectionName')) {
    const collectionName = getRequiredString(ctx, values.collectionName, 'collectionName');
    payload.collectionName = collectionName;
    payload.sourceCollection = collectionName;
  }

  if (!options.partial || hasOwnKey(values, 'outputAgentRunField')) {
    payload.outputAgentRunField = getRequiredString(ctx, values.outputAgentRunField, 'outputAgentRunField');
  }

  if (!options.partial || hasOwnKey(values, 'promptTemplateId')) {
    payload.promptTemplateId = getRequiredString(ctx, values.promptTemplateId, 'promptTemplateId');
  }

  if (hasOwnKey(values, 'agentProfileId')) {
    payload.agentProfileId = getString(values.agentProfileId) || null;
  }
  if (hasOwnKey(values, 'nodeId')) {
    payload.nodeId = getString(values.nodeId) || null;
  }
  if (hasOwnKey(values, 'agentProfileField')) {
    payload.agentProfileField = getString(values.agentProfileField) || null;
  }
  if (hasOwnKey(values, 'nodeField')) {
    payload.nodeField = getString(values.nodeField) || null;
  }
  if (hasOwnKey(values, 'skillFieldsJson') || hasOwnKey(values, 'skillFields')) {
    payload.skillFieldsJson = getJsonConfig(values.skillFieldsJson || values.skillFields);
  } else if (!options.partial) {
    payload.skillFieldsJson = {};
  }
  if (hasOwnKey(values, 'fieldMappingsJson') || hasOwnKey(values, 'fieldMappings')) {
    payload.fieldMappingsJson = getJsonConfig(values.fieldMappingsJson || values.fieldMappings);
  } else if (!options.partial) {
    payload.fieldMappingsJson = {};
  }
  if (hasOwnKey(values, 'filterJson')) {
    payload.filterJson = getRecord(values.filterJson);
  } else if (!options.partial) {
    payload.filterJson = {};
  }
  if (hasOwnKey(values, 'payloadMappingJson')) {
    payload.payloadMappingJson = getRecord(values.payloadMappingJson);
  } else if (!options.partial) {
    payload.payloadMappingJson = {};
  }
  if (hasOwnKey(values, 'metadataJson') || hasOwnKey(values, 'metadata')) {
    payload.metadataJson = getRecord(values.metadataJson || values.metadata);
  } else if (!options.partial) {
    payload.metadataJson = {};
  }
  if (hasOwnKey(values, 'triggerType')) {
    payload.triggerType = getString(values.triggerType) || 'record-action';
  } else if (!options.partial) {
    payload.triggerType = 'record-action';
  }
  if (hasOwnKey(values, 'sourceAction')) {
    payload.sourceAction = getString(values.sourceAction) || null;
  } else if (!options.partial) {
    payload.sourceAction = 'dispatch';
  }
  if (hasOwnKey(values, 'priority')) {
    const priority = Number(values.priority);
    if (!Number.isInteger(priority)) {
      ctx.throw(400, 'priority must be an integer');
    }
    payload.priority = priority;
  } else if (!options.partial) {
    payload.priority = 0;
  }

  if (hasOwnKey(values, 'enabled') || !options.partial) {
    const enabled = getBooleanValue(values.enabled, true);
    payload.enabled = enabled;
    payload.status = enabled ? ACTIVE_BINDING_STATUS : 'disabled';
  }
  if (hasOwnKey(values, 'status')) {
    const status = getStatusFromValue(ctx, values.status);
    payload.status = status;
    payload.enabled = status === ACTIVE_BINDING_STATUS;
  }

  return payload;
}

function getEffectiveBindingString(payload: JsonRecord, existing: ModelRecord | undefined, key: string) {
  return hasOwnKey(payload, key) ? getString(payload[key]) : existing ? getModelString(existing, key) : '';
}

function getEffectiveBindingValue(payload: JsonRecord, existing: ModelRecord | undefined, key: string) {
  return hasOwnKey(payload, key) ? payload[key] : existing ? getModelValue(existing, key) : undefined;
}

async function validateBindingPayload(ctx: Context, payload: JsonRecord, options: BindingPayloadOptions = {}) {
  const existing = options.existing;
  const collectionName =
    getEffectiveBindingString(payload, existing, 'collectionName') ||
    (existing ? getBindingCollectionName(existing) : '') ||
    getString(payload.sourceCollection);
  const outputAgentRunField =
    getEffectiveBindingString(payload, existing, 'outputAgentRunField') ||
    (existing ? getModelString(existing, 'outputAgentRunField') : '');
  const promptTemplateId =
    getEffectiveBindingString(payload, existing, 'promptTemplateId') ||
    (existing ? getOptionalModelId(existing, 'promptTemplateId') : '');
  const agentProfileField = getEffectiveBindingString(payload, existing, 'agentProfileField');
  const nodeField = getEffectiveBindingString(payload, existing, 'nodeField');
  const fieldMappingsJson = getEffectiveBindingValue(payload, existing, 'fieldMappingsJson');
  const skillFieldsJson = getEffectiveBindingValue(payload, existing, 'skillFieldsJson');

  if (!collectionName) {
    ctx.throw(400, 'collectionName is required');
  }
  if (!outputAgentRunField) {
    ctx.throw(400, 'outputAgentRunField is required');
  }
  if (!promptTemplateId) {
    ctx.throw(400, 'promptTemplateId is required');
  }

  const collection = getCollection(ctx, collectionName);
  assertOutputAgentRunField(ctx, collectionName, outputAgentRunField);
  assertConfiguredSelectionField(ctx, collection, agentProfileField, 'agAgentProfiles');
  assertConfiguredSelectionField(ctx, collection, nodeField, 'agNodes');
  validateFieldMappingConfig(ctx, collection, fieldMappingsJson, 'fieldMappingsJson');
  validateSkillFieldConfig(ctx, collection, skillFieldsJson);
  await validatePromptTemplate(ctx, promptTemplateId, options.transaction);
}

async function validateBindingRecord(ctx: Context, binding: ModelRecord, transaction?: Transaction) {
  const collectionName = getBindingCollectionName(binding);
  const outputAgentRunField = getModelString(binding, 'outputAgentRunField');
  const promptTemplateId = getOptionalModelId(binding, 'promptTemplateId');

  if (!collectionName) {
    ctx.throw(400, 'collectionName is required');
  }
  if (!outputAgentRunField) {
    ctx.throw(400, 'outputAgentRunField is required');
  }
  if (!promptTemplateId) {
    ctx.throw(400, 'promptTemplateId is required');
  }

  const collection = getCollection(ctx, collectionName);
  assertOutputAgentRunField(ctx, collectionName, outputAgentRunField);
  assertConfiguredSelectionField(ctx, collection, getModelString(binding, 'agentProfileField'), 'agAgentProfiles');
  assertConfiguredSelectionField(ctx, collection, getModelString(binding, 'nodeField'), 'agNodes');
  validateFieldMappingConfig(ctx, collection, getModelValue(binding, 'fieldMappingsJson'), 'fieldMappingsJson');
  validateSkillFieldConfig(ctx, collection, getModelValue(binding, 'skillFieldsJson'));
  await validatePromptTemplate(ctx, promptTemplateId, transaction);
}

async function findBindingByKey(ctx: Context, bindingKey: string, transaction?: Transaction) {
  return (await ctx.db.getRepository('agDispatchBindings').findOne({
    filter: {
      bindingKey,
    },
    transaction,
  })) as ModelRecord | null;
}

async function findBindingById(
  ctx: Context,
  bindingId: string,
  transaction?: Transaction,
  options: { lock?: boolean } = {},
) {
  const findOptions: JsonRecord = {};
  if (transaction) {
    findOptions.transaction = transaction;
    if (options.lock) {
      findOptions.lock = transaction.LOCK.UPDATE;
    }
  }

  const model = getCollectionModel(ctx, 'agDispatchBindings');
  const binding = await model.findOne({
    ...findOptions,
    where: {
      id: bindingId,
    },
  });
  if (binding) {
    return binding;
  }

  const scanOptions: JsonRecord = {};
  if (transaction) {
    scanOptions.transaction = transaction;
    if (options.lock) {
      scanOptions.lock = transaction.LOCK.UPDATE;
    }
  }
  const bindings = (await ctx.db.getRepository('agDispatchBindings').find(scanOptions)) as ModelRecord[];
  return bindings.find((item) => String(getModelValue(item, 'id')) === bindingId) || null;
}

async function findBindingByIdentifier(
  ctx: Context,
  identifier: unknown,
  transaction?: Transaction,
  options: { lock?: boolean } = {},
) {
  let value = getString(identifier);
  try {
    value = decodeURIComponent(value);
  } catch {
    ctx.throw(400, 'Invalid dispatch binding identifier');
  }
  if (!value) {
    return null;
  }

  const findOptions: JsonRecord = {
    transaction,
  };
  if (transaction && options.lock) {
    findOptions.lock = transaction.LOCK.UPDATE;
  }

  if (UUID_PATTERN.test(value)) {
    return await findBindingById(ctx, value, transaction, options);
  }

  return (await ctx.db.getRepository('agDispatchBindings').findOne({
    ...findOptions,
    filter: {
      bindingKey: value,
    },
  })) as ModelRecord | null;
}

async function ensureUniqueBindingKey(ctx: Context, bindingKey: string, currentId?: unknown) {
  const existing = await findBindingByKey(ctx, bindingKey);
  if (existing && String(getModelTargetKey(existing, 'id')) !== String(currentId || '')) {
    ctx.throw(409, 'bindingKey already exists');
  }
}

function getRecordFieldValue(record: ModelRecord, collection: CollectionLike, fieldName: string) {
  const field = collection.getField?.(fieldName);
  const fieldType = getFieldOptionString(field, 'type');
  if (field && ['belongsTo', 'hasOne'].includes(fieldType)) {
    const foreignKey = getFieldOptionString(field, 'foreignKey');
    if (foreignKey) {
      const foreignKeyValue = getModelValue(record, foreignKey);
      if (foreignKeyValue !== undefined && foreignKeyValue !== null && getString(foreignKeyValue) !== '') {
        return foreignKeyValue;
      }
    }
  }

  return getModelValue(record, fieldName);
}

function getTargetIdFromValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (hasModelGetter(value)) {
    const id = getModelValue(value, 'id');
    return getOptionalId(id);
  }
  const id = getObjectLike(value).id;
  return getOptionalId(id);
}

function getTargetIdFromRecord(record: ModelRecord, collection: CollectionLike, fieldName: string) {
  return getTargetIdFromValue(getRecordFieldValue(record, collection, fieldName));
}

function getTargetIdsFromValue(value: unknown) {
  const values = Array.isArray(value) ? value : [value];
  const ids = values.map((item) => getTargetIdFromValue(item)).filter(Boolean);
  return Array.from(new Set(ids));
}

function getTargetIdsFromRecord(record: ModelRecord, collection: CollectionLike, fieldName: string) {
  return getTargetIdsFromValue(getRecordFieldValue(record, collection, fieldName));
}

function getExistingRunId(record: ModelRecord, output: OutputRelation) {
  return (
    getTargetIdFromValue(getModelValue(record, output.foreignKey)) ||
    getTargetIdFromValue(getModelValue(record, output.fieldName))
  );
}

function normalizePayloadValue(value: unknown) {
  if (hasModelGetter(value)) {
    return getModelJson(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function serializeSkillVersionSelection(skillVersion: ModelRecord) {
  return {
    skillVersionId: getModelTargetKey(skillVersion, 'id'),
    skillId: getOptionalModelId(skillVersion, 'skillId'),
    versionLabel: getModelString(skillVersion, 'versionLabel'),
    status: getModelString(skillVersion, 'status'),
  };
}

function serializeSkillInstallSelection(install: ModelRecord, skillVersion: ModelRecord) {
  return {
    ...serializeSkillVersionSelection(skillVersion),
    installId: getModelTargetKey(install, 'id'),
    nodeId: getOptionalModelId(install, 'nodeId'),
    installStatus: getModelString(install, 'status'),
  };
}

function resolveMappedFieldValues(
  ctx: Context,
  record: ModelRecord,
  collection: CollectionLike,
  access: CollectionActionAccess,
  config: unknown,
  label: string,
) {
  const result: JsonRecord = {};
  if (!config) {
    return result;
  }

  if (Array.isArray(config)) {
    for (const item of config) {
      const fieldName = getString(item);
      if (!fieldName) {
        continue;
      }
      getCollectionField(ctx, collection, fieldName);
      assertReadableField(ctx, access, fieldName, label);
      result[fieldName] = normalizePayloadValue(getRecordFieldValue(record, collection, fieldName));
    }
    return result;
  }

  if (typeof config === 'object') {
    for (const [key, value] of Object.entries(config as JsonRecord)) {
      const fieldName = getString(value);
      if (!fieldName) {
        continue;
      }
      getCollectionField(ctx, collection, fieldName);
      assertReadableField(ctx, access, fieldName, label);
      result[key] = normalizePayloadValue(getRecordFieldValue(record, collection, fieldName));
    }
  }

  return result;
}

async function findActiveSkillVersion(ctx: Context, skillVersionId: string, transaction: Transaction) {
  await assertSelectableRecordVisible(
    ctx,
    'agSkillVersions',
    skillVersionId,
    'Agent Gateway skill version',
    transaction,
  );
  const skillVersion = (await ctx.db.getRepository('agSkillVersions').findOne({
    filter: {
      id: skillVersionId,
      status: 'active',
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!skillVersion) {
    ctx.throw(409, 'Selected Agent Gateway skill version is not active');
  }
  return skillVersion;
}

async function assertSkillVersionInstalledOnNode(
  ctx: Context,
  skillVersionId: string,
  nodeId: string | null,
  transaction: Transaction,
) {
  if (!nodeId) {
    return null;
  }

  const install = (await ctx.db.getRepository('agNodeSkillInstalls').findOne({
    filter: {
      nodeId,
      skillVersionId,
      status: 'installed',
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!install) {
    ctx.throw(409, 'Selected Agent Gateway skill version is not installed on the selected node');
  }
  await assertSelectableRecordVisible(
    ctx,
    'agNodeSkillInstalls',
    String(getModelTargetKey(install, 'id')),
    'Agent Gateway node skill install',
    transaction,
  );
  return install;
}

async function findInstalledSkillSelection(
  ctx: Context,
  installId: string,
  nodeId: string | null,
  transaction: Transaction,
) {
  await assertSelectableRecordVisible(
    ctx,
    'agNodeSkillInstalls',
    installId,
    'Agent Gateway node skill install',
    transaction,
  );
  const install = (await ctx.db.getRepository('agNodeSkillInstalls').findOne({
    filter: {
      id: installId,
      status: 'installed',
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!install) {
    ctx.throw(409, 'Selected Agent Gateway node skill install is not active');
  }
  if (nodeId && getOptionalModelId(install, 'nodeId') !== nodeId) {
    ctx.throw(409, 'Selected Agent Gateway node skill install does not belong to the selected node');
  }

  const skillVersionId = getRequiredString(ctx, getModelValue(install, 'skillVersionId'), 'skillVersionId');
  const skillVersion = await findActiveSkillVersion(ctx, skillVersionId, transaction);
  return {
    install,
    skillVersion,
  };
}

async function resolveSkillSelections(
  ctx: Context,
  binding: ModelRecord,
  record: ModelRecord,
  collection: CollectionLike,
  viewAccess: CollectionActionAccess,
  nodeId: string | null,
  transaction: Transaction,
): Promise<SkillSelectionResult> {
  const values: JsonRecord = {};
  const resolved: JsonRecord = {};
  const config = getModelValue(binding, 'skillFieldsJson');
  const entries = Array.isArray(config)
    ? getMappedFieldNames(config).map((fieldName) => [fieldName, fieldName] as const)
    : Object.entries(getRecord(config))
        .map(([key, value]) => [key, getString(value)] as const)
        .filter(([, fieldName]) => Boolean(fieldName));

  for (const [key, fieldName] of entries) {
    const field = getCollectionField(ctx, collection, fieldName);
    assertReadableField(ctx, viewAccess, fieldName, 'skill selection');
    const target = getFieldOptionString(field, 'target');
    const ids = getTargetIdsFromRecord(record, collection, fieldName);
    if (!ids.length) {
      values[key] = null;
      resolved[key] = [];
      continue;
    }

    if (target === 'agSkillVersions') {
      const skillVersions: JsonRecord[] = [];
      for (const skillVersionId of ids) {
        const skillVersion = await findActiveSkillVersion(ctx, skillVersionId, transaction);
        const install = await assertSkillVersionInstalledOnNode(ctx, skillVersionId, nodeId, transaction);
        skillVersions.push(
          install
            ? serializeSkillInstallSelection(install, skillVersion)
            : serializeSkillVersionSelection(skillVersion),
        );
      }
      values[key] = ids.length === 1 ? ids[0] : ids;
      resolved[key] = skillVersions;
      continue;
    }

    const installs: JsonRecord[] = [];
    const skillVersionIds: string[] = [];
    for (const installId of ids) {
      const selection = await findInstalledSkillSelection(ctx, installId, nodeId, transaction);
      installs.push(serializeSkillInstallSelection(selection.install, selection.skillVersion));
      skillVersionIds.push(
        getRequiredString(ctx, getModelValue(selection.install, 'skillVersionId'), 'skillVersionId'),
      );
    }
    values[key] = skillVersionIds.length === 1 ? skillVersionIds[0] : skillVersionIds;
    resolved[key] = installs;
  }

  return {
    values,
    resolved,
  };
}

async function findActiveNode(ctx: Context, nodeId: string, transaction: Transaction) {
  if (!nodeId) {
    return null;
  }

  const node = (await ctx.db.getRepository('agNodes').findOne({
    filter: {
      id: nodeId,
      status: 'active',
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!node) {
    ctx.throw(409, 'Selected Agent Gateway node is not active');
  }
  return node;
}

async function findActiveProfile(ctx: Context, profileId: string, transaction: Transaction) {
  if (!profileId) {
    return null;
  }

  const profile = (await ctx.db.getRepository('agAgentProfiles').findOne({
    filter: {
      id: profileId,
      status: 'active',
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
  if (!profile) {
    ctx.throw(409, 'Selected Agent Gateway profile is not active');
  }
  return profile;
}

async function resolveNodeAndProfile(
  ctx: Context,
  binding: ModelRecord,
  record: ModelRecord,
  collection: CollectionLike,
  viewAccess: CollectionActionAccess,
  transaction: Transaction,
) {
  const nodeField = getModelString(binding, 'nodeField');
  const profileField = getModelString(binding, 'agentProfileField');
  let nodeId = getOptionalModelId(binding, 'nodeId');
  let agentProfileId = getOptionalModelId(binding, 'agentProfileId');

  if (nodeField) {
    getCollectionField(ctx, collection, nodeField);
    assertReadableField(ctx, viewAccess, nodeField, 'node selection field');
    nodeId = getTargetIdFromRecord(record, collection, nodeField);
  }
  if (profileField) {
    getCollectionField(ctx, collection, profileField);
    assertReadableField(ctx, viewAccess, profileField, 'agent profile selection field');
    agentProfileId = getTargetIdFromRecord(record, collection, profileField);
  }

  const profile = await findActiveProfile(ctx, agentProfileId, transaction);
  if (profile) {
    await assertSelectableRecordVisible(
      ctx,
      'agAgentProfiles',
      String(getModelTargetKey(profile, 'id')),
      'Agent Gateway profile',
      transaction,
    );
  }
  if (profile && !nodeId) {
    nodeId = getOptionalModelId(profile, 'nodeId');
  }

  const node = await findActiveNode(ctx, nodeId, transaction);
  if (node) {
    await assertSelectableRecordVisible(
      ctx,
      'agNodes',
      String(getModelTargetKey(node, 'id')),
      'Agent Gateway node',
      transaction,
    );
  }
  if (profile && node && getOptionalModelId(profile, 'nodeId') !== String(getModelTargetKey(node, 'id'))) {
    ctx.throw(409, 'Selected Agent Gateway profile does not belong to the selected node');
  }

  return {
    nodeId: node ? String(getModelTargetKey(node, 'id')) : null,
    agentProfileId: profile ? String(getModelTargetKey(profile, 'id')) : null,
  };
}

async function findPromptTemplateForDispatch(ctx: Context, promptTemplateId: string, transaction: Transaction) {
  const template = (await ctx.db.getRepository('agPromptTemplates').findOne({
    filter: {
      id: promptTemplateId,
    },
    transaction,
  })) as ModelRecord | null;
  if (!template) {
    ctx.throw(400, 'Prompt template not found');
  }
  if (getModelString(template, 'status') !== ACTIVE_BINDING_STATUS) {
    ctx.throw(409, 'Prompt template is not active');
  }
  return template as ModelRecord;
}

async function findRunById(ctx: Context, runId: string, transaction: Transaction) {
  return (await ctx.db.getRepository('agRuns').findOne({
    filter: {
      id: runId,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

async function findVisibleRunById(ctx: Context, runId: string, transaction: Transaction) {
  return (await ctx.db.getRepository('agRuns').findOne({
    filter: await getVisibleRunFilter(
      ctx,
      {
        id: runId,
      },
      'get',
    ),
    transaction,
    lock: transaction.LOCK.UPDATE,
  })) as ModelRecord | null;
}

function getRunIdempotencyKey(run: ModelRecord) {
  const payload = getRecord(getModelValue(run, 'executionPayloadJson'));
  const dispatch = getRecord(payload.dispatch);
  return getString(dispatch.idempotencyKey);
}

function createDispatchResult(
  binding: ModelRecord,
  run: ModelRecord,
  options: {
    idempotent: boolean;
    sourceCollection: string;
    sourceRecordId: string;
    outputAgentRunField: string;
    relationUpdated: boolean;
  },
): DispatchResult {
  const runJson = serializeRun(run);
  const runId = String(getModelTargetKey(run, 'id'));
  return {
    bindingId: getModelTargetKey(binding, 'id'),
    bindingKey: getModelString(binding, 'bindingKey'),
    run: runJson,
    idempotent: options.idempotent,
    runId,
    runCode: getModelString(run, 'runCode'),
    agentSessionId: getString(runJson.agentSessionId) || null,
    sourceCollection: options.sourceCollection,
    sourceRecordId: options.sourceRecordId,
    outputAgentRunField: options.outputAgentRunField,
    relationUpdated: options.relationUpdated,
    deduped: options.idempotent,
  };
}

function getExistingRunResult(
  ctx: Context,
  binding: ModelRecord,
  existingRun: ModelRecord | null,
  idempotencyKey: string,
  sourceCollection: string,
  sourceRecordId: string,
  outputAgentRunField: string,
) {
  if (!existingRun) {
    ctx.throw(409, 'Output relation already references an Agent Gateway run');
  }

  if (idempotencyKey && getRunIdempotencyKey(existingRun) === idempotencyKey) {
    return createDispatchResult(binding, existingRun, {
      idempotent: true,
      sourceCollection,
      sourceRecordId,
      outputAgentRunField,
      relationUpdated: true,
    });
  }

  const status = getModelString(existingRun, 'status');
  if (NON_TERMINAL_RUN_STATUSES.has(status)) {
    ctx.throw(409, 'A non-terminal Agent Gateway run already exists for this record');
  }
  if (TERMINAL_RUN_STATUSES.has(status)) {
    ctx.throw(409, 'Retry for existing Agent Gateway dispatch runs is not implemented');
  }

  ctx.throw(409, 'Output relation already references an Agent Gateway run');
}

async function createDispatchRun(
  ctx: Context,
  binding: ModelRecord,
  record: ModelRecord,
  collection: CollectionLike,
  viewAccess: CollectionActionAccess,
  output: OutputRelation,
  recordId: string,
  idempotencyKey: string,
  transaction: Transaction,
): Promise<DispatchResult> {
  const collectionName = getBindingCollectionName(binding);
  const promptTemplateId = getRequiredString(ctx, getModelValue(binding, 'promptTemplateId'), 'promptTemplateId');
  const template = await findPromptTemplateForDispatch(ctx, promptTemplateId, transaction);
  const templateText = getModelString(template, 'templateText');
  const rendered = await renderPromptTemplate(ctx, {
    templateText,
    collectionName,
    recordId,
    transaction,
  });
  const nodeAndProfile = await resolveNodeAndProfile(ctx, binding, record, collection, viewAccess, transaction);
  const now = new Date();
  const fieldMappings = resolveMappedFieldValues(
    ctx,
    record,
    collection,
    viewAccess,
    getModelValue(binding, 'fieldMappingsJson'),
    'field mapping',
  );
  const skillSelections = await resolveSkillSelections(
    ctx,
    binding,
    record,
    collection,
    viewAccess,
    nodeAndProfile.nodeId,
    transaction,
  );
  const defaultPayload = getRecord(getModelValue(template, 'defaultExecutionPayloadJson'));
  const executionPayload = {
    ...defaultPayload,
    ...(!getString(defaultPayload.prompt) && !getString(defaultPayload.message)
      ? {
          prompt: rendered.renderedPrompt,
        }
      : {}),
    dispatch: {
      bindingId: getModelTargetKey(binding, 'id'),
      bindingKey: getModelString(binding, 'bindingKey'),
      collectionName,
      recordId,
      sourceCollection: collectionName,
      sourceRecordId: recordId,
      outputAgentRunField: output.fieldName,
      idempotencyKey: idempotencyKey || null,
    },
    fields: fieldMappings,
    skills: skillSelections.values,
    resolvedSkills: skillSelections.resolved,
  };

  const run = (await ctx.db.getRepository('agRuns').create({
    values: {
      runCode: `run_dispatch_${randomUUID()}`,
      status: CLAIMABLE_RUN_STATUS,
      claimAttempt: 0,
      leaseVersion: 0,
      cancelRequested: false,
      promptSnapshot: {
        templateId: getModelTargetKey(template, 'id'),
        templateKey: getModelString(template, 'templateKey'),
        templateText,
        renderedPrompt: rendered.renderedPrompt,
        variables: rendered.variables,
        renderedAt: now.toISOString(),
      },
      executionPayloadJson: executionPayload,
      sourceType: 'dispatch',
      sourceCollection: collectionName,
      sourceRecordId: recordId,
      requestedById: getCurrentUserId(ctx) || null,
      requestedAt: now,
      queuedAt: now,
      nodeId: nodeAndProfile.nodeId,
      agentProfileId: nodeAndProfile.agentProfileId,
      promptTemplateId: getModelTargetKey(template, 'id'),
      dispatchBindingId: getModelTargetKey(binding, 'id'),
    },
    transaction,
  })) as ModelRecord;

  const runId = String(getModelTargetKey(run, 'id'));
  try {
    await ctx.db.getRepository(collectionName).update({
      filterByTk: recordId,
      values: {
        [output.foreignKey]: runId,
      },
      transaction,
    });

    const updatedRecord = (await ctx.db.getRepository(collectionName).findOne({
      filterByTk: recordId,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!updatedRecord || getExistingRunId(updatedRecord, output) !== runId) {
      throw new Error('Relation writeback verification failed');
    }
  } catch (error) {
    throw createDispatchWritebackError(error);
  }

  return createDispatchResult(binding, run, {
    idempotent: false,
    sourceCollection: collectionName,
    sourceRecordId: recordId,
    outputAgentRunField: output.fieldName,
    relationUpdated: true,
  });
}

function getDispatchSelectionAppends(binding: ModelRecord, collection: CollectionLike) {
  const fieldNames = [
    getModelString(binding, 'agentProfileField'),
    getModelString(binding, 'nodeField'),
    ...getMappedFieldNames(getModelValue(binding, 'skillFieldsJson')),
  ].filter(Boolean);
  const relationFieldNames = fieldNames.filter((fieldName) => {
    const field = collection.getField?.(fieldName);
    return RELATION_FIELD_TYPES.has(getFieldOptionString(field, 'type'));
  });
  return Array.from(new Set(relationFieldNames));
}

async function listBindings(ctx: Context) {
  await requireManagePermission(ctx);

  const bindings = (await ctx.db.getRepository('agDispatchBindings').find({
    sort: ['bindingKey'],
  })) as ModelRecord[];

  ctx.body = bindings.map(serializeBinding);
}

async function getBinding(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const binding = await findBindingByIdentifier(ctx, identifier);
  if (!binding) {
    ctx.throw(404, 'Dispatch binding not found');
  }

  ctx.body = serializeBinding(binding);
}

async function createBinding(ctx: Context) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  const payload = getBindingPayload(ctx, values);
  await validateBindingPayload(ctx, payload);
  await ensureUniqueBindingKey(ctx, String(payload.bindingKey));

  const binding = (await ctx.db.getRepository('agDispatchBindings').create({
    values: {
      id: randomUUID(),
      ...payload,
    },
  })) as ModelRecord;

  ctx.body = serializeBinding(binding);
}

async function updateBinding(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const binding = await findBindingByIdentifier(ctx, identifier);
  if (!binding) {
    ctx.throw(404, 'Dispatch binding not found');
  }

  const values = getBodyValues(ctx);
  const payload = getBindingPayload(ctx, values, { partial: true, existing: binding });
  if (hasOwnKey(payload, 'bindingKey')) {
    await ensureUniqueBindingKey(ctx, String(payload.bindingKey), getModelTargetKey(binding, 'id'));
  }
  await validateBindingPayload(ctx, payload, { partial: true, existing: binding });

  await ctx.db.getRepository('agDispatchBindings').update({
    filterByTk: getModelTargetKey(binding, 'id'),
    values: payload,
  });

  const nextBindingKey = getString(payload.bindingKey) || getModelString(binding, 'bindingKey');
  const updatedBinding = await findBindingByKey(ctx, nextBindingKey);
  if (!updatedBinding) {
    ctx.throw(404, 'Dispatch binding not found');
  }

  ctx.body = serializeBinding(updatedBinding);
}

async function destroyBinding(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const binding = await findBindingByIdentifier(ctx, identifier);
  if (!binding) {
    ctx.throw(404, 'Dispatch binding not found');
  }

  await getCollectionModel(ctx, 'agDispatchBindings').destroy({
    where: {
      id: String(getModelTargetKey(binding, 'id')),
    },
  });

  ctx.body = {
    success: true,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

interface DispatchWritebackError extends Error {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  dispatchPhase?: 'relation-writeback';
  redactedSummary?: string;
}

function createDispatchWritebackError(error: unknown) {
  const writebackError = new Error('Failed to write Agent Gateway run relation') as DispatchWritebackError;
  writebackError.name = 'DispatchWritebackError';
  writebackError.status = 500;
  writebackError.statusCode = 500;
  writebackError.expose = true;
  writebackError.dispatchPhase = 'relation-writeback';
  writebackError.redactedSummary = redactText(getErrorMessage(error), {
    maxStringLength: 500,
  });
  return writebackError;
}

async function dispatchBinding(ctx: Context, identifier: string) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.dispatch,
    'Agent Gateway dispatch permission required',
  );

  const values = getBodyValues(ctx);
  const recordId = getRequiredTargetKey(ctx, values.sourceRecordId ?? values.recordId, 'sourceRecordId');
  const idempotencyKey = getString(values.idempotencyKey);
  const expectedCollectionName = getString(values.sourceCollection) || getString(values.expectedCollectionName);

  const result = await ctx.db.sequelize.transaction(async (transaction) => {
    const binding = await findBindingByIdentifier(ctx, identifier, transaction, { lock: true });
    if (!binding) {
      ctx.throw(404, 'Dispatch binding not found');
    }
    if (!getBindingEnabled(binding) || getModelString(binding, 'status') !== ACTIVE_BINDING_STATUS) {
      ctx.throw(409, 'Dispatch binding is not enabled');
    }

    const collectionName = getBindingCollectionName(binding);
    if (expectedCollectionName && expectedCollectionName !== collectionName) {
      ctx.throw(409, 'Dispatch binding does not match the current record collection');
    }

    const outputAgentRunField = getModelString(binding, 'outputAgentRunField');
    const output = assertOutputAgentRunField(ctx, collectionName, outputAgentRunField);
    const collection = getCollection(ctx, collectionName);
    const viewAccess = await getCollectionActionAccess(ctx, collectionName, 'view');
    const updateAccess = await getCollectionActionAccess(ctx, collectionName, 'update');
    assertWritableOutputField(ctx, updateAccess, output);

    const selectionAppends = getDispatchSelectionAppends(binding, collection);
    const targetRecord = (await ctx.db.getRepository(collectionName).findOne({
      filterByTk: recordId,
      filter: mergeFilters(viewAccess.filter, updateAccess.filter),
      ...(selectionAppends.length ? { appends: selectionAppends } : {}),
      transaction,
      lock: transaction.LOCK.UPDATE,
    })) as ModelRecord | null;
    if (!targetRecord) {
      ctx.throw(404, 'Dispatch target record not found');
    }

    const existingRunId = getExistingRunId(targetRecord, output);
    if (existingRunId) {
      const existingRun = await findRunById(ctx, existingRunId, transaction);
      if (existingRun) {
        const visibleRun = await findVisibleRunById(ctx, existingRunId, transaction);
        if (!visibleRun) {
          ctx.throw(404, {
            code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
            message: 'Run not found',
          });
        }
        return getExistingRunResult(
          ctx,
          binding,
          visibleRun,
          idempotencyKey,
          collectionName,
          recordId,
          output.fieldName,
        );
      }
      return getExistingRunResult(
        ctx,
        binding,
        existingRun,
        idempotencyKey,
        collectionName,
        recordId,
        output.fieldName,
      );
    }

    return await createDispatchRun(
      ctx,
      binding,
      targetRecord,
      collection,
      viewAccess,
      output,
      recordId,
      idempotencyKey,
      transaction,
    );
  });

  ctx.body = result;
}

function createValidationHookContext(plugin: Plugin): Context {
  return {
    app: plugin.app,
    db: plugin.db,
    throw(status: number, message: string) {
      const error = new Error(message) as Error & { status?: number; statusCode?: number; expose?: boolean };
      error.status = status;
      error.statusCode = status;
      error.expose = status < 500;
      throw error;
    },
  } as unknown as Context;
}

export function registerDispatchBindingValidationHooks(plugin: Plugin) {
  plugin.db.on('agDispatchBindings.beforeSave', async (model: ModelRecord, options: HookOptions) => {
    await validateBindingRecord(createValidationHookContext(plugin), model, options?.transaction);
  });
}

export function registerDispatchBindingRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const getBindingMatch = routePath.match(/^\/dispatch-bindings:get\/([^/]+)$/);
      const updateBindingMatch = routePath.match(/^\/dispatch-bindings:update\/([^/]+)$/);
      const destroyBindingMatch = routePath.match(/^\/dispatch-bindings:destroy\/([^/]+)$/);
      const dispatchMatch =
        routePath.match(/^\/dispatch-bindings\/([^/]+)\/dispatch$/) ||
        routePath.match(/^\/dispatch-bindings\/([^/]+):dispatch$/);

      if (ctx.method === 'GET' && routePath === '/dispatch-bindings:list') {
        await listBindings(ctx);
        return;
      }

      if (ctx.method === 'GET' && getBindingMatch) {
        await getBinding(ctx, getBindingMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/dispatch-bindings:create') {
        await createBinding(ctx);
        return;
      }

      if (ctx.method === 'POST' && updateBindingMatch) {
        await updateBinding(ctx, updateBindingMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && destroyBindingMatch) {
        await destroyBinding(ctx, destroyBindingMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && dispatchMatch) {
        await dispatchBinding(ctx, dispatchMatch[1]);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayDispatchBindingRoutes',
      after: 'agentGatewayPromptTemplateRoutes',
      before: 'dataSource',
    },
  );
}
