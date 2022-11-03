import winston, { LoggerOptions, Logger } from 'winston';
import KoaLogger from './middlewares/koa-logger';

function createLogger(options: LoggerOptions = {}) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
  });
}

export { Logger, createLogger, KoaLogger };
