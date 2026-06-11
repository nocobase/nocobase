/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import type { Model } from '@nocobase/database';

interface ApplyActionInput {
  name?: string;
  fields?: string[];
  scopeId?: number | null;
  scopeKey?: string;
  scope?: {
    id?: number;
    key?: string;
  };
}

interface ApplyResourceInput {
  name?: string;
  usingActionsConfig?: boolean;
  actions?: ApplyActionInput[];
}

function ensureString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return value.trim();
}

function normalizeFields(fields: unknown): string[] | undefined {
  if (!Array.isArray(fields)) {
    return undefined;
  }

  const normalized = [
    ...new Set(fields.filter((field): field is string => typeof field === 'string' && !!field.trim())),
  ];
  return normalized.length ? normalized : [];
}

function normalizeScopeId(scopeId: unknown): number | null | undefined {
  if (scopeId === null) {
    return null;
  }

  if (scopeId === undefined) {
    return undefined;
  }

  const parsed = Number(scopeId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid scopeId: ${scopeId}`);
  }
  return parsed;
}

async function resolveScopeIdByKey(options: {
  ctx: Context;
  dataSourceKey: string;
  scopeKey: string;
  transaction: any;
}) {
  const scope = await options.ctx.db.getRepository('dataSourcesRolesResourcesScopes').findOne({
    filter: {
      dataSourceKey: options.dataSourceKey,
      key: options.scopeKey,
    },
    transaction: options.transaction,
  });

  if (!scope) {
    throw new Error(`Scope key "${options.scopeKey}" not found in data source "${options.dataSourceKey}"`);
  }

  return scope.get('id') as number;
}

async function normalizeAction(options: {
  ctx: Context;
  dataSourceKey: string;
  action: ApplyActionInput;
  transaction: any;
}) {
  const name = ensureString(options.action.name, 'action.name');

  let scopeId = normalizeScopeId(options.action.scopeId);
  if (scopeId === undefined && options.action.scope && typeof options.action.scope.id === 'number') {
    scopeId = normalizeScopeId(options.action.scope.id);
  }

  let scopeKey: string | undefined;
  if (typeof options.action.scopeKey === 'string' && options.action.scopeKey.trim()) {
    scopeKey = options.action.scopeKey.trim();
  } else if (options.action.scope && typeof options.action.scope.key === 'string' && options.action.scope.key.trim()) {
    scopeKey = options.action.scope.key.trim();
  }

  if (scopeId === undefined && scopeKey) {
    scopeId = await resolveScopeIdByKey({
      ctx: options.ctx,
      dataSourceKey: options.dataSourceKey,
      scopeKey,
      transaction: options.transaction,
    });
  }

  // If no scope binding provided, default to null (all records)
  if (scopeId === undefined) {
    scopeId = null;
  }

  const normalized = {
    name,
    fields: normalizeFields(options.action.fields),
    scopeId,
  };

  const output: Record<string, any> = {
    name: normalized.name,
  };

  if (normalized.fields !== undefined) {
    output.fields = normalized.fields;
  }

  if (normalized.scopeId !== undefined) {
    output.scopeId = normalized.scopeId;
  }

  return output;
}

export async function applyDataPermissions(ctx: Context, next: Next) {
  const roleName = ensureString(ctx.action.params.filterByTk, 'filterByTk');
  const values = ctx.action.params.values || {};
  const dataSourceKey = ensureString(values.dataSourceKey || 'main', 'dataSourceKey');
  const resources = values.resources as ApplyResourceInput[];

  if (!Array.isArray(resources) || resources.length === 0) {
    throw new Error('`resources` must be a non-empty array');
  }

  const role = await ctx.db.getRepository('roles').findOne({
    filterByTk: roleName,
  });

  if (!role) {
    throw new Error(`Role "${roleName}" not found`);
  }

  const roleResourceRepository = ctx.db.getRepository('roles.resources', roleName);
  const appliedResources: Array<Record<string, any>> = [];

  await ctx.db.sequelize.transaction(async (transaction) => {
    for (const resourceInput of resources) {
      const resourceName = ensureString(resourceInput?.name, 'resource.name');
      const usingActionsConfig = resourceInput?.usingActionsConfig ?? true;
      const actionsInput = Array.isArray(resourceInput?.actions) ? resourceInput.actions : [];

      const normalizedActions: Array<Record<string, any>> = [];
      for (const action of actionsInput) {
        normalizedActions.push(
          await normalizeAction({
            ctx,
            dataSourceKey,
            action,
            transaction,
          }),
        );
      }

      const existingResource = (await roleResourceRepository.findOne({
        filter: {
          name: resourceName,
          dataSourceKey,
        },
        appends: ['actions'],
        transaction,
      })) as Model | null;

      const writeValues: Record<string, any> = {
        name: resourceName,
        dataSourceKey,
        usingActionsConfig,
        actions: normalizedActions,
      };

      let savedResource: Model;
      if (existingResource) {
        await roleResourceRepository.update({
          filterByTk: existingResource.get('id'),
          values: writeValues,
          updateAssociationValues: ['actions'],
          transaction,
        });
        savedResource = (await roleResourceRepository.findOne({
          filterByTk: existingResource.get('id'),
          appends: ['actions'],
          transaction,
        })) as Model;
      } else {
        const created = (await roleResourceRepository.create({
          values: writeValues,
          transaction,
        })) as Model;
        savedResource = (await roleResourceRepository.findOne({
          filterByTk: created.get('id'),
          appends: ['actions'],
          transaction,
        })) as Model;
      }

      const actionModels = (savedResource.get('actions') || []) as Model[];
      appliedResources.push({
        id: savedResource.get('id'),
        name: savedResource.get('name'),
        dataSourceKey: savedResource.get('dataSourceKey'),
        usingActionsConfig: !!savedResource.get('usingActionsConfig'),
        actions: actionModels.map((actionModel) => ({
          id: actionModel.get('id'),
          name: actionModel.get('name'),
          fields: actionModel.get('fields') || [],
          scopeId: actionModel.get('scopeId') ?? null,
        })),
      });
    }
  });

  ctx.body = {
    roleName,
    dataSourceKey,
    resources: appliedResources,
    count: appliedResources.length,
  };

  await next();
}
