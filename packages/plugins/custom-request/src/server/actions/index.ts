import { Context } from '@nocobase/actions';
import axios from 'axios';
import { formatParamsIntoObject, NAME_SPACE } from './utils';
import isEmpty from 'lodash/isEmpty';
import { checkSendPermission } from '../send-middleware';
import { getDateVars, parseFilter } from '@nocobase/utils';

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
      const sameNameRecord = await repo.findOne({
        filter: { name: options.name },
      });
      if (sameNameRecord) {
        ctx.throw(400, ctx.t('unique violation', { field: ctx.t('Request name'), ns: 'error-handler' }));
      }
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
      ctx.throw(404, ctx.t('request config not exists', { ns: NAME_SPACE }));
    }
    const { data = {}, method, headers, params, url, timeout = 5000, requestType } = record.options;

    // url 非空校验
    if (isEmpty(url)) {
      ctx.throw(400, ctx.t('notNull violation', { ns: 'error-handler' }));
    }

    await checkSendPermission(ctx, next);

    const state = JSON.parse(JSON.stringify(ctx.state));

    const generateOptions = () => ({
      timezone: ctx.get('x-timezone'),
      vars: {
        $currentRecord: values.values,
        $date: getDateVars(),
        ctx: { state },
        $user: async () => state.currentUser,
      },
    });
    const parsedData = await parseFilter(data || {}, generateOptions());
    const parsedHeaders = await parseFilter(formatParamsIntoObject(headers || {}), generateOptions());
    const parsedParams = await parseFilter(formatParamsIntoObject(params || {}), generateOptions());

    const tempParams = {
      url,
      method,
      headers: {
        ...parsedHeaders,
        'Content-Type': 'application/json; charset=UTF-8;',
      },
      params: parsedParams,
      data: parsedData,
      timeout,
    };
    if (requestType === 'internal') {
      if (!tempParams.url.startsWith(ctx.request.header.origin)) {
        tempParams.url = `${ctx.request.header.origin}${tempParams.url.startsWith('/') ? '' : '/'}${tempParams.url}`;
      }
      tempParams.headers = {
        ...tempParams.headers,
        ...ctx.request.header,
      };
    }

    try {
      const res = await axios(tempParams);
      ctx.body = res.data;
    } catch (e) {
      ctx.throw(500, e?.message);
    }
  },
};
