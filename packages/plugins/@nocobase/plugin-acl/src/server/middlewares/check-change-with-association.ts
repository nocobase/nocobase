/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, NoPermissionError } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { Database } from '@nocobase/database';
import _ from 'lodash';

/**
 * Pick only record key fields from given value(s).
 */
function normalizeAssociationValue(
  value: any,
  recordKey: string,
): Record<string, any> | Record<string, any>[] | undefined {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    const result = value.map((v) => v[recordKey]).filter((v) => v !== null && v !== undefined);
    return result.length > 0 ? result : undefined;
  } else {
    return value[recordKey];
  }
}

async function resolveScopeFilter(ctx: Context, target: string, params?: any) {
  if (!params) {
    return {};
  }

  const filteredParams = ctx.acl.filterParams(ctx, target, params);
  const parsedParams = await ctx.acl.parseJsonTemplate(filteredParams, ctx);
  return parsedParams.filter || {};
}

async function collectAllowedRecordKeys(
  ctx: Context,
  items: any[],
  recordKey: string,
  updateParams: any,
  target: string,
): Promise<Set<any> | undefined> {
  const repo = ctx.db.getRepository(target);
  if (!repo) {
    return undefined;
  }

  const keys = items
    .map((item) => (_.isPlainObject(item) ? item[recordKey] : undefined))
    .filter((key) => key !== undefined && key !== null);

  if (!keys.length) {
    return undefined;
  }

  try {
    const scopedFilter = await resolveScopeFilter(ctx, target, updateParams?.params);
    const records = await repo.find({
      filter: {
        ...scopedFilter,
        [`${recordKey}.$in`]: keys,
      },
    });

    const allowedKeys = new Set<any>();
    for (const record of records) {
      const key = typeof record.get === 'function' ? record.get(recordKey) : record[recordKey];
      if (key !== undefined && key !== null) {
        allowedKeys.add(key);
      }
    }
    return allowedKeys;
  } catch (e) {
    if (e instanceof NoPermissionError) {
      return new Set();
    }
    throw e;
  }
}

/**
 * Process nested association values recursively if creation is allowed.
 */
async function processAssociationChild(
  ctx: Context,
  value: Record<string, any>,
  recordKey: string,
  updateAssociationValues: string[],
  createParams: any,
  updateParams: any,
  target: string,
  fieldPath: string,
  allowedRecordKeys?: Set<any>,
): Promise<Record<string, any> | string | number | null> {
  // Case 1: Existing record → potential update
  if (value?.[recordKey]) {
    if (!updateParams) {
      // No update permission, skip
      ctx.log.debug(`No permission to update association`, { fieldPath, value, updateParams });
      return value[recordKey];
    } else {
      const repo = ctx.db.getRepository(target);
      if (!repo) {
        return value[recordKey];
      }
      try {
        if (allowedRecordKeys) {
          if (!allowedRecordKeys.has(value[recordKey])) {
            ctx.log.debug(`No permission to update association due to scope`, { fieldPath, value, updateParams });
            return value[recordKey];
          }
        } else {
          const filter = await resolveScopeFilter(ctx, target, updateParams.params);
          const record = await repo.findOne({
            filter: {
              ...filter,
              [recordKey]: value[recordKey],
            },
          });
          if (!record) {
            ctx.log.debug(`No permission to update association due to scope`, { fieldPath, value, updateParams });
            return value[recordKey];
          }
        }
        return await processValues(ctx, value, updateAssociationValues, updateParams.params, target, fieldPath);
      } catch (e) {
        if (e instanceof NoPermissionError) {
          return value[recordKey];
        }
        throw e;
      }
    }
  }

  // Case 2: New record → potential create
  if (createParams) {
    return await processValues(ctx, value, updateAssociationValues, createParams.params, target, fieldPath);
  }

  // Case 3: Neither create nor update is allowed
  ctx.log.debug(`No permission to create association`, { fieldPath, value, createParams });
  return null;
}

/**
 * Recursively process values based on ACL and association rules.
 */
async function processValues(
  ctx: Context,
  values: Record<string, any> | Record<string, any>[],
  updateAssociationValues: string[],
  aclParams: any,
  collectionName: string,
  lastFieldPath = '',
  protectedKeys: string[] = [],
) {
  // Case: array of items → process each item
  if (Array.isArray(values)) {
    const result = [];

    for (const item of values) {
      if (!_.isPlainObject(item)) {
        // Non-object items are returned as-is
        result.push(item);
        continue;
      }

      const processed = await processValues(
        ctx,
        item,
        updateAssociationValues,
        aclParams,
        collectionName,
        lastFieldPath,
        protectedKeys,
      );

      if (processed !== null && processed !== undefined) {
        result.push(processed);
      }
    }

    return result;
  }

  const db: Database = ctx.database;
  const collection = db.getCollection(collectionName);

  if (!collection) {
    return values;
  }

  // Whitelist: protectedKeys must never be removed
  if (aclParams?.whitelist) {
    const combined = _.uniq([...aclParams.whitelist, ...protectedKeys]);
    values = _.pick(values, combined);
  }

  for (const [fieldName, fieldValue] of Object.entries(values)) {
    // Skip protected fields
    if (protectedKeys.includes(fieldName)) {
      continue;
    }

    const field = collection.getField(fieldName);
    const isAssociation =
      field && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(field.type);

    if (!isAssociation) {
      continue;
    }

    const targetCollection = db.getCollection(field.target);
    if (!targetCollection) {
      delete values[fieldName];
      continue;
    }

    const fieldPath = lastFieldPath ? `${lastFieldPath}.${fieldName}` : fieldName;
    const recordKey = field.type === 'hasOne' ? targetCollection.model.primaryKeyAttribute : field.targetKey;

    const canUpdateAssociation = updateAssociationValues.includes(fieldPath);

    // Association cannot update → only keep key(s)
    if (!canUpdateAssociation) {
      const normalized = normalizeAssociationValue(fieldValue, recordKey);

      if (normalized === undefined && !protectedKeys.includes(fieldName)) {
        delete values[fieldName];
      } else {
        values[fieldName] = normalized;
      }

      ctx.log.debug(`Not allow to update association, only keep keys`, {
        fieldPath,
        fieldValue,
        updateAssociationValues,
        recordKey,
        normalizedValue: values[fieldName],
      });
      continue;
    }

    // Allowed: process create/update rules
    const createParams = ctx.can({
      roles: ctx.state.currentRoles,
      resource: field.target,
      action: 'create',
    });

    const updateParams = ctx.can({
      roles: ctx.state.currentRoles,
      resource: field.target,
      action: 'update',
    });

    // Multi
    if (Array.isArray(fieldValue)) {
      const processed = [];
      let allowedRecordKeys: Set<any> | undefined;

      if (updateParams) {
        allowedRecordKeys = await collectAllowedRecordKeys(ctx, fieldValue, recordKey, updateParams, field.target);
      }

      for (const item of fieldValue) {
        const r = await processAssociationChild(
          ctx,
          item,
          recordKey,
          updateAssociationValues,
          createParams,
          updateParams,
          field.target,
          fieldPath,
          allowedRecordKeys,
        );
        if (r !== null && r !== undefined) {
          processed.push(r);
        }
      }

      values[fieldName] = processed;
      continue;
    }

    // Single
    const r = await processAssociationChild(
      ctx,
      fieldValue,
      recordKey,
      updateAssociationValues,
      createParams,
      updateParams,
      field.target,
      fieldPath,
    );
    values[fieldName] = r;
  }

  return values;
}

export const checkChangesWithAssociation = async (ctx: Context, next: Next) => {
  const { resourceName, actionName } = ctx.action;
  if (!['create', 'firstOrCreate', 'updateOrCreate', 'update'].includes(actionName)) {
    return next();
  }
  if (ctx.permission?.skip) {
    return next();
  }
  const roles = ctx.state.currentRoles;
  if (roles.includes('root')) {
    return next();
  }
  const acl: ACL = ctx.acl;
  for (const role of roles) {
    const aclRole = acl.getRole(role);
    if (aclRole.snippetAllowed(`${resourceName}:${actionName}`)) {
      return next();
    }
  }

  const params = ctx.action.params || {};
  const rawValues = params.values;
  if (_.isEmpty(rawValues)) {
    return next();
  }

  const protectedKeys = ['firstOrCreate', 'updateOrCreate'].includes(actionName) ? params.filterKeys || [] : [];
  const aclParams = ctx.permission.can?.params || ctx.acl.fixedParamsManager.getParams(resourceName, actionName);
  const processed = await processValues(
    ctx,
    rawValues,
    params.updateAssociationValues || [],
    aclParams,
    resourceName,
    '',
    protectedKeys,
  );
  console.log(processed);
  ctx.action.params.values = processed;
  await next();
};
