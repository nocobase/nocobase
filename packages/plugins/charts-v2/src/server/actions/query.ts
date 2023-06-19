import { Context, Next } from '@nocobase/actions';
import { formatter } from './formatter';
import { FilterParser, Model } from '@nocobase/database';
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
  const repository = ctx.db.getRepository(collection);
  const fields = repository.collection.fields;
  const attributes = [];
  const group = [];
  const order = [];

  measures?.forEach((item: { field: string; aggregation: string; alias: string }) => {
    const attribute = [];
    const col = sequelize.col(item.field);
    if (item.aggregation) {
      attribute.push(sequelize.fn(item.aggregation, col));
    } else {
      attribute.push(item.field);
    }
    if (item.alias) {
      attribute.push(item.alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
  });

  dimensions?.forEach((item: { field: string; format: string; alias: string }) => {
    const type = fields.get(item.field).type;
    const attribute = [];
    if (item.format) {
      attribute.push(formatter(sequelize, type, item.field, item.format));
    } else {
      attribute.push(item.field);
    }
    if (item.alias) {
      attribute.push(item.alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    group.push(attribute.length > 1 ? attribute[1] : attribute[0]);
  });
  // add primary key to prevent error: "must appear in the GROUP BY clause or be used in an aggregate function"
  repository.collection.model.primaryKeyAttributes.forEach((key: string) => {
    group.push(key);
  });

  orders?.forEach((item: { field: string; order: string }) => {
    order.push([item.field, item.order || 'ASC']);
  });

  const filterParser = new FilterParser(filter, {
    collection: repository.collection,
  });

  return {
    attributes,
    group,
    order,
    limit: limit > 2000 ? 2000 : limit,
    ...filterParser.toSequelizeParams(),
  };
};

export const queryData = async (ctx: Context, builder: QueryParams) => {
  const { collection, measures, dimensions, orders, filter, limit, sql } = builder;
  const repository = ctx.db.getRepository(collection);
  return await repository.find(parseBuilder(ctx, { collection, measures, dimensions, orders, filter, limit }));
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
