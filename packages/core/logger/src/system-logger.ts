import winston, { LoggerOptions, format } from 'winston';
import { customLogger } from './logger';
import Transport from 'winston-transport';
import { SPLAT } from 'triple-beam';

interface SystemLoggerOptions extends LoggerOptions {
  name: string; // log file name
  seperateError?: boolean; // print error seperately, default true
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
    if (args.length === 1) {
      const arg = args[0];
      if (typeof arg === 'object' && (arg.module || arg.submodule || arg.function || arg.meta)) {
        return arg;
      }
      return { meta: arg };
    } else if (args.length === 2) {
      let result = { meta: args[0] };
      if (typeof args[1] === 'object') {
        result = { ...result, ...args[1] };
      }
      return result;
    }
    return {};
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

export const logger = (key: string, options?: Omit<SystemLoggerOptions, 'name'> & { name?: string }) =>
  customLogger(key, {
    transports: [
      new SystemLoggerTransport({
        name: key,
        ...(options || {}),
      }),
    ],
  });

export const systemLogger = (app: string, key: string) =>
  logger(`${app}_${key}`, { name: `${app}_system`, seperateError: true });
