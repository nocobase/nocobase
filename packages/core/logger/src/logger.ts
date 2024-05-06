/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import winston, { Logger } from 'winston';
import 'winston-daily-rotate-file';
import { getLoggerLevel } from './config';
import { getTransports } from './transports';
import { consoleFormat } from './format';

interface LoggerOptions extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
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

/**
 * @internal
 */
export const createConsoleLogger = (options?: winston.LoggerOptions) => {
  const { format, ...rest } = options || {};
  return winston.createLogger({
    level: getLoggerLevel(),
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      format || consoleFormat,
    ),
    ...(rest || {}),
    transports: [new winston.transports.Console()],
  });
};

export { Logger, LoggerOptions };
