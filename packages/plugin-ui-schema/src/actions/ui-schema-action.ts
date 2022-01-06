import { Context } from '@nocobase/actions';
import UiSchemaRepository from '../repository';
import { values } from 'lodash';

const getRepositoryFromCtx = (ctx: Context) => {
  return ctx.db.getCollection('ui_schemas').repository as UiSchemaRepository;
};

export const uiSchemaActions = {
  async getJsonSchema(ctx: Context, next) {
    const { resourceIndex } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    ctx.body = await repository.getJsonSchema(resourceIndex);
    await next();
  },

  async getProperties(ctx: Context, next) {
    const { resourceIndex } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    ctx.body = await repository.getProperties(resourceIndex);
    await next();
  },

  async insert(ctx: Context, next) {
    const { values } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    await repository.insert(values);

    ctx.body = {
      result: 'ok',
    };

    await next();
  },

  async remove(ctx: Context, next) {
    const { resourceIndex } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    await repository.remove(resourceIndex);

    ctx.body = {
      result: 'ok',
    };

    await next();
  },

  async patch(ctx: Context, next) {
    const { values } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    await repository.patch(values);

    ctx.body = {
      result: 'ok',
    };

    await next();
  },

  async insertAdjacent(ctx: Context, next) {
    const { resourceIndex, position, values } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    await repository.insertAdjacent(position, resourceIndex, values);

    ctx.body = {
      result: 'ok',
    };

    await next();
  },
  insertBeforeBegin: insertPositionActionBuilder('beforeBegin'),
  insertAfterBegin: insertPositionActionBuilder('afterBegin'),
  insertBeforeEnd: insertPositionActionBuilder('beforeEnd'),
  insertAfterEnd: insertPositionActionBuilder('afterEnd'),
};

function insertPositionActionBuilder(position: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd') {
  return async function (ctx: Context, next) {
    const { resourceIndex, values } = ctx.action.params;
    const repository = getRepositoryFromCtx(ctx);
    await repository.insertAdjacent(position, resourceIndex, values);
    ctx.body = {
      result: 'ok',
    };

    await next();
  };
}
