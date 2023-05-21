import { Context } from '@nocobase/actions';

export const getRepositoryFromCtx = (ctx: Context, nameSpace = '') => {
  return ctx.db.getCollection(nameSpace).repository;
};
