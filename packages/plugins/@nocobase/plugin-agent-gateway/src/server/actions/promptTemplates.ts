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

import { REDACTED_VALUE, redactText, shouldRedactKey } from '../security';
import {
  API_PREFIX,
  JsonRecord,
  ModelRecord,
  getBodyValues,
  getCurrentRoleNames,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  hasModelGetter,
  requireManagePermission,
} from './utils';

const TEMPLATE_STATUS_VALUES = new Set(['active', 'disabled']);
const TEMPLATE_PATH_SEGMENT_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TEMPLATE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface CollectionLike {
  hasField?(name: string): boolean;
  getField?(name: string): unknown;
  filterTargetKey?: string | string[] | null;
  model?: {
    primaryKeyAttribute?: string;
    primaryKeyAttributes?: string[];
    rawAttributes?: Record<string, { primaryKey?: boolean }>;
  };
}

interface DatabaseWithCollections {
  getCollection?(name: string): CollectionLike | undefined;
}

interface TemplateToken {
  raw: string;
  expression: string;
  index: number;
  length: number;
  root: 'record' | 'user' | 'now';
  path: string[];
}

interface TemplatePayloadOptions {
  partial?: boolean;
}

interface RenderPromptOptions {
  templateText: string;
  collectionName?: string;
  recordId?: string | number | bigint;
  now?: Date;
  transaction?: Transaction;
}

interface CollectionAccess {
  collectionName: string;
  filter?: JsonRecord;
  selectableFields: Set<string> | null;
}

interface RenderAccess {
  root: CollectionAccess | null;
  relations: Map<string, CollectionAccess>;
}

function hasOwnKey(values: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(values, key);
}

function getObjectLike(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getFieldOption(field: unknown, key: string) {
  const fieldRecord = getObjectLike(field);
  const options = getObjectLike(fieldRecord.options);
  return options[key] ?? fieldRecord[key];
}

function getFieldOptionString(field: unknown, key: string) {
  return getString(getFieldOption(field, key));
}

function getFieldOptionBoolean(field: unknown, key: string) {
  return getFieldOption(field, key) === true;
}

function getCollection(ctx: Context, collectionName: string) {
  const collection = (ctx.db as unknown as DatabaseWithCollections).getCollection?.(collectionName);
  if (!collection) {
    ctx.throw(400, `Collection not found: ${collectionName}`);
  }
  return collection;
}

function getCollectionField(ctx: Context, collection: CollectionLike, fieldName: string, expression: string) {
  const hasField = collection.hasField ? collection.hasField(fieldName) : Boolean(collection.getField?.(fieldName));
  if (!hasField) {
    ctx.throw(400, `Unknown template variable: ${expression}`);
  }

  const field = collection.getField?.(fieldName);
  if (!field) {
    ctx.throw(400, `Unknown template variable: ${expression}`);
  }

  return field;
}

function pushIdentityCandidate(candidates: string[][], keys: string[]) {
  const normalizedKeys = keys.filter(Boolean);
  if (!normalizedKeys.length) {
    return;
  }

  if (
    !candidates.some(
      (candidate) =>
        candidate.length === normalizedKeys.length && candidate.every((key) => normalizedKeys.includes(key)),
    )
  ) {
    candidates.push(normalizedKeys);
  }
}

function getCollectionIdentityKeyCandidates(collection: CollectionLike) {
  const candidates: string[][] = [];
  const rawPrimaryKeys = Object.entries(collection.model?.rawAttributes || {})
    .filter(([, attribute]) => attribute.primaryKey === true)
    .map(([name]) => name);
  pushIdentityCandidate(candidates, rawPrimaryKeys);

  const primaryKeyAttributes = collection.model?.primaryKeyAttributes;
  if (Array.isArray(primaryKeyAttributes) && primaryKeyAttributes.length) {
    pushIdentityCandidate(candidates, primaryKeyAttributes);
  }

  const primaryKey = collection.model?.primaryKeyAttribute;
  if (primaryKey) {
    pushIdentityCandidate(candidates, [primaryKey]);
  }

  const filterTargetKey = collection.filterTargetKey;
  if (Array.isArray(filterTargetKey) && filterTargetKey.length) {
    pushIdentityCandidate(candidates, filterTargetKey);
  } else if (typeof filterTargetKey === 'string' && filterTargetKey) {
    pushIdentityCandidate(candidates, [filterTargetKey]);
  }

  return candidates;
}

function hasFilter(filter?: JsonRecord) {
  return Boolean(filter && Object.keys(filter).length);
}

function mergeFilters(...filters: Array<JsonRecord | undefined>) {
  const activeFilters = filters.filter((filter): filter is JsonRecord => hasFilter(filter));
  if (activeFilters.length === 0) {
    return {};
  }
  if (activeFilters.length === 1) {
    return activeFilters[0];
  }
  return {
    $and: activeFilters,
  };
}

function getCollectionIdentityFilter(ctx: Context, collection: CollectionLike, value: unknown, expression: string) {
  const identityKeyCandidates = getCollectionIdentityKeyCandidates(collection);
  if (!identityKeyCandidates.length) {
    ctx.throw(403, `No permission to preview template variable: ${expression}`);
  }

  for (const identityKeys of identityKeyCandidates) {
    const identityFilter: JsonRecord = {};
    let complete = true;
    for (const identityKey of identityKeys) {
      const identityValue = getRecordLikeValue(value, identityKey);
      if (identityValue === undefined || identityValue === null || getString(identityValue) === '') {
        complete = false;
        break;
      }
      identityFilter[identityKey] = identityValue;
    }

    if (complete) {
      return identityFilter;
    }
  }

  ctx.throw(403, `No permission to preview template variable: ${expression}`);
}

function isSecretField(fieldName: string, field: unknown) {
  const type = getFieldOptionString(field, 'type').toLowerCase();
  const fieldInterface = getFieldOptionString(field, 'interface').toLowerCase();
  return (
    shouldRedactKey(fieldName) ||
    ['password', 'encryption'].includes(type) ||
    ['password', 'encryption'].includes(fieldInterface) ||
    getFieldOptionBoolean(field, 'secret') ||
    getFieldOptionBoolean(field, 'isSecret') ||
    getFieldOptionBoolean(field, 'sensitive')
  );
}

function stringifyRenderedValue(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

function renderFieldValue(fieldName: string, field: unknown, value: unknown) {
  if (isSecretField(fieldName, field)) {
    return REDACTED_VALUE;
  }

  return redactText(stringifyRenderedValue(value));
}

function getObjectValue(value: unknown, key: string) {
  return getObjectLike(value)[key];
}

function getRecordLikeValue(value: unknown, key: string) {
  if (hasModelGetter(value)) {
    return getModelValue(value, key);
  }
  return getObjectValue(value, key);
}

function getSelectableFields(params: JsonRecord) {
  const fields = Array.isArray(params.fields) ? params.fields : [];
  const appends = Array.isArray(params.appends) ? params.appends : [];
  if (!fields.length && !appends.length) {
    return null;
  }

  const selectableFields = new Set<string>();
  for (const value of [...fields, ...appends]) {
    const fieldName = getString(value).split('.')[0];
    if (fieldName) {
      selectableFields.add(fieldName);
    }
  }
  return selectableFields;
}

function assertSelectableField(ctx: Context, access: CollectionAccess, fieldName: string, expression: string) {
  if (access.selectableFields && !access.selectableFields.has(fieldName)) {
    ctx.throw(403, `No permission to preview template variable: ${expression}`);
  }
}

function serializeTemplate(template: ModelRecord) {
  return getModelJson(template);
}

function getTemplateStatus(ctx: Context, value: unknown, fallback = 'active') {
  const status = getString(value) || fallback;
  if (!TEMPLATE_STATUS_VALUES.has(status)) {
    ctx.throw(400, 'Template status must be active or disabled');
  }
  return status;
}

function getRequiredTemplateText(ctx: Context, value: unknown) {
  const templateText = typeof value === 'string' ? value : '';
  if (!templateText.trim()) {
    ctx.throw(400, 'templateText is required');
  }
  return templateText;
}

function getRequiredTemplateKey(ctx: Context, value: unknown) {
  const templateKey = getString(value);
  if (!templateKey) {
    ctx.throw(400, 'templateKey is required');
  }
  if (!TEMPLATE_KEY_PATTERN.test(templateKey)) {
    ctx.throw(
      400,
      'templateKey must start with a letter and contain only letters, numbers, underscore, dot, colon, or hyphen',
    );
  }
  return templateKey;
}

function getRecordIdString(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return getString(value);
}

function getTemplatePayload(ctx: Context, values: JsonRecord, options: TemplatePayloadOptions = {}) {
  const payload: JsonRecord = {};

  if (!options.partial || hasOwnKey(values, 'templateKey')) {
    payload.templateKey = getRequiredTemplateKey(ctx, values.templateKey);
  }
  if (!options.partial || hasOwnKey(values, 'templateText')) {
    payload.templateText = getRequiredTemplateText(ctx, values.templateText);
  }
  if (hasOwnKey(values, 'displayName')) {
    payload.displayName = getString(values.displayName) || String(payload.templateKey || '');
  } else if (!options.partial) {
    payload.displayName = String(payload.templateKey || '');
  }
  if (hasOwnKey(values, 'description')) {
    payload.description = typeof values.description === 'string' ? values.description : '';
  } else if (!options.partial) {
    payload.description = '';
  }
  if (hasOwnKey(values, 'status') || !options.partial) {
    payload.status = getTemplateStatus(ctx, values.status);
  }
  if (hasOwnKey(values, 'variablesSchemaJson') || hasOwnKey(values, 'variablesSchema')) {
    payload.variablesSchemaJson = getRecord(values.variablesSchemaJson || values.variablesSchema);
  } else if (!options.partial) {
    payload.variablesSchemaJson = {};
  }
  if (hasOwnKey(values, 'defaultExecutionPayloadJson') || hasOwnKey(values, 'defaultExecutionPayload')) {
    payload.defaultExecutionPayloadJson = getRecord(
      values.defaultExecutionPayloadJson || values.defaultExecutionPayload,
    );
  } else if (!options.partial) {
    payload.defaultExecutionPayloadJson = {};
  }
  if (hasOwnKey(values, 'metadataJson') || hasOwnKey(values, 'metadata')) {
    payload.metadataJson = getRecord(values.metadataJson || values.metadata);
  } else if (!options.partial) {
    payload.metadataJson = {};
  }
  if (hasOwnKey(values, 'defaultAgentProfileId')) {
    payload.defaultAgentProfileId = getString(values.defaultAgentProfileId) || null;
  }

  return payload;
}

async function findTemplateByKey(ctx: Context, templateKey: string) {
  return (await ctx.db.getRepository('agPromptTemplates').findOne({
    filter: {
      templateKey,
    },
  })) as ModelRecord | null;
}

async function findTemplateByIdentifier(ctx: Context, identifier: unknown) {
  let value = getString(identifier);
  try {
    value = decodeURIComponent(value);
  } catch {
    ctx.throw(400, 'Invalid prompt template identifier');
  }
  if (!value) {
    return null;
  }

  if (UUID_PATTERN.test(value)) {
    return (await ctx.db.getRepository('agPromptTemplates').findOne({
      filterByTk: value,
    })) as ModelRecord | null;
  }

  return await findTemplateByKey(ctx, value);
}

async function ensureUniqueTemplateKey(ctx: Context, templateKey: string, currentId?: unknown) {
  const existing = await findTemplateByKey(ctx, templateKey);
  if (existing && String(getModelTargetKey(existing, 'id')) !== String(currentId || '')) {
    ctx.throw(409, 'templateKey already exists');
  }
}

function pushTemplateToken(ctx: Context, tokens: TemplateToken[], raw: string, expression: string, index: number) {
  if (!expression) {
    ctx.throw(400, 'Template variable cannot be empty');
  }
  if (expression.includes('{{') || expression.includes('}}')) {
    ctx.throw(400, `Unsupported template variable syntax: ${expression}`);
  }

  const path = expression.split('.').map((segment) => segment.trim());
  if (!path.every((segment) => TEMPLATE_PATH_SEGMENT_PATTERN.test(segment))) {
    ctx.throw(400, `Unsupported template variable syntax: ${expression}`);
  }

  const [root] = path;
  if (root === 'now') {
    if (path.length !== 1) {
      ctx.throw(400, `Unsupported template variable syntax: ${expression}`);
    }
    tokens.push({
      raw,
      expression,
      index,
      length: raw.length,
      root,
      path,
    });
    return;
  }

  if (root === 'user') {
    if (path.length !== 2) {
      ctx.throw(400, `Unsupported template variable syntax: ${expression}`);
    }
    tokens.push({
      raw,
      expression,
      index,
      length: raw.length,
      root,
      path,
    });
    return;
  }

  if (root === 'record') {
    if (![2, 3].includes(path.length)) {
      ctx.throw(400, `Unsupported template variable syntax: ${expression}`);
    }
    tokens.push({
      raw,
      expression,
      index,
      length: raw.length,
      root,
      path,
    });
    return;
  }

  ctx.throw(400, `Unknown template variable: ${expression}`);
}

function parseTemplateTokens(ctx: Context, templateText: string) {
  const tokens: TemplateToken[] = [];
  let cursor = 0;

  while (cursor < templateText.length) {
    const nextOpen = templateText.indexOf('{{', cursor);
    const nextClose = templateText.indexOf('}}', cursor);
    if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen)) {
      ctx.throw(400, 'Unsupported template variable syntax: stray closing delimiter');
    }
    if (nextOpen === -1) {
      break;
    }

    const close = templateText.indexOf('}}', nextOpen + 2);
    if (close === -1) {
      ctx.throw(400, 'Unsupported template variable syntax: unclosed template variable');
    }

    const raw = templateText.slice(nextOpen, close + 2);
    const expression = templateText.slice(nextOpen + 2, close).trim();
    pushTemplateToken(ctx, tokens, raw, expression, nextOpen);
    cursor = close + 2;
  }

  return tokens;
}

async function getCollectionAccess(ctx: Context, collectionName: string): Promise<CollectionAccess> {
  const collection = getCollection(ctx, collectionName);
  const roles = await getCurrentRoleNames(ctx);
  const permission = ctx.app.acl.can({
    roles,
    resource: collectionName,
    action: 'view',
  });

  if (!permission || typeof permission !== 'object') {
    ctx.throw(403, `No permission to preview collection: ${collectionName}`);
  }

  const params = getRecord(permission.params);
  try {
    checkFilterParams(collection, params.filter);
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, `No permission to preview collection: ${collectionName}`);
    }
    throw error;
  }

  const parsedParams = params
    ? getRecord(
        await parseJsonTemplate(params, {
          state: ctx.state,
          timezone: ctx.get('x-timezone'),
          userProvider: createUserProvider({
            db: ctx.db,
            currentUser: ctx.state.currentUser,
          }),
        }),
      )
    : {};

  return {
    collectionName,
    filter: getRecord(parsedParams.filter),
    selectableFields: getSelectableFields(parsedParams),
  };
}

function validateRecordTokens(ctx: Context, collectionName: string, tokens: TemplateToken[]) {
  const collection = getCollection(ctx, collectionName);
  const relationNames = new Set<string>();

  for (const token of tokens) {
    if (token.root !== 'record') {
      continue;
    }

    if (token.path.length === 2) {
      getCollectionField(ctx, collection, token.path[1], token.expression);
      continue;
    }

    const relationField = getCollectionField(ctx, collection, token.path[1], token.expression);
    const targetCollectionName = getFieldOptionString(relationField, 'target');
    if (!targetCollectionName) {
      ctx.throw(400, `Unknown template variable: ${token.expression}`);
    }
    const targetCollection = getCollection(ctx, targetCollectionName);
    getCollectionField(ctx, targetCollection, token.path[2], token.expression);
    relationNames.add(token.path[1]);
  }

  return relationNames;
}

async function getRenderAccess(ctx: Context, collectionName: string, tokens: TemplateToken[]) {
  const root = await getCollectionAccess(ctx, collectionName);
  const collection = getCollection(ctx, collectionName);
  const relations = new Map<string, CollectionAccess>();

  for (const token of tokens) {
    if (token.root !== 'record') {
      continue;
    }

    const rootFieldName = token.path[1];
    assertSelectableField(ctx, root, rootFieldName, token.expression);
    if (token.path.length !== 3 || relations.has(rootFieldName)) {
      continue;
    }

    const relationField = getCollectionField(ctx, collection, rootFieldName, token.expression);
    const targetCollectionName = getFieldOptionString(relationField, 'target');
    const targetAccess = await getCollectionAccess(ctx, targetCollectionName);
    assertSelectableField(ctx, targetAccess, token.path[2], token.expression);
    relations.set(rootFieldName, targetAccess);
  }

  return {
    root,
    relations,
  };
}

function validateUserTokens(ctx: Context, tokens: TemplateToken[]) {
  if (!tokens.some((token) => token.root === 'user')) {
    return;
  }

  const usersCollection = getCollection(ctx, 'users');
  for (const token of tokens) {
    if (token.root === 'user') {
      getCollectionField(ctx, usersCollection, token.path[1], token.expression);
    }
  }
}

async function getRenderRecord(
  ctx: Context,
  collectionName: string,
  recordId: string | number,
  relationNames: Set<string>,
  access: CollectionAccess,
  transaction?: Transaction,
) {
  const findOptions: JsonRecord = {
    filterByTk: recordId,
  };
  if (access.filter && Object.keys(access.filter).length) {
    findOptions.filter = access.filter;
  }
  if (relationNames.size) {
    findOptions.appends = Array.from(relationNames);
  }
  if (transaction) {
    findOptions.transaction = transaction;
  }

  const record = (await ctx.db.getRepository(collectionName).findOne(findOptions)) as ModelRecord | null;
  if (!record) {
    ctx.throw(404, 'Preview record not found');
  }

  return record;
}

async function assertCollectionRecordAllowed(
  ctx: Context,
  access: CollectionAccess,
  recordValue: unknown,
  expression: string,
  transaction?: Transaction,
) {
  if (!hasFilter(access.filter) || !recordValue) {
    return;
  }

  const targetCollection = getCollection(ctx, access.collectionName);
  const identityFilter = getCollectionIdentityFilter(ctx, targetCollection, recordValue, expression);
  const allowedCount = await ctx.db.getRepository(access.collectionName).count({
    filter: mergeFilters(identityFilter, access.filter),
    transaction,
  });
  if (!allowedCount) {
    ctx.throw(403, `No permission to preview template variable: ${expression}`);
  }
}

async function getUserRenderAccess(ctx: Context, tokens: TemplateToken[]) {
  const access = await getCollectionAccess(ctx, 'users');
  for (const token of tokens) {
    if (token.root === 'user') {
      assertSelectableField(ctx, access, token.path[1], token.expression);
    }
  }

  const currentUser = ctx.state.currentUser;
  if (!currentUser) {
    ctx.throw(403, 'No permission to preview current user');
  }

  await assertCollectionRecordAllowed(ctx, access, currentUser, 'user');
  return access;
}

function getCurrentUserJson(ctx: Context) {
  const currentUser = ctx.state.currentUser;
  if (hasModelGetter(currentUser)) {
    return getModelJson(currentUser);
  }
  return getRecord(currentUser);
}

function getCurrentUserFieldValue(ctx: Context, fieldName: string, expression: string, access: CollectionAccess) {
  assertSelectableField(ctx, access, fieldName, expression);
  const usersCollection = getCollection(ctx, 'users');
  const field = getCollectionField(ctx, usersCollection, fieldName, expression);
  const currentUser = ctx.state.currentUser;
  const value = hasModelGetter(currentUser)
    ? getModelValue(currentUser, fieldName)
    : getCurrentUserJson(ctx)[fieldName];
  return renderFieldValue(fieldName, field, value);
}

async function getRecordFieldValue(
  ctx: Context,
  collectionName: string,
  record: ModelRecord,
  token: TemplateToken,
  access: RenderAccess,
  transaction?: Transaction,
) {
  const collection = getCollection(ctx, collectionName);
  const recordJson = getModelJson(record);

  if (token.path.length === 2) {
    const fieldName = token.path[1];
    const field = getCollectionField(ctx, collection, fieldName, token.expression);
    const value = getObjectValue(recordJson, fieldName) ?? getModelValue(record, fieldName);
    return renderFieldValue(fieldName, field, value);
  }

  const relationName = token.path[1];
  const leafFieldName = token.path[2];
  const relationField = getCollectionField(ctx, collection, relationName, token.expression);
  const targetCollectionName = getFieldOptionString(relationField, 'target');
  const targetCollection = getCollection(ctx, targetCollectionName);
  const leafField = getCollectionField(ctx, targetCollection, leafFieldName, token.expression);
  const relationValue = getObjectValue(recordJson, relationName) ?? getModelValue(record, relationName);
  const relationAccess = access.relations.get(relationName);

  if (Array.isArray(relationValue)) {
    const values: string[] = [];
    for (const item of relationValue) {
      if (relationAccess) {
        await assertCollectionRecordAllowed(ctx, relationAccess, item, token.expression, transaction);
      }
      values.push(renderFieldValue(leafFieldName, leafField, getRecordLikeValue(item, leafFieldName)));
    }
    return values.join(', ');
  }

  if (relationAccess) {
    await assertCollectionRecordAllowed(ctx, relationAccess, relationValue, token.expression, transaction);
  }
  return renderFieldValue(leafFieldName, leafField, getRecordLikeValue(relationValue, leafFieldName));
}

export async function renderPromptTemplate(ctx: Context, options: RenderPromptOptions) {
  const tokens = parseTemplateTokens(ctx, options.templateText);
  validateUserTokens(ctx, tokens);

  const recordTokens = tokens.filter((token) => token.root === 'record');
  let record: ModelRecord | null = null;
  let collectionName = '';
  let access: RenderAccess = {
    root: null,
    relations: new Map(),
  };
  let userAccess: CollectionAccess | null = null;
  if (recordTokens.length) {
    collectionName = getString(options.collectionName);
    const recordId = getRecordIdString(options.recordId);
    if (!collectionName || !recordId) {
      ctx.throw(400, 'collectionName and recordId are required for record variables');
    }

    const relationNames = validateRecordTokens(ctx, collectionName, recordTokens);
    access = await getRenderAccess(ctx, collectionName, recordTokens);
    record = await getRenderRecord(ctx, collectionName, recordId, relationNames, access.root, options.transaction);
  }
  const userTokens = tokens.filter((token) => token.root === 'user');
  if (userTokens.length) {
    userAccess = await getUserRenderAccess(ctx, userTokens);
  }

  const now = options.now || new Date();
  const variables: Array<{ expression: string; value: string }> = [];
  let renderedPrompt = '';
  let lastIndex = 0;

  for (const token of tokens) {
    renderedPrompt += options.templateText.slice(lastIndex, token.index);

    let value = '';
    if (token.root === 'now') {
      value = now.toISOString();
    } else if (token.root === 'user' && userAccess) {
      value = getCurrentUserFieldValue(ctx, token.path[1], token.expression, userAccess);
    } else if (record) {
      value = await getRecordFieldValue(ctx, collectionName, record, token, access, options.transaction);
    }

    variables.push({
      expression: token.expression,
      value,
    });
    renderedPrompt += value;
    lastIndex = token.index + token.length;
  }

  renderedPrompt += options.templateText.slice(lastIndex);

  return {
    renderedPrompt,
    variables,
  };
}

async function listTemplates(ctx: Context) {
  await requireManagePermission(ctx);

  const templates = (await ctx.db.getRepository('agPromptTemplates').find({
    sort: ['templateKey'],
  })) as ModelRecord[];

  ctx.body = templates.map(serializeTemplate);
}

async function getTemplate(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const template = await findTemplateByIdentifier(ctx, identifier);
  if (!template) {
    ctx.throw(404, 'Prompt template not found');
  }

  ctx.body = serializeTemplate(template);
}

async function createTemplate(ctx: Context) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  const payload = getTemplatePayload(ctx, values);
  await ensureUniqueTemplateKey(ctx, String(payload.templateKey));

  const template = (await ctx.db.getRepository('agPromptTemplates').create({
    values: {
      id: randomUUID(),
      ...payload,
    },
  })) as ModelRecord;

  ctx.body = serializeTemplate(template);
}

async function updateTemplate(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const template = await findTemplateByIdentifier(ctx, identifier);
  if (!template) {
    ctx.throw(404, 'Prompt template not found');
  }

  const values = getBodyValues(ctx);
  const payload = getTemplatePayload(ctx, values, { partial: true });
  const templateKey = getString(payload.templateKey);
  if (templateKey) {
    await ensureUniqueTemplateKey(ctx, templateKey, getModelTargetKey(template, 'id'));
  }

  await ctx.db.getRepository('agPromptTemplates').update({
    filterByTk: getModelTargetKey(template, 'id'),
    values: payload,
  });

  await getTemplate(ctx, String(getModelTargetKey(template, 'id')));
}

async function destroyTemplate(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const template = await findTemplateByIdentifier(ctx, identifier);
  if (!template) {
    ctx.throw(404, 'Prompt template not found');
  }

  await ctx.db.getRepository('agPromptTemplates').destroy({
    filterByTk: getModelTargetKey(template, 'id'),
  });

  ctx.body = {
    success: true,
  };
}

async function previewTemplate(ctx: Context) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  let templateText = typeof values.templateText === 'string' ? values.templateText : '';
  let template: ModelRecord | null = null;
  if (!templateText.trim()) {
    template = await findTemplateByIdentifier(ctx, values.templateId || values.templateKey);
    if (!template) {
      ctx.throw(404, 'Prompt template not found');
    }
    templateText = getModelString(template, 'templateText');
  }

  if (!templateText.trim()) {
    ctx.throw(400, 'templateText is required');
  }

  const result = await renderPromptTemplate(ctx, {
    templateText,
    collectionName: getString(values.collectionName),
    recordId: getRecordIdString(values.recordId),
  });

  ctx.body = {
    templateId: template ? getModelTargetKey(template, 'id') : null,
    templateKey: template ? getModelString(template, 'templateKey') : getString(values.templateKey),
    ...result,
  };
}

export function registerPromptTemplateRoutes(plugin: Plugin) {
  plugin.app.use(
    async (ctx: Context, next: Next) => {
      if (!ctx.path.startsWith(API_PREFIX)) {
        await next();
        return;
      }

      const routePath = ctx.path.slice(API_PREFIX.length);
      const getTemplateMatch = routePath.match(/^\/prompt-templates:get\/([^/]+)$/);
      const updateTemplateMatch = routePath.match(/^\/prompt-templates:update\/([^/]+)$/);
      const destroyTemplateMatch = routePath.match(/^\/prompt-templates:destroy\/([^/]+)$/);

      if (ctx.method === 'GET' && routePath === '/prompt-templates:list') {
        await listTemplates(ctx);
        return;
      }

      if (ctx.method === 'GET' && getTemplateMatch) {
        await getTemplate(ctx, getTemplateMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/prompt-templates:create') {
        await createTemplate(ctx);
        return;
      }

      if (ctx.method === 'POST' && updateTemplateMatch) {
        await updateTemplate(ctx, updateTemplateMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && destroyTemplateMatch) {
        await destroyTemplate(ctx, destroyTemplateMatch[1]);
        return;
      }

      if (ctx.method === 'POST' && routePath === '/prompt-templates:preview') {
        await previewTemplate(ctx);
        return;
      }

      await next();
    },
    {
      tag: 'agentGatewayPromptTemplateRoutes',
      after: 'agentGatewayRunObservabilityRoutes',
      before: 'dataSource',
    },
  );
}
