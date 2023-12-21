import winston, { format } from 'winston';
import { LoggerOptions, createLogger } from './logger';
import Transport from 'winston-transport';
import { SPLAT } from 'triple-beam';

export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}

class SystemLoggerTransport extends Transport {
  private logger: winston.Logger;
  private errorLogger: winston.Logger;

  constructor({ seperateError, filename, ...options }: SystemLoggerOptions) {
    super(options);
    this.logger = createLogger({
      ...options,
      filename,
      format: winston.format.combine(
        format((info) => (seperateError && info.level === 'error' ? false : info))(),
        options.format || winston.format((info) => info)(),
      ),
    });
    if (seperateError) {
      this.errorLogger = createLogger({
        ...options,
        filename: `${filename}_error`,
        level: 'error',
      });
    }
  }

  log(info: any, callback: any) {
    const { level, message, reqId, [SPLAT]: args } = info;
    const logger = level === 'error' && this.errorLogger ? this.errorLogger : this.logger;
    const { module, submodule, method, ...meta } = args[0];
    logger.log({
      level,
      reqId,
      message,
      module: module || info['module'] || '',
      submodule: submodule || info['submodule'] || '',
      method: method || '',
      meta,
    });
    callback(null, true);
  }
}

export const createSystemLogger = (options: SystemLoggerOptions) =>
  winston.createLogger({
    transports: [new SystemLoggerTransport(options)],
  });

export const createAppLogger = ({ app, ...options }: SystemLoggerOptions & { app?: string }) =>
  createSystemLogger({ filename: `${app}_system`, seperateError: true, ...options });
