/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ACL,
  CanResult,
  NoPermissionError,
  ParseJsonTemplateOptions,
  UserProvider,
  checkFilterParams,
  createUserProvider,
  parseJsonTemplate,
} from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { Collection } from '@nocobase/database';
import _ from 'lodash';

type ProcessValuesOptions = {
  values: Record<string, any> | Record<string, any>[];
  updateAssociationValues: string[];
  aclParams: any;
  collection: Collection;
  lastFieldPath?: string;
  protectedKeys?: string[];
  can?: (options: Omit<Parameters<ACL['can']>[0], 'role'>) => CanResult | null;
  parseOptions?: ParseJsonTemplateOptions;
};

type AllowedRecordKeysResult = {
  allowedKeys: Set<any>;
  missingKeys: Set<any>;
};

export type SanitizeAssociationValuesOptions = {
  acl?: ACL;
  resourceName: string;
  actionName: string;
  values: any;
  updateAssociationValues?: string[];
  protectedKeys?: string[];
  aclParams?: any;
  roles?: string[];
  currentRole?: string;
  currentUser?: any;
  collection?: Collection;
  db?: any;
  database?: any;
  timezone?: string;
  userProvider?: UserProvider;
};

export async function sanitizeAssociationValues(options: SanitizeAssociationValuesOptions) {
  const {
    acl,
    resourceName,
    actionName,
    values,
    updateAssociationValues = [],
    protectedKeys = [],
    aclParams,
  } = options;

  if (_.isEmpty(values)) {
    return values;
  }

  const collection = options.collection ?? (options.database ?? options.db)?.getCollection?.(resourceName);
  if (!collection) {
    return values;
  }

  const params = aclParams ?? (acl ? (acl as any).fixedParamsManager?.getParams(resourceName, actionName) : undefined);
  const roles = options.roles;
  const can = (canOptions: Omit<Parameters<ACL['can']>[0], 'role'>) =>
    acl?.can({ roles: roles?.length ? roles : ['anonymous'], ...canOptions }) ?? null;

  const parseOptions: ParseJsonTemplateOptions = {
    timezone: options.timezone,
    userProvider: options.userProvider,
    state: {
      currentRole: options.currentRole,
      currentRoles: options.roles,
      currentUser: options.currentUser,
    },
  };

  return await processValues({
    values,
    updateAssociationValues,
    aclParams: params,
    collection,
    lastFieldPath: '',
    protectedKeys,
    can,
    parseOptions,
  });
}

export const checkChangesWithAssociation = async (ctx: Context, next: Next) => {
  const timezone = (ctx.request?.get?.('x-timezone') ??
    ctx.request?.header?.['x-timezone'] ??
    ctx.req?.headers?.['x-timezone']) as string;
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
  const acl = ctx.acl;
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
  const collection = (ctx.database ?? ctx.db)?.getCollection?.(resourceName);
  const processed = await sanitizeAssociationValues({
    acl,
    collection,
    resourceName,
    actionName,
    values: rawValues,
    updateAssociationValues: params.updateAssociationValues || [],
    protectedKeys,
    roles,
    currentRole: ctx.state.currentRole,
    currentUser: ctx.state.currentUser,
    aclParams: ctx.permission?.can?.params,
    timezone,
    userProvider: createUserProvider({
      dataSourceManager: ctx.app?.dataSourceManager,
      currentUser: ctx.state?.currentUser,
    }),
  });
  ctx.action.params.values = processed;
  await next();
};

async function processValues(options: ProcessValuesOptions) {
  const {
    values,
    updateAssociationValues,
    aclParams,
    collection,
    lastFieldPath = '',
    protectedKeys = [],
    can,
    parseOptions,
  } = options;
  if (Array.isArray(values)) {
    const result = [];

    for (const item of values) {
      if (!_.isPlainObject(item)) {
        result.push(item);
        continue;
      }

      const processed = await processValues({
        values: item,
        updateAssociationValues,
        aclParams,
        collection,
        lastFieldPath,
        protectedKeys,
        can,
        parseOptions,
      });

      if (processed !== null && processed !== undefined) {
        result.push(processed);
      }
    }

    return result;
  }

  if (!values || !_.isPlainObject(values)) {
    return values;
  }

  if (!collection) {
    return values;
  }

  let v = values;
  if (aclParams?.whitelist) {
    const combined = _.uniq([...aclParams.whitelist, ...protectedKeys]);
    v = _.pick(values, combined);
  }

  for (const [fieldName, fieldValue] of Object.entries(v)) {
    if (protectedKeys.includes(fieldName)) {
      continue;
    }

    const field = collection.getField(fieldName);
    const isAssociation =
      field && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(field.type);

    if (!isAssociation) {
      continue;
    }

    const targetCollection = collection.db.getCollection(field.target);
    if (!targetCollection) {
      delete v[fieldName];
      continue;
    }

    const fieldPath = lastFieldPath ? `${lastFieldPath}.${fieldName}` : fieldName;
    const recordKey = field.type === 'hasOne' ? targetCollection.model.primaryKeyAttribute : field.targetKey;

    const canUpdateAssociation = updateAssociationValues.includes(fieldPath);

    if (!canUpdateAssociation) {
      const normalized = normalizeAssociationValue(fieldValue, recordKey);

      if (normalized === undefined && !protectedKeys.includes(fieldName)) {
        delete v[fieldName];
      } else {
        v[fieldName] = normalized;
      }

      continue;
    }

    const createParams = can?.({
      resource: field.target,
      action: 'create',
    });

    const updateParams = can?.({
      resource: field.target,
      action: 'update',
    });

    if (Array.isArray(fieldValue)) {
      const processed = [];
      let allowedRecordKeys: Set<any> | undefined;
      let existingRecordKeys: Set<any> | undefined;

      if (updateParams) {
        const allowedResult = await collectAllowedRecordKeys(
          fieldValue,
          recordKey,
          updateParams?.params?.filter,
          targetCollection,
          parseOptions,
        );
        allowedRecordKeys = allowedResult?.allowedKeys;
        if (createParams && allowedResult?.missingKeys?.size) {
          existingRecordKeys = await collectExistingRecordKeys(recordKey, targetCollection, allowedResult.missingKeys);
        }
      }

      for (const item of fieldValue) {
        const r = await processAssociationChild({
          value: item,
          recordKey,
          updateAssociationValues,
          createParams,
          updateParams,
          target: targetCollection,
          fieldPath,
          allowedRecordKeys,
          existingRecordKeys,
          can,
          parseOptions,
        });
        if (r !== null && r !== undefined) {
          processed.push(r);
        }
      }

      v[fieldName] = processed;
      continue;
    }

    const r = await processAssociationChild({
      value: fieldValue,
      recordKey,
      updateAssociationValues,
      createParams,
      updateParams,
      target: targetCollection,
      fieldPath,
      can,
      parseOptions,
    });
    v[fieldName] = r;
  }

  return v;
}

function normalizeAssociationValue(
  value: any,
  recordKey: string,
): Record<string, any> | Record<string, any>[] | undefined {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    const result = value
      .map((v) => (typeof v === 'number' || typeof v === 'string' ? v : v[recordKey]))
      .filter((v) => v !== null && v !== undefined);
    return result.length > 0 ? result : undefined;
  }
  return typeof value === 'number' || typeof value === 'string' ? value : value[recordKey];
}

async function collectAllowedRecordKeys(
  items: any[],
  recordKey: string,
  filter: any,
  collection: Collection,
  parseOptions?: ParseJsonTemplateOptions,
): Promise<AllowedRecordKeysResult | undefined> {
  if (!collection) {
    return;
  }

  const { repository } = collection;

  const keys = items
    .map((item) => (_.isPlainObject(item) ? item[recordKey] : undefined))
    .filter((key) => key !== undefined && key !== null);

  if (!keys.length) {
    return;
  }

  try {
    checkFilterParams(collection, filter);

    const scopedFilter = filter ? await parseJsonTemplate(filter, parseOptions) : {};
    const records = await repository.find({
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

    const missingKeys = new Set(keys.filter((key) => !allowedKeys.has(key)));
    return { allowedKeys, missingKeys };
  } catch (e) {
    if (e instanceof NoPermissionError) {
      return {
        allowedKeys: new Set(),
        missingKeys: new Set(keys),
      };
    }
    throw e;
  }
}

async function collectExistingRecordKeys(
  recordKey: string,
  collection: Collection,
  keys: Iterable<any>,
): Promise<Set<any>> {
  const { repository } = collection;
  if (!repository) {
    return new Set();
  }

  const keyList = Array.from(keys);
  if (!keyList.length) {
    return new Set();
  }

  const records = await repository.find({
    filter: {
      [`${recordKey}.$in`]: keyList,
    },
  });

  const existingKeys = new Set<any>();
  for (const record of records) {
    const key = typeof record.get === 'function' ? record.get(recordKey) : record[recordKey];
    if (key !== undefined && key !== null) {
      existingKeys.add(key);
    }
  }
  return existingKeys;
}

async function recordExistsWithoutScope(collection: Collection, recordKey: string, keyValue: any): Promise<boolean> {
  const { repository } = collection;
  if (!repository) {
    return false;
  }
  const record = await repository.findOne({
    filter: {
      [recordKey]: keyValue,
    },
  });
  return Boolean(record);
}

type ProcessAssociationChildOptions = {
  value: Record<string, any>;
  recordKey: string;
  updateAssociationValues: string[];
  createParams: any;
  updateParams: any;
  target: Collection;
  fieldPath: string;
  allowedRecordKeys?: Set<any>;
  existingRecordKeys?: Set<any>;
  can?: (options: Omit<Parameters<ACL['can']>[0], 'role'>) => CanResult | null;
  parseOptions?: ParseJsonTemplateOptions;
};

async function processAssociationChild(options: ProcessAssociationChildOptions) {
  const {
    value,
    recordKey,
    updateAssociationValues,
    createParams,
    updateParams,
    target,
    fieldPath,
    allowedRecordKeys,
    existingRecordKeys,
    can,
    parseOptions,
  } = options;
  const keyValue = value?.[recordKey];

  const fallbackToCreate = async () => {
    if (!createParams) {
      return keyValue;
    }
    return await processValues({
      values: value,
      updateAssociationValues,
      aclParams: createParams.params,
      collection: target,
      lastFieldPath: fieldPath,
      protectedKeys: [],
      can,
      parseOptions,
    });
  };

  const tryFallbackToCreate = async (
    reason: string,
    knownExists?: boolean,
  ): Promise<Record<string, any> | string | number | null | undefined> => {
    if (!createParams) {
      return undefined;
    }
    const recordExists =
      typeof knownExists === 'boolean' ? knownExists : await recordExistsWithoutScope(target, recordKey, keyValue);
    if (!recordExists) {
      return await fallbackToCreate();
    }
    return undefined;
  };

  if (keyValue !== undefined && keyValue !== null) {
    if (!updateParams) {
      const created = await tryFallbackToCreate(`No permission to update association, try create not exist record`);
      if (created !== undefined) {
        return created;
      }
      return keyValue;
    }
    const { repository } = target;
    if (!repository) {
      return keyValue;
    }
    try {
      if (allowedRecordKeys) {
        if (!allowedRecordKeys.has(keyValue)) {
          const created = await tryFallbackToCreate(
            `No permission to update association due to scope, try create not exist record`,
            existingRecordKeys ? existingRecordKeys.has(keyValue) : undefined,
          );
          if (created !== undefined) {
            return created;
          }
          return keyValue;
        }
      } else {
        checkFilterParams(target, updateParams.params?.filter);
        const filter = await parseJsonTemplate(updateParams.params?.filter, parseOptions);
        const record = await repository.findOne({
          filter: {
            ...filter,
            [recordKey]: keyValue,
          },
        });
        if (!record) {
          const created = await tryFallbackToCreate(
            `No permission to update association due to scope, try create not exist record`,
          );
          if (created !== undefined) {
            return created;
          }
          return keyValue;
        }
      }
      return await processValues({
        values: value,
        updateAssociationValues,
        aclParams: updateParams.params,
        collection: target,
        lastFieldPath: fieldPath,
        protectedKeys: [],
        can,
        parseOptions,
      });
    } catch (e) {
      if (e instanceof NoPermissionError) {
        return keyValue;
      }
      throw e;
    }
  }

  if (createParams) {
    return await processValues({
      values: value,
      updateAssociationValues,
      aclParams: createParams.params,
      collection: target,
      lastFieldPath: fieldPath,
      protectedKeys: [],
      can,
      parseOptions,
    });
  }

  return null;
}
