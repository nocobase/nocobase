import KoaLogger from './middlewares/koa-logger';
import pino, { LoggerOptions, Logger } from 'pino';

function createLogger(options: LoggerOptions = {}) {
  return pino();
}

export { Logger, createLogger, KoaLogger };
