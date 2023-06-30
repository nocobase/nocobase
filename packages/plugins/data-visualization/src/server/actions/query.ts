import { Context, Next } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';
import { FilterParser, snakeCase } from '@nocobase/database';
import ChartsV2Plugin from '../plugin';
import { formatter } from './formatter';

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

export const parseFieldAndAssociations = (ctx: Context, params: QueryParams) => {
  const { collection: collectionName, measures, dimensions, orders, filter } = params;
  const collection = ctx.db.getCollection(collectionName);
  const fields = collection.fields;
  const underscored = ctx.db.options.underscored;
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
    let field = underscored ? snakeCase(name) : name;
    let type = fields.get(name)?.type;
    if (target) {
      field = `${target}.${field}`;
      name = `${target}.${name}`;
      type = fields.get(target)?.type;
      if (!models[target]) {
        models[target] = { type };
      }
    } else {
      field = `${collectionName}.${field}`;
    }
    return {
      ...selected,
      field,
      name,
      type,
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

  return {
    where,
    measures: parsedMeasures,
    dimensions: parsedDimensions,
    orders: parsedOrders,
    include: [...include, ...(parsedFilterInclude || [])],
  };
};

export const parseBuilder = (ctx: Context, builder: QueryParams) => {
  const { sequelize } = ctx.db;
  const { limit } = builder;
  const { measures, dimensions, orders, include, where } = parseFieldAndAssociations(ctx, builder);
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
    const name = hasAgg ? sequelize.literal(`"${item.alias}"`) : sequelize.col(item.field as string);
    order.push([name, item.order || 'ASC']);
  });

  return {
    queryParams: {
      where,
      attributes,
      include,
      group,
      order,
      limit: limit > 2000 ? 2000 : limit,
      raw: true,
    },
    fieldMap,
  };
};

export const processData = (ctx: Context, data: any[], fieldMap: { [source: string]: { type?: string } }) => {
  const { sequelize } = ctx.db;
  const dialect = sequelize.getDialect();
  switch (dialect) {
    case 'postgres':
      // https://github.com/sequelize/sequelize/issues/4550
      return data.map((record) => {
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
    default:
      return data;
  }
};

export const queryData = async (ctx: Context, builder: QueryParams) => {
  const { collection, measures, dimensions, orders, filter, limit, sql } = builder;
  const model = ctx.db.getModel(collection);
  const { queryParams, fieldMap } = parseBuilder(ctx, { collection, measures, dimensions, orders, filter, limit });
  const data = await model.findAll(queryParams);
  return processData(ctx, data, fieldMap);
  // if (!sql) {
  //   return await repository.find(parseBuilder(ctx, { collection, measures, dimensions, orders, filter, limit }));
  // }

  // const statement = `SELECT ${sql.fields} FROM ${collection} ${sql.clauses}`;
  // const [data] = await ctx.db.sequelize.query(statement);
  // return data;
};

export const cacheWrap = async (
  cache: Cache,
  options: {
    func: () => Promise<any>;
    key: string;
    ttl?: number;
    useCache?: boolean;
    refresh?: boolean;
  },
) => {
  const { func, key, ttl, useCache, refresh } = options;
  if (useCache && !refresh) {
    const data = await cache.get(key);
    if (data) {
      return data;
    }
  }
  const data = await func();
  if (useCache) {
    await cache.set(key, data, ttl);
  }
  return data;
};

export const query = async (ctx: Context, next: Next) => {
  const {
    uid,
    collection,
    measures,
    dimensions,
    orders,
    filter,
    limit,
    sql,
    cache: cacheConfig,
    refresh,
  } = ctx.action.params.values as QueryParams;
  const roleName = ctx.state.currentRole || 'anonymous';
  const can = ctx.app.acl.can({ role: roleName, resource: collection, action: 'list' });
  if (!can && roleName !== 'root') {
    ctx.throw(403, 'No permissions');
  }

  const plugin = ctx.app.getPlugin('data-visualization') as ChartsV2Plugin;
  const cache = plugin.cache;
  const useCache = cacheConfig?.enabled && uid;

  try {
    ctx.body = await cacheWrap(cache, {
      func: async () => await queryData(ctx, { collection, measures, dimensions, orders, filter, limit, sql }),
      key: uid,
      ttl: cacheConfig?.ttl || 30,
      useCache: useCache ? true : false,
      refresh,
    });
  } catch (err) {
    ctx.app.logger.error('charts query: ', err);
    ctx.throw(500, err);
  }

  await next();
};
