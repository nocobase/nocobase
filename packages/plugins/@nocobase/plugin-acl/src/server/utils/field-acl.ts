/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Collection, RelationField } from '@nocobase/database';
import lodash from 'lodash';

export const normalizeFieldNames = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  if (lodash.isPlainObject(value)) {
    return Object.values(value).filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  return [];
};

const hasFieldRestrictions = (params: any) => {
  return normalizeFieldNames(params?.fields).length > 0 || normalizeFieldNames(params?.appends).length > 0;
};

const isFieldAllowedInParams = (collection: Collection, fieldName: string, params: any) => {
  const field = collection.getField(fieldName);

  if (!field) {
    return false;
  }

  if (!hasFieldRestrictions(params)) {
    return true;
  }

  const fields = normalizeFieldNames(params?.fields);
  const appends = normalizeFieldNames(params?.appends);
  const fieldPaths = [...fields, ...appends];

  if (field instanceof RelationField) {
    return fieldPaths.some((item) => item === fieldName || item.startsWith(`${fieldName}.`));
  }

  return fields.includes(fieldName);
};

export const canAccessNestedFieldPath = (
  ctx: Context,
  collection: Collection,
  path: string,
  params: any,
  visited = new Set<string>(),
): boolean => {
  const [fieldName, ...rest] = String(path).split('.').filter(Boolean);

  if (!fieldName || !isFieldAllowedInParams(collection, fieldName, params)) {
    return false;
  }

  if (!rest.length) {
    return true;
  }

  const field = collection.getField(fieldName);
  if (!(field instanceof RelationField) || !field.target) {
    return false;
  }

  const db = ctx.database ?? ctx.db;
  const targetCollection = db?.getCollection?.(field.target);

  if (!targetCollection) {
    return false;
  }

  const visitedKey = `${targetCollection.name}:${rest.join('.')}`;
  if (visited.has(visitedKey)) {
    return false;
  }

  visited.add(visitedKey);

  const canResult = ctx.can({
    roles: ctx.state.currentRoles,
    resource: targetCollection.name,
    action: ctx.action.actionName,
  });

  if (!canResult) {
    return false;
  }

  return canAccessNestedFieldPath(ctx, targetCollection, rest.join('.'), canResult.params || {}, visited);
};

export const expandRestrictedSelectionPaths = (
  ctx: Context,
  collection: Collection,
  params: any,
  prefix = '',
  visited = new Set<string>(),
): { fields: string[]; appends: string[] } => {
  const result = {
    fields: [] as string[],
    appends: [] as string[],
  };

  const expandPath = (path: string, bucket: 'fields' | 'appends') => {
    const segments = String(path).split('.').filter(Boolean);
    const [fieldName, ...rest] = segments;

    if (!fieldName) {
      return;
    }

    const prefixedPath = prefix ? `${prefix}.${segments.join('.')}` : segments.join('.');

    if (rest.length) {
      result[bucket].push(prefixedPath);
      return;
    }

    const field = collection.getField(fieldName);
    if (!(field instanceof RelationField) || !field.target) {
      result[bucket].push(prefixedPath);
      return;
    }

    const db = ctx.database ?? ctx.db;
    const targetCollection = db?.getCollection?.(field.target);

    if (!targetCollection) {
      result[bucket].push(prefixedPath);
      return;
    }

    const canResult = ctx.can({
      roles: ctx.state.currentRoles,
      resource: targetCollection.name,
      action: ctx.action.actionName,
    });

    if (!canResult || typeof canResult !== 'object') {
      result[bucket].push(prefixedPath);
      return;
    }

    const targetParams = canResult.params || {};

    if (!hasFieldRestrictions(targetParams)) {
      result[bucket].push(prefixedPath);
      return;
    }

    const visitedKey = `${targetCollection.name}:${prefixedPath}`;
    if (visited.has(visitedKey)) {
      result[bucket].push(prefixedPath);
      return;
    }

    visited.add(visitedKey);

    const nested = expandRestrictedSelectionPaths(ctx, targetCollection, targetParams, prefixedPath, visited);

    visited.delete(visitedKey);

    if (!nested.fields.length && !nested.appends.length) {
      result[bucket].push(prefixedPath);
      return;
    }

    result.fields.push(...nested.fields);
    result.appends.push(...nested.appends);
  };

  normalizeFieldNames(params?.fields).forEach((path) => expandPath(path, 'fields'));
  normalizeFieldNames(params?.appends).forEach((path) => expandPath(path, 'appends'));

  result.fields = lodash.uniq(result.fields);
  result.appends = lodash.uniq(result.appends);

  return result;
};

export const getActionCollection = (ctx: Context): Collection | undefined => {
  const resourceName = ctx.action?.resourceName;
  const db = ctx.database ?? ctx.db;

  if (!resourceName || !db) {
    return;
  }

  if (resourceName.includes('.')) {
    const [collectionName, associationName] = resourceName.split('.');
    const field = db.getCollection(collectionName)?.getField?.(associationName) as RelationField | undefined;
    if (field?.target) {
      return db.getCollection(field.target);
    }
    return;
  }

  return db.getCollection(resourceName);
};
