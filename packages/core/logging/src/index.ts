import path from 'path';
import KoaLogger from './middlewares/koa-logger';
import winston, { Logger, format } from 'winston';
const { combine, timestamp, label, prettyPrint, json } = format;
import 'winston-daily-rotate-file';

function loggingLevel() {
  return process.env.LOGGING_LEVEL || 'info';
}

function createLogger(options: any) {
  const logger = winston.createLogger({
    level: loggingLevel(),
    format: combine(timestamp(), format.errors({ stack: true }), format.json()),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  });

  if (options.basePath) {
    const storagePath = path.resolve(options.basePath, './storage/logs');

    logger.add(
      new winston.transports.DailyRotateFile({
        dirname: storagePath,
        level: loggingLevel(),
        filename: 'nocobase-%DATE%.log',
        datePattern: 'YYYY-MM-DD-HH',
        maxFiles: '14d',
      }),
    );
  }
  return logger;
}

export { Logger, createLogger, KoaLogger };
