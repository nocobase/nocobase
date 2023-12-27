import winston, { Logger } from 'winston';
import { SystemLoggerOptions } from './system-logger';
import 'winston-daily-rotate-file';
import { getLoggerLevel } from './config';
import { getTransports } from './transports';
import { colorFormat, logfmtFormat, sortFormat } from './format';

interface LoggerOptions extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}

export const createLogger = (options: LoggerOptions) => {
  if (process.env.GITHUB_ACTIONS) {
    return createConsoleLogger();
  }
  const { format, ...rest } = options;
  const winstonOptions = {
    level: getLoggerLevel(),
    ...rest,
    transports: getTransports(options),
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
      format || winston.format.combine(sortFormat, colorFormat, logfmtFormat),
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
