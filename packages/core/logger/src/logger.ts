/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import winston, { LeveledLogMethod, Logger as WinstonLogger } from 'winston';
import 'winston-daily-rotate-file';
import { getLoggerLevel } from './config';
import { consoleFormat } from './format';
import { getTransports } from './transports';

interface Logger extends WinstonLogger {
  trace: LeveledLogMethod;
}

interface LoggerOptions extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}

export const levels = {
  trace: 4,
  debug: 3,
  info: 2,
  warn: 1,
  error: 0,
};

export const createLogger = (options: LoggerOptions) => {
  if (process.env.GITHUB_ACTIONS) {
    return createConsoleLogger();
  }
  const { format, ...rest } = options;
  const winstonOptions = {
    levels,
    level: getLoggerLevel(),
    ...rest,
    transports: getTransports(options),
  };
  return winston.createLogger(winstonOptions) as Logger;
};

/**
 * @internal
 */
export const createConsoleLogger = (options?: winston.LoggerOptions) => {
  const { format, ...rest } = options || {};
  return winston.createLogger({
    levels,
    level: getLoggerLevel(),
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format || consoleFormat,
    ),
    ...(rest || {}),
    transports: [new winston.transports.Console()],
  }) as Logger;
};

export { Logger, LoggerOptions };
