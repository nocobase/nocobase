import { Context, Next } from '@nocobase/actions';
import { Field, FilterParser, snakeCase } from '@nocobase/database';
import { formatter } from './formatter';
import compose from 'koa-compose';
import { parseFilter, getDateVars } from '@nocobase/utils';
import { Cache } from '@nocobase/cache';

type MeasureProps = {
  field: string | string[];
  type?: string;
  aggregation?: string;
  alias?: string;
};

type DimensionProps = {
  field: string | string[];
  type?: string;
  alias?: string;
  format?: string;
};

type OrderProps = {
  field: string | string[];
  alias?: string;
  order?: 'asc' | 'desc';
};

type QueryParams = Partial<{
  uid: string;
  collection: string;
  measures: MeasureProps[];
  dimensions: DimensionProps[];
  orders: OrderProps[];
  filter: any;
  limit: number;
  sql: {
    fields?: string;
    clauses?: string;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
  // Get the latest data from the database
  refresh: boolean;
}>;

export const postProcess = async (ctx: Context, next: Next) => {
  const { data, fieldMap } = ctx.action.params.values as {
    data: any[];
    fieldMap: { [source: string]: { type?: string } };
  };
  ctx.body = data.map((record) => {
    const result = {};
    Object.entries(record).forEach(([key, value]) => {
      const { type } = fieldMap[key] || {};
      switch (type) {
        case 'bigInt':
        case 'integer':
        case 'float':
        case 'double':
          value = Number(value);
          break;
      }
      result[key] = value;
    });
    return result;
  });
  await next();
};

export const queryData = async (ctx: Context, next: Next) => {
  const { collection, queryParams, fieldMap } = ctx.action.params.values;
  const model = ctx.db.getModel(collection);
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

export const parseBuilder = async (ctx: Context, next: Next) => {
  const { sequelize } = ctx.db;
  const { measures, dimensions, orders, include, where, limit } = ctx.action.params.values;
  const attributes = [];
  const group = [];
  const order = [];
  const fieldMap = {};
  let hasAgg = false;

  measures.forEach((measure: MeasureProps & { field: string }) => {
    const { field, aggregation, alias } = measure;
    const attribute = [];
    const col = sequelize.col(field);
    if (aggregation) {
      hasAgg = true;
      attribute.push(sequelize.fn(aggregation, col));
    } else {
      attribute.push(col);
    }
    if (alias) {
      attribute.push(alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    fieldMap[alias || field] = measure;
  });

  dimensions.forEach((dimension: DimensionProps & { field: string }) => {
    const { field, format, alias, type } = dimension;
    const attribute = [];
    const col = sequelize.col(field);
    if (format) {
      attribute.push(formatter(sequelize, type, field, format));
    } else {
      attribute.push(col);
    }
    if (alias) {
      attribute.push(alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    if (hasAgg) {
      group.push(attribute[0]);
    }
    fieldMap[alias || field] = dimension;
  });

  orders.forEach((item: OrderProps) => {
    const alias = sequelize.getQueryInterface().quoteIdentifier(item.alias);
    const name = hasAgg ? sequelize.literal(alias) : sequelize.col(item.field as string);
    order.push([name, item.order || 'ASC']);
  });

  ctx.action.params.values = {
    ...ctx.action.params.values,
    queryParams: {
      where,
      attributes,
      include,
      group,
      order,
      limit: limit || 2000,
      subQuery: false,
      raw: true,
    },
    fieldMap,
  };
  await next();
};

export const parseFieldAndAssociations = async (ctx: Context, next: Next) => {
  const { collection: collectionName, measures, dimensions, orders, filter } = ctx.action.params.values as QueryParams;
  const collection = ctx.db.getCollection(collectionName);
  const fields = collection.fields;
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
    if (target) {
      const targetField = fields.get(target) as Field;
      const targetCollection = ctx.db.getCollection(targetField.target);
      const targetFields = targetCollection.fields;
      fieldType = targetFields.get(name)?.type;
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
      alias: selected.alias || name,
    };
  };

  const parsedMeasures = measures?.map(parseField) || [];
  const parsedDimensions = dimensions?.map(parseField) || [];
  const parsedOrders = orders?.map(parseField) || [];
  const include = Object.entries(models).map(([target, { type }]) => ({
    association: target,
    attributes: [],
    ...(type === 'belongsToMany' ? { through: { attributes: [] } } : {}),
  }));

  const filterParser = new FilterParser(filter, {
    collection,
  });
  const { where, include: filterInclude } = filterParser.toSequelizeParams();
  const parsedFilterInclude = filterInclude?.map((item) => {
    if (fields.get(item.association)?.type === 'belongsToMany') {
      item.through = { attributes: [] };
    }
    return item;
  });

  ctx.action.params.values = {
    ...ctx.action.params.values,
    where,
    measures: parsedMeasures,
    dimensions: parsedDimensions,
    orders: parsedOrders,
    include: [...include, ...(parsedFilterInclude || [])],
  };
  await next();
};

export const parseVariables = async (ctx: Context, next: Next) => {
  const { filter } = ctx.action.params.values;
  if (!filter) {
    return next();
  }
  const isNumeric = (str: any) => {
    if (typeof str === 'number') return true;
    if (typeof str != 'string') return false;
    return !isNaN(str as any) && !isNaN(parseFloat(str));
  };
  const getUser = () => {
    return async ({ fields }) => {
      const userFields = fields.filter((f) => f && ctx.db.getFieldByPath('users.' + f));
      ctx.logger?.info('parse filter variables', { userFields, method: 'parseVariables' });
      if (!ctx.state.currentUser) {
        return;
      }
      if (!userFields.length) {
        return;
      }
      const user = await ctx.db.getRepository('users').findOne({
        filterByTk: ctx.state.currentUser.id,
        fields: userFields,
      });
      ctx.logger?.info('parse filter variables', {
        $user: user?.toJSON(),
        method: 'parseVariables',
      });
      return user;
    };
  };
  ctx.action.params.values.filter = await parseFilter(filter, {
    timezone: ctx.get('x-timezone'),
    now: new Date().toISOString(),
    getField: (path: string) => {
      const fieldPath = path
        .split('.')
        .filter((p) => !p.startsWith('$') && !isNumeric(p))
        .join('.');
      const { resourceName } = ctx.action;
      return ctx.db.getFieldByPath(`${resourceName}.${fieldPath}`);
    },
    vars: {
      $nDate: getDateVars(),
      $user: getUser(),
    },
  });
  await next();
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

const checkPermission = (ctx: Context, next: Next) => {
  const { collection } = ctx.action.params.values as QueryParams;
  const roleName = ctx.state.currentRole || 'anonymous';
  const can = ctx.app.acl.can({ role: roleName, resource: collection, action: 'list' });
  if (!can && roleName !== 'root') {
    ctx.throw(403, 'No permissions');
  }
  return next();
};

export const query = async (ctx: Context, next: Next) => {
  try {
    await compose([
      checkPermission,
      cacheMiddleware,
      parseVariables,
      parseFieldAndAssociations,
      parseBuilder,
      queryData,
      postProcess,
    ])(ctx, next);
  } catch (err) {
    ctx.throw(500, err);
  }
};
