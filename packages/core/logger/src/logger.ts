import winston, { LoggerOptions } from 'winston';
import path from 'path';
import chalk from 'chalk';

const getLoggerLevel = () => process.env.LOGGER_LEVEL || (process.env.APP_ENV === 'development' ? 'debug' : 'info');

const getLoggerFilePath = (...paths: string[]): string => {
  return path.resolve(process.env.LOGGER_BASE_PATH || path.resolve(process.cwd(), 'storage', 'logs'), ...paths);
};

const getLoggerTransport = () =>
  process.env.LOGGER_TRANSPORT || (process.env.APP_ENV === 'development' ? 'console' : 'console,dailyRotateFile');

const getLoggerFormat = () => process.env.LOGGER_FORMAT || 'splitter';

const getTransport = (name: string) => {
  const configTransports = getLoggerTransport();
  let dirname = getLoggerFilePath();
  if (!path.isAbsolute(dirname)) {
    dirname = path.resolve(process.cwd(), dirname);
  }
  const configFormat = getLoggerFormat();
  let logFormat: winston.Logform.Format;
  if (configFormat === 'splitter') {
    logFormat = winston.format.combine(
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
          .join('|'),
      ),
    );
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
          winston.format((info) => ({ logfile: name, level: info.level, timestamp: info.timestamp, ...info }))(),
        ),
      }),
    file: () =>
      new winston.transports.File({
        dirname,
        filename: `${name}.log`,
        maxsize: Number(process.env.LOGGER_MAX_SIZE) || 1024 * 1024 * 20,
        maxFiles: Number(process.env.LOGGER_MAX_FILES) || 10,
        format: format(),
      }),
    dailyRotateFile: () =>
      new winston.transports.DailyRotateFile({
        dirname,
        filename: `${name}_%DATE%.log`,
        maxSize: Number(process.env.LOGGER_MAX_SIZE),
        maxFiles: Number(process.env.LOGGER_MAX_FILES) || '14d',
        format: format(),
      }),
  };
  return configTransports.split(',').map((t) => transports[t]()) || transports['console']();
};

export const customLogger = (name: string, options: LoggerOptions & { name?: string } = {}) => {
  if (winston.loggers.has(name)) {
    return winston.loggers.get(name);
  }
  const { transports, name: filename, ...others } = options;
  options = {
    level: getLoggerLevel(),
    transports: transports || getTransport(filename || name),
    ...others,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      options.format || winston.format.simple(),
      winston.format.json({ deterministic: false }),
    ),
  };
  return winston.loggers.add(name, options);
};

export const simpleLogger = () => {
  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.printf((info) => `${info.level}|${info.timestamp}|${info.message}`),
    ),
    transports: [new winston.transports.Console()],
  });
};
