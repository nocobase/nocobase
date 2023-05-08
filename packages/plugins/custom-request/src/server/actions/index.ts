import { Context } from '@nocobase/actions';
import { NAMESPACE, ROLE_NAMESPACE } from '../constants';
import axios from 'axios';

const getRepositoryFromCtx = (ctx: Context, nameSpace = NAMESPACE) => {
  return ctx.db.getCollection(nameSpace).repository;
};

export const customRequestActions = {
  get: async (ctx: Context, next) => {
    const { params: values } = ctx.action;
    const repo = getRepositoryFromCtx(ctx);
    const key = values.filterByTk;

    const record = await repo.findOne({
      filter: { key },
    });
    ctx.body = record || {};
    return next();
  },
  set: async (ctx: Context, next) => {
    const { params: values } = ctx.action;
    const repo = getRepositoryFromCtx(ctx);
    const rolesRepo = getRepositoryFromCtx(ctx, ROLE_NAMESPACE);
    const key = values.values?.key;
    const options = values.values?.options;
    const record = await repo.findOne({
      filter: { key },
    });
    if (record) {
      await repo.update({
        values: {
          options,
          name: options.name,
        },
        filter: {
          key,
        },
      });
    } else {
      await repo.create({
        values: {
          key,
          options,
          name: options.name,
        },
      });
      await rolesRepo.create({
        values: {
          customRequestKey: key,
          roleName: ctx.request.headers['x-role'],
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
  send: async (ctx: Context, next) => {
    const { params: values } = ctx.action;
    const res = await axios({
      ...values?.values,
    });
    ctx.body = res?.data;
    return next();
  },
};
