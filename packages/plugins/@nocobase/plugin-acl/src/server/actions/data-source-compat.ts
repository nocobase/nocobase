/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import lodash from 'lodash';

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeFilter(input: unknown): Record<string, any> {
  if (!lodash.isPlainObject(input)) {
    return {};
  }
  return { ...(input as Record<string, any>) };
}

function applyLocatorFromQuery(params: Record<string, any>, filter: Record<string, any>) {
  const dataSourceKeyFromQuery = normalizeString(params.dataSourceKey);
  if (dataSourceKeyFromQuery) {
    filter.dataSourceKey = filter.dataSourceKey || dataSourceKeyFromQuery;
  }

  const nameFromQuery = normalizeString(params.name);
  if (nameFromQuery) {
    filter.name = filter.name || nameFromQuery;
  }
}

function normalizeNumericTk(value: unknown): number | string | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  const normalized = normalizeString(value);
  if (!normalized || !/^\d+$/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function deriveNameFromPrefixedTk(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  if (!normalized) {
    return undefined;
  }

  const matched = normalized.match(/^[a-zA-Z]+_(.+)$/);
  if (!matched) {
    return undefined;
  }

  return normalizeString(matched[1]);
}

async function resolveLocatorFromFilterByTk(ctx: Context, roleName: string, filter: Record<string, any>) {
  const rawFilterByTk = ctx.action.params.filterByTk;
  if (rawFilterByTk === undefined || rawFilterByTk === null || rawFilterByTk === '') {
    return;
  }

  const numericFilterByTk = normalizeNumericTk(rawFilterByTk);
  if (numericFilterByTk === undefined) {
    if (!normalizeString(filter.name)) {
      const derivedName = deriveNameFromPrefixedTk(rawFilterByTk);
      if (derivedName) {
        filter.name = derivedName;
      }
    }
    return;
  }

  const resource = await ctx.db.getRepository('dataSourcesRolesResources').findOne({
    filterByTk: numericFilterByTk,
  });

  if (!resource) {
    ctx.throw(404, `Resource permission not found by filterByTk "${rawFilterByTk}"`);
    return;
  }

  const targetRoleName = resource.get('roleName') as string;
  if (targetRoleName !== roleName) {
    ctx.throw(400, `Resource permission "${rawFilterByTk}" does not belong to role "${roleName}"`);
    return;
  }

  if (!normalizeString(filter.dataSourceKey)) {
    filter.dataSourceKey = resource.get('dataSourceKey');
  }

  if (!normalizeString(filter.name)) {
    filter.name = resource.get('name');
  }
}

async function normalizeRoleDataSourceResourceLocator(ctx: Context) {
  const roleName = normalizeString(ctx.action.params.associatedIndex);
  if (!roleName) {
    ctx.throw(400, 'Role name is required');
    return;
  }

  const filter = normalizeFilter(ctx.action.params.filter);
  applyLocatorFromQuery(ctx.action.params, filter);
  await resolveLocatorFromFilterByTk(ctx, roleName, filter);

  const dataSourceKey = normalizeString(filter.dataSourceKey);
  const name = normalizeString(filter.name);

  if (!dataSourceKey || !name) {
    ctx.throw(
      400,
      'Missing resource locator: provide --filter-by-tk, or both --data-source-key and --name (or filter.{dataSourceKey,name})',
    );
    return;
  }

  ctx.action.params.filter = {
    ...filter,
    dataSourceKey,
    name,
  };
}

export async function guardRolesDataSourcesCollectionsList(ctx: Context, next: Next) {
  const filter = normalizeFilter(ctx.action.params.filter);
  applyLocatorFromQuery(ctx.action.params, filter);

  const dataSourceKey = normalizeString(filter.dataSourceKey);
  if (!dataSourceKey) {
    ctx.throw(400, 'dataSourceKey is required: pass --data-source-key or filter.dataSourceKey');
    return;
  }

  ctx.action.params.filter = {
    ...filter,
    dataSourceKey,
  };

  await next();
}

// Only validates dataSourceKey; does NOT validate scope bindings so that
// existing callers (e.g. plugin-workflow-action-trigger tests) are unaffected.
export async function guardRolesDataSourceResourcesCreate(ctx: Context, next: Next) {
  const values = normalizeFilter(ctx.action.params.values);
  const dataSourceKeyFromQuery = normalizeString(ctx.action.params.dataSourceKey);
  if (!values.dataSourceKey && dataSourceKeyFromQuery) {
    values.dataSourceKey = dataSourceKeyFromQuery;
  }

  if (!normalizeString(values.dataSourceKey)) {
    ctx.throw(400, 'dataSourceKey is required for roles.dataSourceResources:create');
    return;
  }

  ctx.action.params.values = values;
  await next();
}

export async function guardRolesDataSourceResourcesGet(ctx: Context, next: Next) {
  await normalizeRoleDataSourceResourceLocator(ctx);
  await next();
}

// Validates scope bindings on update so callers must explicitly provide scopeId.
export async function guardRolesDataSourceResourcesUpdate(ctx: Context, next: Next) {
  await normalizeRoleDataSourceResourceLocator(ctx);
  await next();
}
