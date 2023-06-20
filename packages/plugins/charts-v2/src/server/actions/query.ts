import { Context, Next } from '@nocobase/actions';
import { formatter } from './formatter';
import { FilterParser, Repository, snakeCase } from '@nocobase/database';
import ChartsV2Plugin from '../plugin';
import { Cache } from '@nocobase/cache';

type QueryParams = Partial<{
  uid: string;
  collection: string;
  measures: {
    field: string;
    aggregate?: string;
    alias?: string;
  }[];
  dimensions: {
    field: string;
    alias?: string;
    format?: string;
  }[];
  orders: {
    field: string;
    order: 'asc' | 'desc';
  }[];
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

export const parseBuilder = (ctx: Context, builder: QueryParams) => {
  const { sequelize } = ctx.db;
  const { collection, measures, dimensions, orders, filter, limit } = builder;
  const underscored = ctx.db.options.underscored;
  const repository = ctx.db.getRepository(collection);
  const fields = repository.collection.fields;
  const attributes = [];
  const group = [];
  const order = [];
  const fieldMap = {};
  let hasAgg = false;
  measures?.forEach((item: { field: string; aggregation: string; alias: string }) => {
    const field = underscored ? snakeCase(item.field) : item.field;
    const attribute = [];
    const col = sequelize.col(field);
    if (item.aggregation) {
      hasAgg = true;
      attribute.push(sequelize.fn(item.aggregation, col));
    } else {
      attribute.push(field);
    }
    if (item.alias) {
      attribute.push(item.alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    fieldMap[item.alias || field] = field;
  });

  dimensions?.forEach((item: { field: string; format: string; alias: string }) => {
    const field = underscored ? snakeCase(item.field) : item.field;
    const type = fields.get(item.field).type;
    const attribute = [];
    if (item.format) {
      attribute.push(formatter(sequelize, type, field, item.format));
    } else {
      attribute.push(field);
    }
    if (item.alias) {
      attribute.push(item.alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    group.push(attribute.length > 1 ? attribute[1] : attribute[0]);
    fieldMap[item.alias || field] = field;
  });

  orders?.forEach((item: { field: string; order: string }) => {
    const field = underscored ? snakeCase(item.field) : item.field;
    order.push([field, item.order || 'ASC']);
  });

  const filterParser = new FilterParser(filter, {
    collection: repository.collection,
  });

  return {
    queryParams: {
      attributes,
      group: hasAgg ? group : [],
      order,
      limit: limit > 2000 ? 2000 : limit,
      ...filterParser.toSequelizeParams(),
    },
    fieldMap,
  };
};

export const process = (ctx: Context, repository: Repository, data: any[], fieldMap: { [source: string]: string }) => {
  const { sequelize } = ctx.db;
  const dialect = sequelize.getDialect();
  const fields = repository.collection.fields;
  switch (dialect) {
    case 'postgres':
      // https://github.com/sequelize/sequelize/issues/4550
      return data.map((record) => {
        const result = {};
        const dataValues = record.dataValues || {};
        Object.keys(dataValues).forEach((key) => {
          let value = dataValues[key];
          const field = fieldMap[key];
          const type = fields.get(field).type;
          console.log(type);
          switch (type) {
            case 'bigInt':
            case 'integer':
              value = parseInt(value);
              break;
            case 'float':
            case 'double':
              value = parseFloat(value);
              break;
          }
          result[key] = value;
        });
        console.log(result);
        record.dataValues = result;
        return record;
      });
    default:
      return data;
  }
};

export const queryData = async (ctx: Context, builder: QueryParams) => {
  const { collection, measures, dimensions, orders, filter, limit, sql } = builder;
  const repository = ctx.db.getRepository(collection);
  const { queryParams, fieldMap } = parseBuilder(ctx, { collection, measures, dimensions, orders, filter, limit });
  const data = await repository.find(queryParams);
  return process(ctx, repository, data, fieldMap);
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
  console.log(roleName);
  if (!can && roleName !== 'root') {
    ctx.throw(403, 'No permissions');
  }

  const plugin = ctx.app.getPlugin('charts-v2') as ChartsV2Plugin;
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
    ctx.app.logger.error('charts query', err);
    ctx.throw(500, err);
  }

  await next();
};
