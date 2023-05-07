import { Context } from '@nocobase/actions';
import { ROLE_NAMESPACE } from '../constants';

const getRepositoryFromCtx = (ctx: Context) => {
  return ctx.db.getCollection(ROLE_NAMESPACE).repository;
};

export const customRequestRolesActions = {
  get: async (ctx: Context, next) => {
    const { params: values } = ctx.action;
    const repo = getRepositoryFromCtx(ctx);
    const key = values.filterByTk;

    const record = await repo.findOne({
      filter: { customRequestKey: key },
    });
    ctx.body = record || {};
    return next();
  },
  set: async (ctx: Context, next) => {
    const { params: values } = ctx.action;
    const repo = getRepositoryFromCtx(ctx);
    const customRequestKey = values.values?.customRequestKey;
    const roleName = values.values?.roleName;
    const record = await repo.findOne({
      filter: { customRequestKey, roleName },
    });
    if (record) {
      repo.destroy({
        filter: { customRequestKey, roleName },
      });
    } else {
      await repo.create({
        values: {
          customRequestKey,
          roleName,
        },
      });
    }

    ctx.body = 'ok';
    return next();
  },
  list: async (ctx: Context, next) => {
    const repo = getRepositoryFromCtx(ctx);
    const record = await repo.find();
    ctx.body = record || [];
    return next();
  },
};
