import winston, { LoggerOptions, format } from 'winston';
import { customLogger } from './logger';
import Transport from 'winston-transport';
import { SPLAT } from 'triple-beam';

interface SystemLoggerOptions extends LoggerOptions {
  name: string; // log file name
  seperateError?: boolean; // print error seperately
}

class SystemLoggerTransport extends Transport {
  private logger: winston.Logger;
  private errorLogger: winston.Logger;

  constructor({ name, seperateError, ...options }: SystemLoggerOptions) {
    super(options);
    this.logger = customLogger(name, {
      ...options,
      format: winston.format.combine(
        format((info) => (seperateError && info.level === 'error' ? false : info))(),
        options.format || winston.format((info) => info)(),
      ),
    });
    if (seperateError) {
      this.errorLogger = customLogger(`${name}_error`, {
        ...options,
        level: 'error',
      });
    }
  }

  parseMessage(args: any[]) {
    return {
      meta: args[0] || {},
      function: args[1] || '',
      module: args[2] || '',
      submodule: args[3] || '',
    };
  }

  log(info: any, callback: any) {
    const { level, message, reqId, module, submodule, [SPLAT]: args } = info;
    const logger = level === 'error' && this.errorLogger ? this.errorLogger : this.logger;
    const extra = args ? this.parseMessage(args) : {};
    logger.log({
      level,
      reqId,
      message,
      module: extra['module'] || module,
      submodule: extra['submodule'] || submodule,
      function: extra['function'],
      meta: extra['meta'],
    });
    callback(null, true);
  }
}

export const logger = (name: string, options?: Omit<SystemLoggerOptions, 'name'> & { name?: string }) =>
  customLogger(name, {
    transports: [
      new SystemLoggerTransport({
        name,
        ...(options || {}),
      }),
    ],
  });
