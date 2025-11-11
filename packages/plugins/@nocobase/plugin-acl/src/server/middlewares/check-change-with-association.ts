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
    const result = value.map((v) => _.pick(v, recordKey)).filter((v) => !_.isEmpty(v));
    return result.length > 0 ? result : undefined;
  } else {
    const result = _.pick(value, recordKey);
    return _.isEmpty(result) ? undefined : result;
  }
}

/**
 * Process nested association values recursively if creation is allowed.
 */
function processAssociationChild(
  ctx: Context,
  value: Record<string, any>,
  recordKey: string,
  updateAssociationValues: string[],
  createParams: any,
  updateParams: any,
  target: string,
  fieldPath: string,
): Record<string, any> | null {
  // Case 1: Existing record → potential update
  if (value[recordKey]) {
    if (!updateParams) {
      // No update permission, skip
      return _.pick(value, recordKey);
    } else {
      // TODO: handle update logic later
      // For now, only allow recursion on whitelisted update fields
      return processValues(ctx, value, updateAssociationValues, updateParams, target, fieldPath);
    }
  }

  // Case 2: New record → potential create
  if (createParams) {
    return processValues(ctx, value, updateAssociationValues, createParams, target, fieldPath);
  }

  // Case 3: Neither create nor update is allowed
  return null;
}

/**
 * Recursively process values based on ACL and association rules.
 */
function processValues(
  ctx: Context,
  values: Record<string, any>,
  updateAssociationValues: string[],
  aclParams: any,
  collectionName: string,
  lastFieldPath = '',
) {
  const db: Database = ctx.database;
  const collection = db.getCollection(collectionName);

  // Apply ACL whitelist filtering
  if (aclParams?.whitelist) {
    values = _.pick(values, aclParams.whitelist);
  }

  for (const [fieldName, fieldValue] of Object.entries(values)) {
    const field = collection.getField(fieldName);

    // Skip non-association fields
    if (!field?.target) {
      continue;
    }

    const targetCollection = db.getCollection(field.target);
    if (!targetCollection) {
      delete values[fieldName];
      continue;
    }

    const fieldPath = lastFieldPath ? `${lastFieldPath}.${fieldName}` : fieldName;
    const recordKey = field.type === 'hasOne' ? targetCollection.model.primaryKeyAttribute : field.targetKey;

    // Case 1: Association update is not allowed → keep only record keys
    if (!updateAssociationValues.includes(fieldPath)) {
      const normalized = normalizeAssociationValue(fieldValue, recordKey);
      if (!normalized) {
        delete values[fieldName];
      } else {
        values[fieldName] = normalized;
      }
      continue;
    }

    // Case 2: Association update is allowed → process recursively
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

    if (Array.isArray(fieldValue)) {
      const processedArray = [];
      for (const item of fieldValue) {
        const result = processAssociationChild(
          ctx,
          item,
          recordKey,
          updateAssociationValues,
          createParams,
          updateParams,
          field.target,
          fieldPath,
        );
        if (!_.isEmpty(result)) {
          processedArray.push(result);
        }
      }
      if (processedArray.length === 0) {
        delete values[fieldName];
      } else {
        values[fieldName] = processedArray;
      }
    } else {
      const result = processAssociationChild(
        ctx,
        fieldValue,
        recordKey,
        updateAssociationValues,
        createParams,
        updateParams,
        field.target,
        fieldPath,
      );
      if (_.isEmpty(result)) {
        delete values[fieldName];
      } else {
        values[fieldName] = result;
      }
    }
  }
  return values;
}

export const checkChangesWithAssociation = async (ctx: Context, next: Next) => {
  const { resourceName, actionName } = ctx.action;
  if (!['create', 'firstOrCreate', 'updateOrCreate', 'update'].includes(actionName)) {
    return next();
  }
  const values = ctx.action.params?.values || {};
  if (_.isEmpty(values)) {
    return next();
  }
  const { updateAssocationValues = [] } = ctx.action.params || {};
  const params = ctx.permission.can?.params || ctx.acl.fixedParamsManager.getParams(resourceName, actionName);
  let collectionName = resourceName;
  if (resourceName.includes('.')) {
    collectionName = resourceName.split('.')[1];
  }
  processValues(ctx, values, updateAssocationValues, params, collectionName);
  await next();
};
