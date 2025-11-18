/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  if (Array.isArray(value)) {
    const result = value.map((v) => v[recordKey]).filter((v) => !_.isEmpty(v));
    return result.length > 0 ? result : undefined;
  } else {
    return value[recordKey];
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
): Promise<Record<string, any> | string | number | null> {
  // Case 1: Existing record → potential update
  if (value[recordKey]) {
    if (!updateParams) {
      // No update permission, skip
      return value[recordKey];
    } else {
      const filteredParams = ctx.acl.filterParams(ctx, target, updateParams.params);
      const parsedParams = await ctx.acl.parseJsonTemplate(filteredParams, ctx);
      if (parsedParams.filter) {
        // permission scope exists, verify the record exists under the scope
        const repo = ctx.db.getRepository(target);
        if (!repo) {
          return value[recordKey];
        }
        const record = await repo.findOne({
          filter: {
            ...parsedParams.filter,
            [recordKey]: value[recordKey],
          },
        });
        if (!record) {
          return value[recordKey];
        }
      }
      return await processValues(ctx, value, updateAssociationValues, updateParams.params, target, fieldPath);
    }
  }

  // Case 2: New record → potential create
  if (createParams) {
    return await processValues(ctx, value, updateAssociationValues, createParams.params, target, fieldPath);
  }

  // Case 3: Neither create nor update is allowed
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

      if (!_.isEmpty(processed)) {
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
    console.log(canUpdateAssociation);

    // Association cannot update → only keep key(s)
    if (!canUpdateAssociation) {
      const normalized = normalizeAssociationValue(fieldValue, recordKey);

      if (normalized === undefined && !protectedKeys.includes(fieldName)) {
        delete values[fieldName];
      } else {
        values[fieldName] = normalized;
      }

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
        );
        if (!_.isEmpty(r)) {
          processed.push(r);
        }
      }

      if (processed.length === 0 && !protectedKeys.includes(fieldName)) {
        delete values[fieldName];
      } else {
        values[fieldName] = processed;
      }

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

    if (_.isEmpty(r) && !protectedKeys.includes(fieldName)) {
      delete values[fieldName];
    } else {
      values[fieldName] = r;
    }
  }

  return values;
}

export const checkChangesWithAssociation = async (ctx: Context, next: Next) => {
  if (ctx.permission.skip) return next();

  const { resourceName, actionName } = ctx.action;
  if (!['create', 'firstOrCreate', 'updateOrCreate', 'update'].includes(actionName)) {
    return next();
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
