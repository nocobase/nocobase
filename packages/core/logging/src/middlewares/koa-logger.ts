import { randomUUID } from 'crypto';
import { Logger } from 'winston';

function KoaLogger(options: { logger: Logger }) {
  const { logger } = options;
  return (ctx, next) => {
    ctx.log = logger;
    ctx.reqId = ctx.req.id = randomUUID();

    ctx.log.info(`<-- ${ctx.method} ${ctx.url}`, {
      reqId: ctx.reqId,
    });

    next()
      .then(() => {
        ctx.log.info(`--> ${ctx.method} ${ctx.url}`, {
          reqId: ctx.reqId,
          status: ctx.status,
        });
      })
      .catch((err) => {
        ctx.log.error(err, {
          reqId: ctx.reqId,
        });
        throw err;
      });
  };
}

export default KoaLogger;
