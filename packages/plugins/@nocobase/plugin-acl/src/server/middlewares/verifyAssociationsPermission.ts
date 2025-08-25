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

export function verifyAssociationsPermissionMiddleware() {
  return async (ctx: any, next) => {
    const { actionName, params } = ctx.action;
    if (['create', 'update'].includes(actionName) && params.updateAssociationValues?.length) {
      const repository = ctx.db.getRepository(ctx.action.resourceName);
      const collection = repository.collection;
      const { updateAssociationValues = [], values } = params;

      const paths = updateAssociationValues;

      const visit = (nodeValues: any, coll: Collection, candPaths: string[]) => {
        if (!nodeValues || typeof nodeValues !== 'object') return;

        for (const key of Object.keys(nodeValues)) {
          const field = coll.fields.get(key);
          if (!(field instanceof RelationField)) {
            continue;
          }

          const direct = candPaths.includes(key);
          const childPaths = getKeysByPrefix(candPaths, key);

          if (!direct && childPaths.length === 0) {
            continue;
          }
          if (!ctx.can) {
            continue;
          }
          const action = getAssociationAction(nodeValues[key], field.targetKey);
          const allowed = ctx.can({ action, resource: field.target });

          if (!allowed && (!ctx.permission || !ctx.permission.skip)) {
            ctx.throw(403, `No permission to update association ${key}`);
            throw new NoPermissionError(`No permission to update association ${key}`);
          }

          const current = nodeValues[key];
          if (current == null) {
            continue;
          }

          const targetColl = (field as RelationField).targetCollection();
          if (!targetColl) continue;

          if (Array.isArray(current)) {
            for (const item of current) {
              if (item && typeof item === 'object') {
                visit(item, targetColl, childPaths);
              }
            }
          } else if (typeof current === 'object') {
            visit(current, targetColl, childPaths);
          }
        }
      };
      visit(values, collection, paths);
    }
    await next();
  };
}

function getAssociationAction(values: Values, targetKey: string) {
  if (Array.isArray(values)) {
    return values[0]?.[targetKey] ? 'update' : 'create';
  }
  return values?.[targetKey] ? 'update' : 'create';
}
