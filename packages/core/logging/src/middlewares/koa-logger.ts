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

    const statusCode = ctx.status;
    let responseLogger = ctx.log.info;

    if (Math.floor(statusCode / 100) == 5) {
      responseLogger = ctx.log.error;
    }

    responseLogger(`--> ${ctx.method} ${ctx.url}`, {
      status: statusCode,
    });
  };
}

export default KoaLogger;
