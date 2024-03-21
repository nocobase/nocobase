import { randomUUID } from 'crypto';
import Koa from 'koa';
import { pick } from 'lodash';
import { createLogger, LoggerOptions } from './create-logger';

const defaultRequestWhitelist = [
  'action',
  'header.x-role',
  'header.x-hostname',
  'header.x-timezone',
  'header.x-locale',
  'referer',
];

const defaultResponseWhitelist = ['status'];

export interface AppLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}

export function createAppLogger(options: AppLoggerOptions = {}) {
  const {
    skip,
    requestWhitelist = defaultRequestWhitelist,
    responseWhitelist = defaultResponseWhitelist,
    ...others
  } = options;
  const instance = createLogger(others);
  const middleware = async (ctx: Koa.Context, next: Koa.Next) => {
    if (skip && (await skip(ctx))) {
      return next();
    }
    const logger = ctx.app['logger'];
    const startTime = Date.now();
    const info = {
      level: 'info',
      message: `END: ${ctx.method} ${ctx.url}`,
      req: ctx.request.toJSON(),
    };

    ctx.reqId = ctx.req['id'] = randomUUID();
    ctx.logger = ctx.log = logger.child({ reqId: ctx.reqId });

    ctx.logger.info(`BEGIN: ${ctx.method} ${ctx.url}`);

    let error;

    try {
      await next();
    } catch (e) {
      error = e;
    } finally {
      info['res'] = ctx.response.toJSON();
      // info['status'] = ctx.status;
      if (Math.floor(ctx.status / 100) == 5) {
        info.level = 'error';
        info['errors'] = ctx.body?.['errors'] || ctx.body;
      } else if (Math.floor(ctx.status / 100) == 4) {
        info.level = 'warn';
        info['errors'] = ctx.body?.['errors'] || ctx.body;
      }
      info['responseTime'] = Date.now() - startTime;
      if (ctx.action) {
        info['req']['action'] = ctx.action?.toJSON?.();
      }
      info['req'] = pick(info['req'], requestWhitelist);
      info['res'] = pick(info['res'], responseWhitelist);

      ctx.logger.log(info);
    }

    if (error) {
      throw error;
    }
  };

  return { instance, middleware };
}

export default createAppLogger;
