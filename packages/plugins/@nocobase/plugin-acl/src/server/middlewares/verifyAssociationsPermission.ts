/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError } from '@nocobase/acl';
import { Collection, getKeysByPrefix, RelationField, Values } from '@nocobase/database';
import _ from 'lodash';

export function verifyAssociationsPermissionMiddleware() {
  return async (ctx: any, next) => {
    const { actionName, params } = ctx.action;
    if (['create', 'update'].includes(actionName) && params.updateAssociationValues?.length) {
      const { updateAssociationValues, values } = params;
      if (!values || typeof values !== 'object') return;
      const db = ctx.dataSource.collectionManager.db;
      const repository = db.getRepository(ctx.action.resourceName);
      const collection = repository.collection;
      const checks = buildCheckData({ node: values, collection, paths: updateAssociationValues });
      await verifyPermission(ctx, checks);
      await next();
    }
  };

  function buildCheckData(options: { node: any; collection: Collection; paths: string[] }) {
    const { node, collection, paths } = options;
    const checks: Array<{ action: string; resource: string; key: string; value: any }> = [];
    const stack: Array<{ node: any; coll: Collection; cand: string[] }> = [{ node, coll: collection, cand: paths }];

    while (stack.length) {
      const { node, coll: currentColl, cand } = stack.pop();
      if (!node || typeof node !== 'object') continue;

      for (const key of Object.keys(node)) {
        const field = currentColl.fields.get(key);
        if (!(field instanceof RelationField)) {
          continue;
        }

        const direct = cand.includes(key);
        const childPaths = getKeysByPrefix(cand, key);

        if (!direct && childPaths.length === 0) {
          continue;
        }

        const currentValue = node[key];
        const action = getAssociationAction(currentValue, field.targetKey);

        checks.push({ action, resource: field.target, key, value: currentValue });

        const targetColl = (field as RelationField).targetCollection();
        if (!targetColl) continue;

        if (Array.isArray(currentValue)) {
          for (const item of currentValue) {
            if (item && typeof item === 'object') {
              stack.push({ node: item, coll: targetColl, cand: childPaths });
            }
          }
        } else if (currentValue && typeof currentValue === 'object') {
          stack.push({ node: currentValue, coll: targetColl, cand: childPaths });
        }
      }
    }
    return checks;
  }
}
async function verifyPermission(ctx, checks: { action: string; resource: string; key: string; value: any }[]) {
  const rolesResourcesActionMap = await buildCheckFieldPermissionData(
    { ctx, db: ctx.dataSource.collectionManager.db },
    checks,
  );
  for (const check of checks) {
    if (!ctx.can) continue;
    const allowed = ctx.can({ action: check.action, resource: check.resource });
    if (!allowed && (!ctx.permission || !ctx.permission.skip)) {
      ctx.throw(403, `No permission to update association ${check.key}`);
      throw new NoPermissionError(`No permission to update association ${check.key}`);
    }
    const notAllowedFields = await hasNotAllowedFields(check, rolesResourcesActionMap);
    if (notAllowedFields.length) {
      ctx.throw(403, `No permission to update fields '${notAllowedFields.join(', ')}' of association ${check.key}`);
      throw new NoPermissionError(
        `No permission to update fields '${notAllowedFields.join(', ')}' of association ${check.key}`,
      );
    }
  }
}

async function hasNotAllowedFields(
  check: {
    action: string;
    resource: string;
    key: string;
    value: any;
  },
  rolesResourcesActionMap: Record<string, { fields: string[] }>,
) {
  const rolesResourcesAction = rolesResourcesActionMap[check.resource + ':' + check.action];
  if (rolesResourcesAction) {
    const value = Array.isArray(check.value) ? check.value[0] : check.value;
    const updatedFields = Object.keys(value);
    const notAllowedFields = _.difference(updatedFields, rolesResourcesAction.fields).filter(
      (x) => x !== '__isNewRecord__',
    );
    return notAllowedFields;
  }
  return [];
}

async function buildCheckFieldPermissionData(
  options: { ctx; db },
  checks: { action: string; resource: string; key: string; value: any }[],
) {
  const { ctx, db } = options;
  const dataSourceRolesResources = await db.getRepository('dataSourcesRolesResources').find({
    filter: {
      dataSourceKey: ctx.dataSource.name,
      roleName: ctx.state.currentRoles[0],
      name: checks.map((x) => x.resource),
    },
    attributes: ['id', 'name'],
  });

  const dataSourceRolesIds = dataSourceRolesResources.map((x) => x.id);
  const rolesResourcesActions = await db.getRepository('dataSourcesRolesResourcesActions').find({
    where: {
      rolesResourceId: dataSourceRolesIds,
      name: checks.map((x) => x.action),
    },
    attributes: ['id', 'name', 'fields', 'rolesResourceId'],
  });

  const dataSourceRolesMap = _.keyBy(dataSourceRolesResources, 'id');
  const rolesResourcesActionMap = _.keyBy(
    rolesResourcesActions,
    (x) => `${dataSourceRolesMap[x.rolesResourceId].name}:${x.name}`,
  );
  return rolesResourcesActionMap;
}

function getAssociationAction(values: Values, targetKey: string) {
  if (Array.isArray(values)) {
    return values[0]?.[targetKey] ? 'update' : 'create';
  }
  return values?.[targetKey] ? 'update' : 'create';
}
