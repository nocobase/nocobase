import KoaLogger from './middlewares/koa-logger';
import pino, { LoggerOptions, Logger } from 'pino';

function createLogger(options: any = {}) {
  return pino({
    ...options,
  });
}

export { Logger, createLogger, KoaLogger };
