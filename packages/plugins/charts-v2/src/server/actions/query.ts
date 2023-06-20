import { Context, Next } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';
import { FilterParser, Repository, snakeCase } from '@nocobase/database';
import ChartsV2Plugin from '../plugin';
import { formatter } from './formatter';

type MeasureProps = {
  field: string;
  aggregation?: string;
  alias?: string;
};

type DimensionProps = {
  field: string;
  alias?: string;
  format?: string;
};

type OrderProps = {
  field: string;
  order: 'asc' | 'desc';
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

export const parseBuilder = (ctx: Context, builder: QueryParams) => {
  const { sequelize } = ctx.db;
  const { collection, measures, dimensions, orders, filter, limit } = builder;
  const underscored = ctx.db.options.underscored;
  const repository = ctx.db.getRepository(collection);
  const fields = repository.collection.fields;
  const attributes = [];
  const group = [];
  const group2Alias = {};
  const order = [];
  const fieldMap = {};
  let hasAgg = false;
  const processSelected = (selected: MeasureProps | DimensionProps) => {
    const field = underscored ? snakeCase(selected.field) : selected.field;
    return {
      ...selected,
      field,
      alias: selected.alias || (field !== selected.field ? selected.field : undefined),
    };
  };

  measures?.forEach((item: MeasureProps) => {
    const measure = processSelected(item) as MeasureProps;
    const { field, aggregation, alias } = measure;
    const attribute = [];
    const col = sequelize.col(field);
    if (aggregation) {
      hasAgg = true;
      attribute.push(sequelize.fn(aggregation, col));
    } else {
      attribute.push(field);
    }
    if (alias) {
      attribute.push(alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    fieldMap[alias || field] = item.field;
  });

  dimensions?.forEach((item: DimensionProps) => {
    const dimension = processSelected(item) as DimensionProps;
    const { field, format, alias } = dimension;
    const type = fields.get(item.field).type;
    const attribute = [];
    if (format) {
      attribute.push(formatter(sequelize, type, field, format));
    } else {
      attribute.push(field);
    }
    if (alias) {
      attribute.push(alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    if (hasAgg) {
      group.push(attribute.length > 1 ? attribute[1] : attribute[0]);
      group2Alias[field] = alias;
    }
    fieldMap[alias || field] = item.field;
  });

  orders?.forEach((item: OrderProps) => {
    const field = underscored ? snakeCase(item.field) : item.field;
    order.push([group2Alias[field] || field, item.order || 'ASC']);
  });

  const filterParser = new FilterParser(filter, {
    collection: repository.collection,
  });

  return {
    queryParams: {
      attributes,
      group,
      order,
      limit: limit > 2000 ? 2000 : limit,
      ...filterParser.toSequelizeParams(),
    },
    fieldMap,
  };
};

export const processData = (
  ctx: Context,
  repository: Repository,
  data: any[],
  fieldMap: { [source: string]: string },
) => {
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
  return processData(ctx, repository, data, fieldMap);
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
