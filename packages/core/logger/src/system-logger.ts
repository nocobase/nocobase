/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import winston, { format, Logger } from 'winston';
import { createLogger, LoggerOptions } from './logger';
import Transport from 'winston-transport';
import { SPLAT } from 'triple-beam';
import { getFormat } from './format';

export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // print error seperately, default true
}

export type logMethod = (
  message: string,
  meta?: {
    module?: string;
    submodule?: string;
    method?: string;
    [key: string]: any;
  },
) => SystemLogger;

export interface SystemLogger extends Omit<Logger, 'info' | 'warn' | 'error' | 'debug'> {
  info: logMethod;
  warn: logMethod;
  error: logMethod;
  debug: logMethod;
}

class SystemLoggerTransport extends Transport {
  private logger: winston.Logger;
  private errorLogger: winston.Logger;

  constructor({ seperateError, filename, ...options }: SystemLoggerOptions) {
    super({ ...options, format: null });
    this.logger = createLogger({
      ...options,
      filename,
      format: winston.format.combine(
        format((info) => (seperateError && info.level === 'error' ? false : info))(),
        getFormat(options.format),
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
    const { level, message, reqId, app, dataSourceKey, stack, cause, [SPLAT]: args } = info;
    const logger = level === 'error' && this.errorLogger ? this.errorLogger : this.logger;
    const { module, submodule, method, ...meta } = args?.[0] || {};
    if (!cause?.onlyLogCause) {
      logger.log({
        level,
        message,
        stack,
        meta,
        module: module || info['module'] || '',
        submodule: submodule || info['submodule'] || '',
        method: method || '',
        app,
        reqId,
        dataSourceKey: dataSourceKey || 'main',
      });
    }
    if (cause) {
      logger.log({
        level,
        message: cause.message,
        stack: cause.stack,
        app,
        reqId,
      });
    }
    callback(null, true);
  }

  close() {
    this.logger.close();
    if (this.errorLogger) {
      this.errorLogger.close();
    }
  }
}

function child(defaultRequestMetadata: any) {
  const logger = this;
  return Object.create(logger, {
    write: {
      value: function (info: any) {
        const infoClone = Object.assign({}, defaultRequestMetadata, info);

        if (info instanceof Error) {
          infoClone.stack = info.stack;
          infoClone.message = info.message;
          infoClone.cause = info.cause;
        }

        logger.write(infoClone);
      },
    },
  });
}

export const createSystemLogger = (options: SystemLoggerOptions): SystemLogger => {
  const transport = new SystemLoggerTransport(options);
  transport.once('unpipe', () => {
    transport.close();
  });
  const logger = winston.createLogger({
    transports: [transport],
  });

  // Since error.cause is not supported by child logger of winston
  // we have to use a proxy to rewrite child method
  return new Proxy(logger, {
    get(target, prop) {
      if (prop === 'child') {
        return child.bind(target);
      }
      return Reflect.get(target, prop);
    },
  });
};
