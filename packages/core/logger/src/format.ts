import chalk from 'chalk';
import winston from 'winston';

const DEFAULT_DELIMITER = '|';

const colorize = {
  errors: chalk.red,
  module: chalk.cyan,
  reqId: chalk.gray,
  request: chalk.green,
};

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
      return `${k}=${v}`;
    })
    .join(' '),
);

export const logfmtFormatWithColor = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf((info) =>
    Object.entries(info)
      .map(([k, v]) => {
        if (k === 'message' && info['level'].includes('error')) {
          v = colorize.errors(v);
        }
        if (typeof v === 'object') {
          try {
            v = JSON.stringify(v);
          } catch (error) {
            v = String(v);
          }
        }
        if (k === 'reqId' && v) {
          v = colorize.reqId(v);
        }
        if ((k === 'module' || k === 'submodule') && v) {
          v = colorize.module(v);
        }
        if (v === 'request' || v === 'response') {
          v = colorize.request(v);
        }
        return `${k}=${v}`;
      })
      .join(' '),
  ),
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

export const delimiterFormatWithColor = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf((info) =>
    Object.entries(info)
      .map(([k, v]) => {
        if (k === 'message' && info['level'].includes('error')) {
          return colorize.errors(v);
        }
        if (typeof v === 'object') {
          try {
            return JSON.stringify(v);
          } catch (error) {
            return String(v);
          }
        }
        if (k === 'reqId' && v) {
          return colorize.reqId(v);
        }
        if ((k === 'module' || k === 'submodule') && v) {
          return colorize.module(v);
        }
        if (v === 'request' || v === 'response') {
          return colorize.request(v);
        }
        return v;
      })
      .join(DEFAULT_DELIMITER),
  ),
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
