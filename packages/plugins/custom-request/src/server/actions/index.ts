import { Context } from '@nocobase/actions';
import axios from 'axios';
import { formatParamsIntoObject } from './utils';

export const getRepositoryFromCtx = (ctx: Context, name = 'customRequest') => {
  return ctx.db.getCollection(name).repository;
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
    const rolesRepo = getRepositoryFromCtx(ctx, 'rolesCustomRequest');
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
          roleName: ctx.state.currentRole,
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
    const repo = getRepositoryFromCtx(ctx);
    const key = values.filterByTk;

    const record = await repo.findOne({
      filter: { key },
    });

    if (!record) {
      ctx.throw(404);
    }

    const { data, method, headers, params, url, timeout = 5000 } = record.options;
    const tempParams = {
      url,
      method,
      headers: formatParamsIntoObject(headers),
      params: formatParamsIntoObject(params),
      data,
      timeout,
    };
    try {
      const res = await axios(tempParams);
      ctx.body = res?.data;
      return next();
    } catch (e) {
      ctx.status = 500;
      ctx.body = {
        message: e?.message,
        code: e?.code,
      };
      return next();
    }
  },
};
