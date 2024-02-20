import path from 'path';
import winston, { format, Logger } from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, colorize, simple } = format;

export function getLoggerLevel(): string {
  return process.env.LOGGER_LEVEL || 'info';
}

export function getLoggerFilePath(...paths: string[]): string {
  return path.resolve(process.env.LOGGER_BASE_PATH || path.resolve(process.cwd(), 'storage', 'logs'), ...paths);
}

const Transports = {
  console(options) {
    return new winston.transports.Console({
      format: combine(simple(), colorize()),
      ...options,
    });
  },
  dailyRotateFile(options: any = {}) {
    let dirname = getLoggerFilePath();
    if (!path.isAbsolute(dirname)) {
      dirname = path.resolve(process.cwd(), dirname);
    }
    return new winston.transports.DailyRotateFile({
      dirname,
      level: getLoggerLevel(),
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

// @deprecated
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
    level: getLoggerLevel(),
    levels: winston.config.cli.levels,
    format: combine(timestamp(), format.errors({ stack: true }), format.json(), colorize()),
    ...options,
    transports,
  });
  winston.addColors(winston.config.cli.colors);
  return logger;
}

export { createLogger, Logger, LoggerOptions, Transports };
