import { getLoggerFilePath } from './config';
import { LoggerOptions, createLogger } from './logger';
import { pick } from 'lodash';
const defaultRequestWhitelist = [
  'action',
  'header.x-role',
  'header.x-hostname',
  'header.x-timezone',
  'header.x-locale',
  'referer',
];
const defaultResponseWhitelist = ['status'];

export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}

export const requestLogger = (appName: string, options?: RequestLoggerOptions) => {
  const requestLogger = createLogger({
    dirname: getLoggerFilePath(appName),
    filename: 'request',
    ...(options || {}),
  });
  return async (ctx, next) => {
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
        action: ctx.action?.toJSON?.(),
        userId: ctx.auth?.user?.id,
        status: ctx.status,
        cost,
        app: appName,
        reqId,
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
