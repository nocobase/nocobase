import chalk from 'chalk';
import winston from 'winston';

const DEFAULT_DELIMITER = '|';

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
          v = chalk.red(v);
        }
        if (typeof v === 'object') {
          try {
            v = JSON.stringify(v);
          } catch (error) {
            v = String(v);
          }
        }
        if (k === 'reqId' && v) {
          v = chalk.gray(v);
        }
        if ((k === 'module' || k === 'submodule') && v) {
          v = chalk.cyan(v);
        }
        if (v === 'request' || v === 'response') {
          v = chalk.green(v);
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
          return chalk.red(v);
        }
        if (typeof v === 'object') {
          try {
            return JSON.stringify(v);
          } catch (error) {
            return String(v);
          }
        }
        if (k === 'reqId' && v) {
          return chalk.gray(v);
        }
        if ((k === 'module' || k === 'submodule') && v) {
          return chalk.cyan(v);
        }
        if (v === 'request' || v === 'response') {
          return chalk.green(v);
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
