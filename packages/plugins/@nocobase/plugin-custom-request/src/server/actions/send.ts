import { Context, Next } from '@nocobase/actions';
import { parse } from '@nocobase/utils';

import axios from 'axios';

const getHeaders = (headers: Record<string, any>) => {
  return Object.keys(headers).reduce((hds, key) => {
    if (key.toLocaleLowerCase().startsWith('x-')) {
      hds[key] = headers[key];
    }
    return hds;
  }, {});
};

const arrayToObject = (arr: { name: string; value: string }[]) => {
  return arr.reduce((acc, cur) => {
    acc[cur.name] = cur.value;
    return acc;
  }, {});
};

const omitNullAndUndefined = (obj: any) => {
  return Object.keys(obj).reduce((acc, cur) => {
    if (obj[cur] !== null && typeof obj[cur] !== 'undefined') {
      acc[cur] = obj[cur];
    }
    return acc;
  }, {});
};

export async function send(ctx: Context, next: Next) {
  const { filterByTk, resourceName, values = {} } = ctx.action.params;
  const {
    currentRecord = {
      id: 0,
      appends: [],
      data: {},
    },
  } = values;

  // root role has all permissions
  if (ctx.state.currentRole !== 'root') {
    const crRepo = ctx.db.getRepository('customRequestsRoles');
    const hasRoles = await crRepo.find({
      filter: {
        customRequestKey: filterByTk,
      },
    });

    if (hasRoles.length) {
      if (!hasRoles.find((item) => item.roleName === ctx.state.currentRole)) {
        return ctx.throw(403, 'custom request no permission');
      }
    }
  }

  const repo = ctx.db.getRepository(resourceName);
  const requestConfig = await repo.findOne({
    filter: {
      key: filterByTk,
    },
  });

  if (!requestConfig) {
    ctx.throw(404, 'request config not found');
  }

  ctx.withoutDataWrapping = true;

  const { collectionName, url, headers = {}, params = {}, data = {}, ...options } = requestConfig.options;
  let currentRecordVariables = {};
  if (collectionName && typeof currentRecord.id !== 'undefined') {
    const recordRepo = ctx.db.getRepository(collectionName);
    currentRecordVariables = await recordRepo.findOne({
      filterByTk: currentRecord.id,
      appends: currentRecord.appends,
    });
  }

  const variables = {
    currentRecord: {
      ...currentRecordVariables,
      ...currentRecord.data,
    },
    currentUser: ctx.auth.user,
    currentTime: new Date().toISOString(),
  };

  try {
    ctx.body = await axios({
      baseURL: ctx.origin,
      ...options,
      url: parse(url)(variables),
      headers: {
        Authorization: 'Bearer ' + ctx.getBearerToken(),
        ...getHeaders(ctx.headers),
        ...omitNullAndUndefined(parse(arrayToObject(headers))(variables)),
      },
      params: parse(arrayToObject(params))(variables),
      data: parse(data)(variables),
    }).then((res) => {
      return res.data;
    });
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      ctx.status = err.response?.status || 500;
      ctx.body = err.response?.data || { message: err.message };
    } else {
      ctx.throw(500, err?.message);
    }
  }

  return next();
}
