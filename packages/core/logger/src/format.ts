import chalk from 'chalk';
import winston from 'winston';
import { getLoggerFormat } from './config';
import { LoggerOptions } from './logger';

const DEFAULT_DELIMITER = '|';

const colorize = {
  errors: chalk.red,
  module: chalk.cyan,
  reqId: chalk.gray,
  request: chalk.green,
};

export const getFormat = (format?: LoggerOptions['format']) => {
  const configFormat = format || getLoggerFormat();
  let logFormat: winston.Logform.Format;
  switch (configFormat) {
    case 'logfmt':
      logFormat = logfmtFormat;
      break;
    case 'delimiter':
      logFormat = winston.format.combine(escapeFormat, delimiterFormat);
      break;
    case 'json':
      logFormat = winston.format.combine(stripColorFormat, winston.format.json({ deterministic: false }));
      break;
    default:
      return winston.format.combine(format as winston.Logform.Format);
  }
  return winston.format.combine(sortFormat, logFormat);
};

export const colorFormat: winston.Logform.Format = winston.format((info) => {
  Object.entries(info).forEach(([k, v]) => {
    if (k === 'message' && info['level'].includes('error')) {
      info[k] = colorize.errors(v);
    }
    if (k === 'reqId' && v) {
      info[k] = colorize.reqId(v);
    }
    if ((k === 'module' || k === 'submodule') && v) {
      info[k] = colorize.module(v);
    }
    if (v === 'request' || v === 'response') {
      info[k] = colorize.request(v);
    }
  });
  return info;
})();

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

// https://brandur.org/logfmt
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

export const escapeFormat: winston.Logform.Format = winston.format((info) => {
  let { message } = info;
  if (typeof message === 'string' && message.includes(DEFAULT_DELIMITER)) {
    message = message.replace(/"/g, '\\"');
    message = `"${message}"`;
  }
  return { ...info, message };
})();

export const sortFormat = winston.format((info) => ({ level: info.level, timestamp: info.timestamp, ...info }))();
