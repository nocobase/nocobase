/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createSystemLogger({ dirname, filename, defaultMeta = {} }) {
  ensureDir(dirname);

  const fileTransport = new winston.transports.DailyRotateFile({
    dirname,
    filename: `${filename}_%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
  });

  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf((info) => {
        const meta = info.meta ? JSON.stringify(info.meta) : '';
        return `${info.timestamp} [${info.level}] ${info.message} ${meta}`;
      }),
    ),
  });

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.printf((info) => {
        const meta = info.meta ? JSON.stringify(info.meta) : '';
        return `${info.timestamp} [${info.level}] ${info.message} ${meta}`;
      }),
    ),
    transports: [consoleTransport, fileTransport],
    defaultMeta,
  });

  const wrap = (level) => (message, meta) => {
    logger.log({ level, message, meta });
    return logger;
  };

  return {
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
  };
}

const getLoggerFilePath = (...paths) => {
  return path.resolve(process.env.LOGGER_BASE_PATH || path.resolve(process.cwd(), 'storage', 'logs'), ...paths);
};

const logger = createSystemLogger({
  dirname: getLoggerFilePath('main'),
  filename: 'system',
  // defaultMeta: {
  //   app: 'main',
  //   module: 'cli',
  // },
});

module.exports = {
  logger,
};
