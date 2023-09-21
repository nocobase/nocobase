import { customLogger } from './logger';
import { systemLogger } from './system-logger';
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

export const requestLogger = (appName: string) => {
  return async (ctx, next) => {
    const reqId = ctx.reqId;
    const requestLogger = customLogger(`${appName}_request`);
    const path = /^\/api\/(.+):(.+)/.exec(ctx.path);
    const contextLogger = systemLogger(appName, 'context').child({ reqId, module: path?.[1], submodule: path?.[2] });
    // ctx.reqId = reqId;
    ctx.logger = ctx.log = contextLogger;
    const startTime = Date.now();
    const requestInfo = {
      method: ctx.method,
      path: ctx.url,
    };
    requestLogger.info({
      reqId,
      message: 'request',
      ...requestInfo,
      req: pick(ctx.request.toJSON(), defaultRequestWhitelist),
      action: ctx.action?.toJSON?.(),
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
        reqId,
        message: 'response',
        ...requestInfo,
        res: pick(ctx.response.toJSON(), defaultResponseWhitelist),
        action: ctx.action?.toJSON?.(),
        userId: ctx.auth?.user?.id,
        status: ctx.status,
        cost,
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
