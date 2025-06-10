/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { parse } from '@nocobase/utils';

import { appendArrayColumn } from '@nocobase/evaluators';
import Application from '@nocobase/server';
import axios from 'axios';
import CustomRequestPlugin from '../plugin';

function toJSON(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  return value;
}

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

const CurrentUserVariableRegExp = /{{\s*(currentUser[^}]+)\s*}}/g;

const getCurrentUserAppends = (str: string, user) => {
  const matched = str.matchAll(CurrentUserVariableRegExp);
  return Array.from(matched)
    .map((item) => {
      const keys = item?.[1].split('.') || [];
      const appendKey = keys[1];
      if (keys.length > 2 && !Reflect.has(user || {}, appendKey)) {
        return appendKey;
      }
    })
    .filter(Boolean);
};

export const getParsedValue = (value, variables) => {
  const template = parse(value);
  template.parameters.forEach(({ key }) => {
    appendArrayColumn(variables, key);
  });
  return template(variables);
};

export async function send(this: CustomRequestPlugin, ctx: Context, next: Next) {
  const resourceName = ctx.action.resourceName;
  const { filterByTk, values = {} } = ctx.action.params;
  const {
    currentRecord = {
      id: 0,
      appends: [],
      data: {},
    },
    $nForm,
    $nSelectedRecord,
  } = values;

  // root role has all permissions
  if (ctx.state.currentRole !== 'root') {
    const crRepo = ctx.db.getRepository('uiButtonSchemasRoles');
    const hasRoles = await crRepo.find({
      filter: {
        uid: filterByTk,
      },
    });
    if (hasRoles.length) {
      if (!hasRoles.some((item) => ctx.state.currentRoles.includes(item.roleName))) {
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

  const {
    dataSourceKey,
    collectionName,
    url,
    headers = [],
    params = [],
    data = {},
    ...options
  } = requestConfig.options || {};
  if (!url) {
    return ctx.throw(400, ctx.t('Please configure the request settings first', { ns: 'action-custom-request' }));
  }
  let currentRecordValues = {};
  if (collectionName && typeof currentRecord.id !== 'undefined') {
    const app = ctx.app as Application;
    const dataSource = app.dataSourceManager.get(dataSourceKey || currentRecord.dataSourceKey || 'main');
    const recordRepo = dataSource.collectionManager.getRepository(collectionName);
    currentRecordValues =
      (
        await recordRepo.findOne({
          filterByTk: currentRecord.id,
          appends: currentRecord.appends,
        })
      )?.toJSON() || {};
  }

  let currentUser = ctx.auth.user;

  const userAppends = getCurrentUserAppends(
    JSON.stringify(url) + JSON.stringify(headers) + JSON.stringify(params) + JSON.stringify(data),
    ctx.auth.user,
  );
  if (userAppends.length) {
    currentUser =
      (
        await ctx.db.getRepository('users').findOne({
          filterByTk: ctx.auth.user.id,
          appends: userAppends,
        })
      )?.toJSON() || {};
  }

  const variables = {
    currentRecord: {
      ...currentRecordValues,
      ...currentRecord.data,
    },
    currentUser,
    currentTime: new Date().toISOString(),
    $nToken: ctx.getBearerToken(),
    $nForm,
    $env: ctx.app.environment.getVariables(),
    $nSelectedRecord,
  };

  const axiosRequestConfig = {
    baseURL: ctx.origin,
    ...options,
    url: getParsedValue(url, variables),
    headers: {
      Authorization: 'Bearer ' + ctx.getBearerToken(),
      ...getHeaders(ctx.headers),
      ...omitNullAndUndefined(getParsedValue(arrayToObject(headers), variables)),
    },
    params: getParsedValue(arrayToObject(params), variables),
    data: getParsedValue(toJSON(data), variables),
  };

  const requestUrl = axios.getUri(axiosRequestConfig);
  this.logger.info(`custom-request:send:${filterByTk} request url ${requestUrl}`);
  this.logger.info(
    `custom-request:send:${filterByTk} request config ${JSON.stringify({
      ...axiosRequestConfig,
      headers: {
        ...axiosRequestConfig.headers,
        Authorization: null,
      },
    })}`,
  );

  try {
    const res = await axios(axiosRequestConfig);
    this.logger.info(`custom-request:send:${filterByTk} success`);
    ctx.body = res.data;
    if (res.headers['content-disposition']) {
      ctx.set('Content-Disposition', res.headers['content-disposition']);
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      ctx.status = err.response?.status || 500;
      ctx.body = err.response?.data || { message: err.message };
      this.logger.error(
        `custom-request:send:${filterByTk} error. status: ${ctx.status}, body: ${
          typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body)
        }`,
      );
    } else {
      this.logger.error(`custom-request:send:${filterByTk} error. status: ${ctx.status}, message: ${err.message}`);
      ctx.throw(500, err?.message);
    }
  }

  return next();
}
