/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { BelongsToArrayAssociation, Field, FilterParser } from '@nocobase/database';
import compose from 'koa-compose';
import { Cache } from '@nocobase/cache';
import { middlewares } from '@nocobase/server';
import { QueryParams } from '../types';
import { createQueryParser } from '../query-parser';

const getDB = (ctx: Context, dataSource: string) => {
  const ds = ctx.app.dataSourceManager.dataSources.get(dataSource);
  return ds?.collectionManager.db;
};

export const postProcess = async (ctx: Context, next: Next) => {
  const { data, fieldMap } = ctx.action.params.values as {
    data: any[];
    fieldMap: { [source: string]: { type?: string } };
  };
  ctx.body = data.map((record) => {
    Object.entries(record).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      const { type } = fieldMap[key] || {};
      switch (type) {
        case 'bigInt':
        case 'integer':
        case 'float':
        case 'double':
        case 'decimal':
          record[key] = Number(value);
          break;
      }
    });
    return record;
  });
  await next();
};

export const queryData = async (ctx: Context, next: Next) => {
  const { dataSource, collection, queryParams, fieldMap } = ctx.action.params.values;
  const db = getDB(ctx, dataSource) || ctx.db;
  const model = db.getModel(collection);
  const data = await model.findAll(queryParams);
  ctx.action.params.values = {
    data,
    fieldMap,
  };
  await next();
  // if (!sql) {
  //   return await repository.find(parseBuilder(ctx, { collection, measures, dimensions, orders, filter, limit }));
  // }

  // const statement = `SELECT ${sql.fields} FROM ${collection} ${sql.clauses}`;
  // const [data] = await ctx.db.sequelize.query(statement);
  // return data;
};

export const parseFieldAndAssociations = async (ctx: Context, next: Next) => {
  const {
    dataSource,
    collection: collectionName,
    measures,
    dimensions,
    orders,
    filter,
  } = ctx.action.params.values as QueryParams;
  const db = getDB(ctx, dataSource) || ctx.db;
  const collection = db.getCollection(collectionName);
  const fields = collection.fields;
  const associations = collection.model.associations;
  const models: {
    [target: string]: {
      type: string;
    };
  } = {};
  const parseField = (selected: { field: string | string[]; alias?: string }) => {
    let target: string;
    let name: string;
    if (!Array.isArray(selected.field)) {
      name = selected.field;
    } else if (selected.field.length === 1) {
      name = selected.field[0];
    } else if (selected.field.length > 1) {
      [target, name] = selected.field;
    }
    const rawAttributes = collection.model.getAttributes();
    let field = rawAttributes[name]?.field || name;
    let fieldType = fields.get(name)?.type;
    let fieldOptions = fields.get(name)?.options;
    if (target) {
      const targetField = fields.get(target) as Field;
      const targetCollection = db.getCollection(targetField.target);
      const targetFields = targetCollection.fields;
      fieldType = targetFields.get(name)?.type;
      fieldOptions = targetFields.get(name)?.options;
      field = `${target}.${field}`;
      name = `${target}.${name}`;
      const targetType = fields.get(target)?.type;
      if (!models[target]) {
        models[target] = { type: targetType };
      }
    } else {
      field = `${collectionName}.${field}`;
    }
    return {
      ...selected,
      field,
      name,
      type: fieldType,
      options: fieldOptions,
      alias: selected.alias || name,
    };
  };

  const parsedMeasures = measures?.map(parseField) || [];
  const parsedDimensions = dimensions?.map(parseField) || [];
  const parsedOrders = orders?.map(parseField) || [];
  const include = Object.entries(models).map(([target, { type }]) => {
    let options = {
      association: target,
      attributes: [],
    };
    if (type === 'belongsToMany') {
      options['through'] = { attributes: [] };
    }
    if (type === 'belongsToArray') {
      const association = associations[target] as BelongsToArrayAssociation;
      if (association) {
        options = {
          ...options,
          ...association.generateInclude(),
        };
      }
    }
    return options;
  });

  const filterParser = new FilterParser(filter, {
    collection,
  });
  const { where, include: filterInclude } = filterParser.toSequelizeParams();
  if (filterInclude) {
    // Remove attributes from through table
    const stack = [...filterInclude];
    while (stack.length) {
      const item = stack.pop();

      const parentCollection = db.getCollection(item.parentCollection || collectionName);
      const field = parentCollection.fields.get(item.association);
      if (field?.type === 'belongsToMany') {
        item.through = { attributes: [] };
      }
      if (field?.target && item.include?.length) {
        for (const child of item.include) {
          child.parentCollection = field.target;
          stack.push(child);
        }
      }
    }
  }
  ctx.action.params.values = {
    ...ctx.action.params.values,
    where,
    measures: parsedMeasures,
    dimensions: parsedDimensions,
    orders: parsedOrders,
    include: [...include, ...(filterInclude || [])],
  };
  await next();
};

export const parseVariables = async (ctx: Context, next: Next) => {
  const { filter } = ctx.action.params.values;
  ctx.action.params.filter = filter;
  await middlewares.parseVariables(ctx, async () => {
    ctx.action.params.values.filter = ctx.action.params.filter;
    await next();
  });
};

export const cacheMiddleware = async (ctx: Context, next: Next) => {
  const { uid, cache: cacheConfig, refresh } = ctx.action.params.values as QueryParams;
  const cache = ctx.app.cacheManager.getCache('data-visualization') as Cache;
  const useCache = cacheConfig?.enabled && uid;

  if (useCache && !refresh) {
    const data = await cache.get(uid);
    if (data) {
      ctx.body = data;
      return;
    }
  }
  await next();
  if (useCache) {
    await cache.set(uid, ctx.body, cacheConfig?.ttl * 1000);
  }
};

export const checkPermission = (ctx: Context, next: Next) => {
  const { collection, dataSource } = ctx.action.params.values as QueryParams;
  const roleNames = ctx.state.currentRoles || ['anonymous'];
  const acl = ctx.app.dataSourceManager.get(dataSource)?.acl || ctx.app.acl;
  const can = acl.can({ roles: roleNames, resource: collection, action: 'list' });
  if (!can && !roleNames.includes('root')) {
    ctx.throw(403, 'No permissions');
  }
  return next();
};

export const query = async (ctx: Context, next: Next) => {
  const { dataSource } = ctx.action.params.values as QueryParams;
  const db = getDB(ctx, dataSource) || ctx.db;
  const queryParser = createQueryParser(db);
  try {
    await compose([
      checkPermission,
      cacheMiddleware,
      parseVariables,
      parseFieldAndAssociations,
      queryParser.parse(),
      queryData,
      postProcess,
    ])(ctx, next);
  } catch (err) {
    ctx.throw(500, err);
  }
};
