import winston, { Logger } from 'winston';
import path from 'path';
import { SystemLoggerOptions } from './system-logger';
import 'winston-daily-rotate-file';
import { getLoggerFilePath, getLoggerFormat, getLoggerLevel, getLoggerTransport } from './config';
import { Transports } from './transports';
import {
  delimiterFormat,
  delimiterFormatWithColor,
  escapeFormat,
  logfmtFormat,
  logfmtFormatWithColor,
  sortFormat,
} from './format';

interface LoggerOptions extends Omit<winston.LoggerOptions, 'transports'> {
  path?: string;
  filename?: string;
  transports?: (string | winston.transport)[];
}

const getTransports = (options: LoggerOptions) => {
  const { filename } = options;
  let { transports: configTransports, path: dirname } = options;
  configTransports = configTransports || getLoggerTransport();
  dirname = dirname || getLoggerFilePath();
  if (!path.isAbsolute(dirname)) {
    dirname = path.resolve(process.cwd(), dirname);
  }
  const configFormat = getLoggerFormat();

  const format = (format?: winston.Logform.Format, withColor = false) => {
    let logFormat: winston.Logform.Format;
    switch (configFormat) {
      case 'logfmt':
        logFormat = withColor ? logfmtFormatWithColor : logfmtFormat;
        break;
      case 'delimiter':
        logFormat = winston.format.combine(escapeFormat, withColor ? delimiterFormatWithColor : delimiterFormat);
        break;
      default:
        logFormat = winston.format.json({ deterministic: false });
    }

    return winston.format.combine(format || sortFormat, logFormat);
  };

  const transports = {
    console: () =>
      Transports.console({
        format: format(
          winston.format((info) => ({ logfile: filename, level: info.level, timestamp: info.timestamp, ...info }))(),
          true,
        ),
      }),
    file: () =>
      Transports.file({
        dirname,
        filename: `${filename}.log`,
        format: format(),
      }),
    dailyRotateFile: () =>
      Transports.dailyRotateFile({
        dirname,
        filename: `${filename}_%DATE%.log`,
        format: format(),
      }),
  };
  return configTransports?.map((t) => (typeof t === 'string' ? transports[t]() : t)) || transports['console']();
};

export const createLogger = (options: LoggerOptions) => {
  if (process.env.GITHUB_ACTIONS) {
    return createConsoleLogger();
  }
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

export const createConsoleLogger = (options?: winston.LoggerOptions) => {
  const { format, ...rest } = options || {};
  return winston.createLogger({
    level: getLoggerLevel(),
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format || winston.format.combine(sortFormat, logfmtFormatWithColor),
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
