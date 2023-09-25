import winston, { Logger } from 'winston';
import path from 'path';
import chalk from 'chalk';
import 'winston-daily-rotate-file';
import { SystemLoggerOptions } from './system-logger';
const DEFAULT_DELIMITER = '|';

interface LoggerOptions extends Omit<winston.LoggerOptions, 'transports'> {
  path?: string;
  filename?: string;
  transports?: (string | winston.transport)[];
}

export const getLoggerLevel = () =>
  process.env.LOGGER_LEVEL || (process.env.APP_ENV === 'development' ? 'debug' : 'info');

export const getLoggerFilePath = (...paths: string[]): string => {
  return path.resolve(process.env.LOGGER_BASE_PATH || path.resolve(process.cwd(), 'storage', 'logs'), ...paths);
};

export const getLoggerTransport = () =>
  (
    process.env.LOGGER_TRANSPORT || (process.env.APP_ENV === 'development' ? 'console' : 'console,dailyRotateFile')
  ).split(',');

export const getLoggerFormat = () => process.env.LOGGER_FORMAT || 'delimiter';

export const delimiterFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf((info) =>
    Object.entries(info)
      .map(([k, v]) => {
        if (k === 'message' && info['level'].includes('error')) {
          return chalk.red(v);
        }
        if (typeof v === 'object') {
          try {
            return JSON.stringify(v);
          } catch (error) {
            return String(v);
          }
        }
        if (k === 'reqId' && v) {
          return chalk.gray(v);
        }
        if ((k === 'module' || k === 'submodule') && v) {
          return chalk.cyan(v);
        }
        if (v === 'request' || v === 'response') {
          return chalk.green(v);
        }
        return v;
      })
      .join(DEFAULT_DELIMITER),
  ),
);

const escapeFormat: winston.Logform.Format = winston.format((info) => {
  let { message } = info;
  if (typeof message === 'string' && message.includes(DEFAULT_DELIMITER)) {
    message = message.replace(/"/g, '\\"');
    message = `"${message}"`;
  }
  return { ...info, message };
})();

const getTransports = (options: LoggerOptions) => {
  const { filename } = options;
  let { transports: configTransports, path: dirname } = options;
  configTransports = configTransports || getLoggerTransport();
  dirname = dirname || getLoggerFilePath();
  if (!path.isAbsolute(dirname)) {
    dirname = path.resolve(process.cwd(), dirname);
  }
  const configFormat = getLoggerFormat();
  let logFormat: winston.Logform.Format;
  if (configFormat === 'delimiter') {
    logFormat = winston.format.combine(escapeFormat, delimiterFormat);
  } else {
    logFormat = winston.format.json({ deterministic: false });
  }
  const format = (format?: winston.Logform.Format) =>
    winston.format.combine(
      format || winston.format((info) => ({ level: info.level, timestamp: info.timestamp, ...info }))(),
      logFormat,
    );
  const transports = {
    console: () =>
      new winston.transports.Console({
        format: format(
          winston.format((info) => ({ logfile: filename, level: info.level, timestamp: info.timestamp, ...info }))(),
        ),
      }),
    file: () =>
      new winston.transports.File({
        dirname,
        filename: `${filename}.log`,
        maxsize: Number(process.env.LOGGER_MAX_SIZE) || 1024 * 1024 * 20,
        maxFiles: Number(process.env.LOGGER_MAX_FILES) || 10,
        format: format(),
      }),
    dailyRotateFile: () =>
      new winston.transports.DailyRotateFile({
        dirname,
        filename: `${filename}_%DATE%.log`,
        maxSize: Number(process.env.LOGGER_MAX_SIZE),
        maxFiles: Number(process.env.LOGGER_MAX_FILES) || '14d',
        format: format(),
      }),
  };
  return configTransports?.map((t) => (typeof t === 'string' ? transports[t]() : t)) || transports['console']();
};

export const createLogger = (options: LoggerOptions) => {
  // if (process.env.GITHUB_ACTIONS) {
  //   return simpleLogger({ level: 'debug', format: winston.format.simple() });
  // }
  const { transports, ...rest } = options;
  const winstonOptions = {
    level: getLoggerLevel(),
    ...rest,
    transports: getTransports(options),
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      options.format || winston.format.simple(),
      winston.format.json({ deterministic: false }),
    ),
  };
  return winston.createLogger(winstonOptions);
};

export const simpleLogger = (options?: winston.LoggerOptions) => {
  const { format, ...rest } = options || {};
  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format ||
        winston.format.printf(
          ({ timestamp, level, message, reqId }) => `${level}|${timestamp}|${reqId + '|' || ''}${message}`,
        ),
    ),
    ...(rest || {}),
    transports: [new winston.transports.Console()],
  });
};

export { Logger, LoggerOptions };
interface ReqeustLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}

export interface AppLoggerOptions {
  request: ReqeustLoggerOptions;
  system: SystemLoggerOptions;
}
