/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger, LoggerOptions } from './logger';
import { pick, omit } from 'lodash';
const defaultRequestWhitelist = [
  'action',
  'header.x-role',
  'header.x-hostname',
  'header.x-timezone',
  'header.x-locale',
  'header.x-authenticator',
  'header.x-data-source',
  'referer',
];
const defaultResponseWhitelist = ['status'];
const defaultActionBlackList = [
  'params.values.password',
  'params.values.confirmPassword',
  'params.values.oldPassword',
  'params.values.newPassword',
];

export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}

export const requestLogger = (appName: string, requestLogger: Logger, options?: RequestLoggerOptions) => {
  return async function requestLoggerMiddleware(ctx, next) {
    const reqId = ctx.reqId;
    const path = /^\/api\/(.+):(.+)/.exec(ctx.path);
    const contextLogger = ctx.app.log.child({ reqId, module: path?.[1], submodule: path?.[2] });
    // ctx.reqId = reqId;
    ctx.logger = ctx.log = contextLogger;
    const startTime = Date.now();
    const requestInfo = {
      method: ctx.method,
      path: ctx.url,
    };
    requestLogger.info({
      message: `request ${ctx.method} ${ctx.url}`,
      ...requestInfo,
      req: pick(ctx.request.toJSON(), options?.requestWhitelist || defaultRequestWhitelist),
      action: ctx.action?.toJSON?.(),
      app: appName,
      reqId,
    });
    let error: Error;
    try {
      await next();
    } catch (e) {
      error = e;
    } finally {
      const cost = Date.now() - startTime;
      const status = ctx.status;
      const info = {
        message: `response ${ctx.url}`,
        ...requestInfo,
        res: pick(ctx.response.toJSON(), options?.responseWhitelist || defaultResponseWhitelist),
        action: omit(ctx.action?.toJSON?.(), defaultActionBlackList),
        userId: ctx.auth?.user?.id,
        username: ctx.auth?.user?.username,
        status: ctx.status,
        cost,
        app: appName,
        reqId,
        bodySize: ctx.response.length,
      };
      if (Math.floor(status / 100) == 5) {
        requestLogger.error({ ...info, res: ctx.body?.['errors'] || ctx.body });
      } else if (Math.floor(status / 100) == 4) {
        requestLogger.warn({ ...info, res: ctx.body?.['errors'] || ctx.body });
      } else {
        requestLogger.info(info);
      }
    }

    ctx.res.setHeader('X-Request-Id', reqId);

    if (error) {
      throw error;
    }
  };
};
