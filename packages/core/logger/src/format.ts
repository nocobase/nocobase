/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import chalk from 'chalk';
import winston from 'winston';
import { getLoggerFormat } from './config';
import { LoggerOptions } from './logger';
import { isEmpty } from 'lodash';

const DEFAULT_DELIMITER = '|';

const colorize = {};

/**
 * @internal
 */

export const getFormat = (format?: LoggerOptions['format']) => {
  const configFormat = format || getLoggerFormat();
  let logFormat: winston.Logform.Format;
  switch (configFormat) {
    case 'console':
      logFormat = winston.format.combine(consoleFormat);
      break;
    case 'logfmt':
      logFormat = logfmtFormat;
      break;
    case 'delimiter':
      logFormat = winston.format.combine(escapeFormat, delimiterFormat);
      break;
    case 'json':
      logFormat = winston.format.combine(winston.format.json({ deterministic: false }));
      break;
    default:
      return winston.format.combine(format as winston.Logform.Format);
  }
  return winston.format.combine(sortFormat, logFormat);
};

/**
 * @internal
 */
export const colorFormat: winston.Logform.Format = winston.format((info) => {
  Object.entries(info).forEach(([k, v]) => {
    const level = info['level'];
    if (colorize[k]) {
      info[k] = colorize[k](v);
      return;
    }
    if (colorize[level]?.[k]) {
      info[k] = colorize[level][k](v);
      return;
    }
  });
  return info;
})();

/**
 * @internal
 */
export const stripColorFormat: winston.Logform.Format = winston.format((info) => {
  Object.entries(info).forEach(([k, v]) => {
    if (typeof v !== 'string') {
      return;
    }
    const regex = new RegExp(`\\x1b\\[\\d+m`, 'g');
    info[k] = v.replace(regex, '');
  });
  return info;
})();

/**
 * @internal
 *https://brandur.org/logfmt
 */
export const logfmtFormat: winston.Logform.Format = winston.format.printf((info) =>
  Object.entries(info)
    .map(([k, v]) => {
      if (typeof v === 'object') {
        try {
          v = JSON.stringify(v);
        } catch (error) {
          v = String(v);
        }
      }
      if (v === undefined || v === null) {
        v = '';
      }
      return `${k}=${v}`;
    })
    .join(' '),
);

/**
 * @internal
 */
export const consoleFormat: winston.Logform.Format = winston.format.printf((info) => {
  const keys = ['level', 'timestamp', 'message'];
  Object.entries(info).forEach(([k, v]) => {
    if (typeof v === 'object') {
      if (isEmpty(v)) {
        info[k] = '';
        return;
      }
      try {
        info[k] = JSON.stringify(v);
      } catch (error) {
        info[k] = String(v);
      }
    }
    if (v === undefined || v === null) {
      info[k] = '';
    }
  });

  const tags = Object.entries(info)
    .filter(([k, v]) => !keys.includes(k) && v)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  const level = `[${info.level}]`.padEnd(7, ' ');
  const message = (info.message as string).padEnd(44, ' ');
  const color =
    {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.green,
      debug: chalk.blue,
      trace: chalk.cyan,
    }[info.level] || chalk.white;
  const colorized = message.startsWith('Executing')
    ? color(`${info.timestamp} ${level}`) + ` ${message}`
    : color(`${info.timestamp} ${level} ${message}`);
  return `${colorized} ${tags}`;
});

/**
 * @internal
 */
export const delimiterFormat = winston.format.printf((info) =>
  Object.entries(info)
    .map(([, v]) => {
      if (typeof v === 'object') {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return String(v);
        }
      }
      return v;
    })
    .join(DEFAULT_DELIMITER),
);

/**
 * @internal
 */
export const escapeFormat: winston.Logform.Format = winston.format((info) => {
  let { message } = info;
  if (typeof message === 'string' && message.includes(DEFAULT_DELIMITER)) {
    message = message.replace(/"/g, '\\"');
    message = `"${message}"`;
  }
  return { ...info, message };
})();

/**
 * @internal
 */
export const sortFormat = winston.format((info) => ({ level: info.level, ...info }))();
