import path from 'path';
import winston, { format, Logger } from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, colorize, simple } = format;

function loggingLevel() {
  return process.env.LOGGER_LEVEL || 'info';
}

const Transports = {
  console(options) {
    return new winston.transports.Console({
      format: combine(simple(), colorize()),
      ...options,
    });
  },
  dailyRotateFile(options: any) {
    let dirname = process.env.DAILY_ROTATE_FILE_DIRNAME || path.resolve(process.cwd(), './storage/logs');
    if (!path.isAbsolute(dirname)) {
      dirname = path.resolve(process.cwd(), dirname);
    }
    return new winston.transports.DailyRotateFile({
      dirname,
      level: loggingLevel(),
      filename: 'nocobase-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      maxFiles: '14d',
      ...options,
    });
  },
};

function toArr(value: any) {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? value.split(',') : [];
}

type WinstonTransport = string | string[] | winston.transport | winston.transport[];

interface LoggerOptions extends Omit<winston.LoggerOptions, 'transports'> {
  transports?: WinstonTransport;
}

function createLogger(options: LoggerOptions = {}) {
  const transports: winston.transport[] = toArr(options?.transports || ['console', 'dailyRotateFile'])
    .map((t) => {
      if (typeof t === 'string') {
        return Transports[t]();
      }
      return t;
    })
    .filter((t) => t);
  const logger = winston.createLogger({
    level: loggingLevel(),
    levels: winston.config.cli.levels,
    format: combine(timestamp(), format.errors({ stack: true }), format.json(), colorize()),
    ...options,
    transports,
  });
  winston.addColors(winston.config.cli.colors);
  return logger;
}

export { Logger, LoggerOptions, Transports, createLogger };
