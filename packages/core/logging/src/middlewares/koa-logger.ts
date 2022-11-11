import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import lodash from 'lodash';

function KoaLogger(options: { logger: Logger }) {
  const { logger } = options;
  return async (ctx, next) => {
    ctx.reqId = ctx.req.id = randomUUID();
    const ctxLogger = logger.child({ reqId: ctx.reqId });

    ctx.logger = ctx.log = ctxLogger;

    ctx.logger.info(`<-- ${ctx.method} ${ctx.url}`, {
      headers: lodash.omit(ctx.headers, [
        'authorization',
        'cookie',
        'x-xsrf-token',
        'accept',
        'accept-encoding',
        'user-agent',
      ]),
      body: ctx.request.body,
    });

    try {
      await next();
    } catch (error) {
      ctx.logger.error(error);

      throw error;
    }

    const statusCode = ctx.status;
    let responseLevel = 'info';

    if (Math.floor(statusCode / 100) == 5) {
      responseLevel = 'error';
    }

    ctx.logger.log({
      level: responseLevel,
      message: `--> ${ctx.method} ${ctx.url}`,
      status: statusCode,
    });
  };
}

export default KoaLogger;
