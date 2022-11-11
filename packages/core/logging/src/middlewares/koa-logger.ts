import { randomUUID } from 'crypto';
import Koa from 'koa';
import { Logger } from 'winston';

function KoaLogger(options: { logger: Logger }) {
  const { logger } = options;
  return async (ctx: Koa.Context, next) => {
    const startTime = Date.now();
    const info = {
      level: 'info',
      status: 200,
      message: `END: ${ctx.method} ${ctx.url}`,
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
      info['status'] = ctx.status;
      if (Math.floor(ctx.status / 100) == 5) {
        info.level = 'error';
        info['errors'] = ctx.body?.['errors'] || ctx.body;
      } else if (Math.floor(ctx.status / 100) == 4) {
        info.level = 'warn';
        info['errors'] = ctx.body?.['errors'] || ctx.body;
      }
      info['duration'] = Date.now() - startTime;
      if (ctx.action) {
        info['action'] = ctx.action?.toJSON?.();
      }
      ctx.logger.log(info);
    }

    if (error) {
      throw error;
    }
  };
}

export default KoaLogger;
