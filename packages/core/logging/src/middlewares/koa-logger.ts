import { randomUUID } from 'crypto';
import { Logger } from 'winston';

function KoaLogger(options: { logger: Logger }) {
  const { logger } = options;
  return async (ctx, next) => {
    ctx.reqId = ctx.req.id = randomUUID();
    ctx.log = logger.child({ reqId: ctx.reqId });

    ctx.log.info(`<-- ${ctx.method} ${ctx.url}`);

    try {
      await next();
    } catch (error) {
      ctx.log.error(error);

      throw error;
    }

    ctx.log.info(`--> ${ctx.method} ${ctx.url}`, {
      status: ctx.status,
    });
  };
}

export default KoaLogger;
