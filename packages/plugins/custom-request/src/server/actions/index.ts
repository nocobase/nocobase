import { Context } from '@nocobase/actions';
import { NAMESPACE, ROLE_NAMESPACE } from '../constants';
import axios from 'axios';
import { formatParamsIntoObject } from './utils';

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
    const repo = getRepositoryFromCtx(ctx);
    const key = values.filterByTk;

    const record = await repo.findOne({
      filter: { key },
    });
    if (!record) {
      ctx.status = 404;
      ctx.body = {
        message: 'request not find',
        code: 404,
      };
      return next();
    }

    const rolesRepo = getRepositoryFromCtx(ctx, ROLE_NAMESPACE);
    const roleRecords = await rolesRepo.find({
      filter: { customRequestKey: key },
    });
    if (!roleRecords) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return next();
    }
    const roles = roleRecords.map((roleRecord) => roleRecord?.roleName);
    const currentRole = ctx.request.headers['x-role'];
    if (!roles.includes(currentRole)) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return next();
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
