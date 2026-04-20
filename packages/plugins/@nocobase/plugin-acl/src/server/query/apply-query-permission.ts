/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, checkFilterParams, createUserProvider, NoPermissionError, parseJsonTemplate } from '@nocobase/acl';
import type { QueryDimension, QueryField, QueryMeasure, QueryOptions, QueryOrder } from '@nocobase/database';
import { Database } from '@nocobase/database';
import { assign, isPlainObject } from '@nocobase/utils';

type QuerySelection = QueryMeasure | QueryDimension | QueryOrder;

export type QueryPermissionQuery = QueryOptions & Record<string, any>;

export type ApplyQueryPermissionOptions = {
  acl: ACL;
  db: Database;
  resourceName: string;
  query: QueryPermissionQuery;
  currentUser?: any;
  currentRole?: string;
  currentRoles?: string[];
  timezone?: string;
  state?: any;
};

function normalizeFieldPath(field?: QueryField) {
  if (!field) {
    return null;
  }
  const parts = Array.isArray(field) ? field : field.split('.');
  const normalized = parts.filter(Boolean);
  return normalized.length ? normalized : null;
}

function stringifyFieldPath(field?: QueryField) {
  const path = normalizeFieldPath(field);
  if (!path) {
    return null;
  }
  return path.join('.');
}

function resolveQueryFieldKey(resourceName: string, field?: QueryField) {
  const path = normalizeFieldPath(field);
  if (!path) {
    return null;
  }

  if (path.length === 1) {
    return `${resourceName}.${path[0]}`;
  }

  return path.join('.');
}

function pruneEmptyArray<T>(items: T[] | undefined) {
  return items && items.length > 0 ? items : undefined;
}

function getRoleNames(options: ApplyQueryPermissionOptions) {
  if (options.currentRoles?.length) {
    return options.currentRoles;
  }
  if (options.currentRole) {
    return [options.currentRole];
  }
  return ['anonymous'];
}

function getSelectableFields(permission: ReturnType<ACL['can']>) {
  const fields = permission?.params?.fields;
  const appends = permission?.params?.appends;

  if (fields === undefined && appends === undefined) {
    return null;
  }

  return Array.from(new Set([...(fields || []), ...(appends || [])]));
}

function isAllowedFieldPath(acl: ACL, db: Database, roles: string[], rootCollectionName: string, field?: QueryField) {
  const fieldPath = normalizeFieldPath(field);
  if (!fieldPath) {
    return false;
  }

  let collectionName = rootCollectionName;
  let permission = acl.can({
    roles,
    resource: collectionName,
    action: 'view',
  });

  if (!permission) {
    return false;
  }

  for (let index = 0; index < fieldPath.length; index++) {
    const fieldName = fieldPath[index];
    const field = db.getCollection(collectionName)?.getField(fieldName);

    if (!field) {
      return false;
    }

    const selectableFields = getSelectableFields(permission);
    if (selectableFields && !selectableFields.includes(fieldName)) {
      return false;
    }

    if (index === fieldPath.length - 1) {
      return true;
    }

    if (!field.target) {
      return false;
    }

    collectionName = field.target;
    permission = acl.can({
      roles,
      resource: collectionName,
      action: 'view',
    });

    if (!permission) {
      return false;
    }
  }

  return true;
}

function pruneSelections<T extends QuerySelection>(
  items: T[] | undefined,
  acl: ACL,
  db: Database,
  roles: string[],
  resourceName: string,
) {
  return pruneEmptyArray((items || []).filter((item) => isAllowedFieldPath(acl, db, roles, resourceName, item.field)));
}

function getAvailableSelectionKeys(resourceName: string, query: QueryPermissionQuery) {
  const keys = new Set<string>();

  for (const item of [...(query.measures || []), ...(query.dimensions || [])]) {
    if (item.alias) {
      keys.add(item.alias);
    }

    const fieldPathKey = stringifyFieldPath(item.field);
    if (fieldPathKey) {
      keys.add(fieldPathKey);
    }

    const qualifiedFieldKey = resolveQueryFieldKey(resourceName, item.field);
    if (qualifiedFieldKey) {
      keys.add(qualifiedFieldKey);
    }
  }

  return keys;
}

function pruneOrders(
  items: QueryOrder[] | undefined,
  acl: ACL,
  db: Database,
  roles: string[],
  resourceName: string,
  availableSelectionKeys: Set<string>,
) {
  return pruneEmptyArray(
    (items || []).filter((item) => {
      if (isAllowedFieldPath(acl, db, roles, resourceName, item.field)) {
        return true;
      }

      const fieldKey = stringifyFieldPath(item.field);
      return !!fieldKey && availableSelectionKeys.has(fieldKey);
    }),
  );
}

function pruneHavingNode(node: any, availableKeys: Set<string>): any {
  if (!isPlainObject(node)) {
    return undefined;
  }

  const result = {};

  for (const [key, value] of Object.entries(node)) {
    if ((key === '$and' || key === '$or') && Array.isArray(value)) {
      const items = value.map((item) => pruneHavingNode(item, availableKeys)).filter((item) => item !== undefined);
      if (items.length > 0) {
        result[key] = items;
      }
      continue;
    }

    if (!availableKeys.has(key)) {
      continue;
    }

    result[key] = value;
  }

  return Object.keys(result).length ? result : undefined;
}

async function getParsedPermissionFilter(options: ApplyQueryPermissionOptions, permission: ReturnType<ACL['can']>) {
  const filterParams = permission?.params?.filter;

  if (!filterParams) {
    return undefined;
  }

  checkFilterParams(options.db.getCollection(options.resourceName), filterParams);

  return (
    (await parseJsonTemplate(filterParams, {
      state: options.state,
      timezone: options.timezone,
      userProvider: createUserProvider({
        db: options.db,
        currentUser: options.currentUser,
      }),
    })) ?? filterParams
  );
}

export async function applyQueryPermission(options: ApplyQueryPermissionOptions) {
  const { acl, db, resourceName, query: sourceQuery, currentUser, state, timezone } = options;
  const roles = getRoleNames(options);
  const rootPermission = acl.can({
    roles,
    resource: resourceName,
    action: 'view',
  });

  if (!rootPermission) {
    throw new NoPermissionError(`No permission for resource: ${resourceName}`);
  }

  const query: QueryPermissionQuery = {
    ...sourceQuery,
    measures: pruneSelections(sourceQuery.measures, acl, db, roles, resourceName),
    dimensions: pruneSelections(sourceQuery.dimensions, acl, db, roles, resourceName),
  };

  const availableSelectionKeys = getAvailableSelectionKeys(resourceName, query);
  query.orders = pruneOrders(sourceQuery.orders, acl, db, roles, resourceName, availableSelectionKeys);
  query.having = pruneHavingNode(query.having, availableSelectionKeys);

  const aclFilter = await getParsedPermissionFilter(
    {
      ...options,
      acl,
      db,
      resourceName,
      query,
      currentUser,
      state,
      timezone,
    },
    rootPermission,
  );
  if (aclFilter) {
    query.filter = assign(query.filter || {}, aclFilter, {
      filter: 'andMerge',
    });
  }

  const hasSelection =
    (options.query.measures?.length || 0) > 0 ||
    (options.query.dimensions?.length || 0) > 0 ||
    (options.query.orders?.length || 0) > 0;
  const hasRemainingSelection =
    (query.measures?.length || 0) > 0 || (query.dimensions?.length || 0) > 0 || (query.orders?.length || 0) > 0;

  if (hasSelection && !hasRemainingSelection) {
    throw new NoPermissionError(`No permission for query fields: ${options.resourceName}`);
  }

  return {
    permission: rootPermission,
    query,
  };
}
