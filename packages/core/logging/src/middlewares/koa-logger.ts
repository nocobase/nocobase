import { randomUUID } from 'crypto';
import { Logger } from 'winston';

function KoaLogger(options: { logger: Logger }) {
  const { logger } = options;
  return async (ctx, next) => {
    ctx.log = logger;
    ctx.reqId = ctx.req.id = randomUUID();

    ctx.log.info(`<-- ${ctx.method} ${ctx.url}`, {
      reqId: ctx.reqId,
    });

    try {
      await next();
    } catch (error) {
      ctx.log.error(error, {
        reqId: ctx.reqId,
      });
    }

    ctx.log.info(`--> ${ctx.method} ${ctx.url}`, {
      reqId: ctx.reqId,
      status: ctx.status,
    });
  };
}

export default KoaLogger;
