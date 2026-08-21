/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';

export function getAppendPaths(appends: any): string[] {
  return lodash
    .castArray(appends || [])
    .flatMap((append) => (typeof append === 'string' ? append.split(',') : []))
    .map((append) => append.trim())
    .filter(Boolean);
}

export function isAllowedAppendPath(queryField: string, allowedAppends: any) {
  if (typeof queryField !== 'string') {
    return false;
  }
  const appendPaths = getAppendPaths(allowedAppends);
  const queryRoot = queryField.split('.').shift();
  return appendPaths.some((allowedAppend) => {
    return allowedAppend === queryField || allowedAppend === queryRoot || queryField.startsWith(`${allowedAppend}.`);
  });
}

function isRelationField(field: any) {
  return field?.isRelationField?.() || field?.targetCollection;
}

function getPermittedAppendPaths(options: {
  ctx: any;
  collection: any;
  actionName: string;
  append: string;
  prefix?: string;
}) {
  const { ctx, collection, actionName, append, prefix = '' } = options;
  const [fieldName, ...rest] = append.split('.').map((segment) => segment.split('(').shift() || segment);
  const field = collection?.getField?.(fieldName);

  if (!field || !isRelationField(field)) {
    return [];
  }

  const targetCollection = field.targetCollection?.();
  if (!targetCollection) {
    return [];
  }

  const fieldPath = prefix ? `${prefix}.${fieldName}` : fieldName;

  // Attachment permissions are configured on the source field. The "attachments" table is a system target table
  // and should not require standalone read permission for this field append.
  if (field?.options?.interface === 'attachment' && targetCollection.name === 'attachments') {
    return [fieldPath];
  }

  // Normal associations still need read permission on each target collection before nested appends are kept.
  const permission = ctx.can?.({
    resource: targetCollection.name,
    action: actionName,
  });

  if (!permission) {
    return [];
  }

  const targetParams = permission.params;
  const isUnrestrictedRead =
    !targetParams || (!lodash.has(targetParams || {}, 'fields') && !lodash.has(targetParams || {}, 'appends'));

  if (!rest.length) {
    if (isUnrestrictedRead) {
      return [fieldPath];
    }
    return lodash
      .castArray(targetParams?.fields)
      .filter((allowedField) => {
        const targetField = targetCollection?.getField?.(allowedField);
        return targetField && !isRelationField(targetField);
      })
      .map((allowedField) => `${fieldPath}.${allowedField}`);
  }

  const nextPath = rest.join('.');
  const nextFieldName = rest[0];
  const nextField = targetCollection.getField?.(nextFieldName);

  if (!nextField) {
    return [];
  }

  if (!isRelationField(nextField)) {
    return isUnrestrictedRead || lodash.castArray(targetParams?.fields).includes(nextFieldName)
      ? [`${fieldPath}.${nextPath}`]
      : [];
  }

  if (!isUnrestrictedRead && !isAllowedAppendPath(nextPath, targetParams?.appends)) {
    return [];
  }

  return getPermittedAppendPaths({
    ctx,
    collection: targetCollection,
    actionName,
    append: nextPath,
    prefix: fieldPath,
  });
}

export function filterAppendsByAssociationReadPermission(options: {
  ctx: any;
  db: any;
  resourceName: string;
  actionName: string;
  appends: any;
}) {
  const { ctx, db, resourceName, actionName, appends } = options;
  const collection = db?.getCollection?.(resourceName);

  if (!collection) {
    return appends;
  }

  const appendPaths = getAppendPaths(appends);
  const permittedAppends = appendPaths.flatMap((append) =>
    getPermittedAppendPaths({
      ctx,
      collection,
      actionName,
      append,
    }),
  );

  return lodash.uniq(permittedAppends);
}
