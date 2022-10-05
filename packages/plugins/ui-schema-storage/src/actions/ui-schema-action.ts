import { Context } from '@nocobase/actions';
import { ActionParams } from '@nocobase/resourcer';
import lodash from 'lodash';
import UiSchemaRepository, { GetJsonSchemaOptions } from '../repository';

const getRepositoryFromCtx = (ctx: Context) => {
  const repo = ctx.db.getCollection('uiSchemas').repository as UiSchemaRepository;
  repo.setCache(ctx.cache);
  return repo;
};

const cacheMethods = {
  getJsonSchema: async (ctx: Context, params, options: GetJsonSchemaOptions, func) => {
    if (options?.includeAsyncNode) {
      return func(params, options);
    }
    return ctx.cache.wrap(params, func);
  },
  getProperties: async (ctx: Context, params, options, func) => {
    return ctx.cache.wrap(params, func);
  },
};

const callRepositoryMethod = (method, paramsKey: 'resourceIndex' | 'values', optionsBuilder?) => {
  return async (ctx, next) => {
    const params = lodash.get(ctx.action.params, paramsKey);
    const options = optionsBuilder ? optionsBuilder(ctx.action.params) : {};

    let returnValue;
    if (!!cacheMethods[method]) {
      returnValue = await cacheMethods[method](ctx, params, options, () => {
        const repository = getRepositoryFromCtx(ctx);
        return repository[method](params, options);
      });
    } else {
      const repository = getRepositoryFromCtx(ctx);
      returnValue = await repository[method](params, options);
    }

    ctx.body = returnValue || {
      result: 'ok',
    };

    await next();
  };
};

function parseInsertAdjacentValues(values) {
  if (lodash.has(values, 'schema')) {
    return values;
  }

  return { schema: values, wrap: null };
}

export const uiSchemaActions = {
  getJsonSchema: callRepositoryMethod('getJsonSchema', 'resourceIndex', (params: ActionParams) => {
    return {
      includeAsyncNode: params?.includeAsyncNode,
    };
  }),

  getProperties: callRepositoryMethod('getProperties', 'resourceIndex'),
  insert: callRepositoryMethod('insert', 'values'),
  insertNewSchema: callRepositoryMethod('insertNewSchema', 'values'),
  remove: callRepositoryMethod('remove', 'resourceIndex'),
  patch: callRepositoryMethod('patch', 'values'),
  batchPatch: callRepositoryMethod('batchPatch', 'values'),
  clearAncestor: callRepositoryMethod('clearAncestor', 'resourceIndex'),

  async insertAdjacent(ctx: Context, next) {
    const { resourceIndex, position, values, removeParentsIfNoChildren, breakRemoveOn } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);

    const { schema, wrap } = parseInsertAdjacentValues(values);

    ctx.body = await repository.insertAdjacent(position, resourceIndex, schema, {
      removeParentsIfNoChildren,
      breakRemoveOn,
      wrap,
    });

    await next();
  },

  insertBeforeBegin: insertPositionActionBuilder('beforeBegin'),
  insertAfterBegin: insertPositionActionBuilder('afterBegin'),
  insertBeforeEnd: insertPositionActionBuilder('beforeEnd'),
  insertAfterEnd: insertPositionActionBuilder('afterEnd'),

  async saveAsTemplate(ctx: Context, next) {
    const { filterByTk, values } = ctx.action.params;
    const db = ctx.db;
    const transaction = await db.sequelize.transaction();
    try {
      await db.getRepository('uiSchemaTemplates').create({
        values: {
          ...values,
          uid: filterByTk,
        },
        transaction,
      });
      await db.getRepository<UiSchemaRepository>('uiSchemas').clearAncestor(filterByTk, { transaction });
      ctx.body = {
        result: 'ok',
      };
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    await next();
  },
};

function insertPositionActionBuilder(position: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd') {
  return async function (ctx: Context, next) {
    const { resourceIndex, values, removeParentsIfNoChildren, breakRemoveOn } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    const { schema, wrap } = parseInsertAdjacentValues(values);

    ctx.body = await repository.insertAdjacent(position, resourceIndex, schema, {
      removeParentsIfNoChildren,
      breakRemoveOn,
      wrap,
    });
    await next();
  };
}
