import winston from 'winston';
import { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';
import { LoggerOptions } from './logger';
import { getLoggerFilePath, getLoggerFormat, getLoggerTransport } from './config';
import path from 'path';
import { getFormat } from './format';

export const Transports = {
  console: (options?: winston.transports.ConsoleTransportOptions) => new winston.transports.Console(options),
  file: (options?: winston.transports.FileTransportOptions) =>
    new winston.transports.File({
      maxsize: Number(process.env.LOGGER_MAX_SIZE) || 1024 * 1024 * 20,
      maxFiles: Number(process.env.LOGGER_MAX_FILES) || 10,
      ...options,
    }),
  dailyRotateFile: (options?: DailyRotateFileTransportOptions) =>
    new winston.transports.DailyRotateFile({
      maxSize: Number(process.env.LOGGER_MAX_SIZE),
      maxFiles: Number(process.env.LOGGER_MAX_FILES) || '14d',
      ...options,
    }),
};

export const getTransports = (options: LoggerOptions) => {
  const { filename, format: _format, transports: _transports } = options;
  let { dirname } = options;
  const configTransports = _transports || getLoggerTransport();
  const configFormat = _format || getLoggerFormat();
  dirname = dirname || getLoggerFilePath();
  if (!path.isAbsolute(dirname)) {
    dirname = path.resolve(process.cwd(), dirname);
  }
  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    getFormat(configFormat),
  );

  const transports = {
    console: () =>
      Transports.console({
        format: winston.format.combine(format),
      }),
    file: () =>
      Transports.file({
        dirname,
        filename: filename.includes('.log') ? filename : `${filename}.log`,
        format,
      }),
    dailyRotateFile: () =>
      Transports.dailyRotateFile({
        dirname,
        filename: filename.includes('%DATE%') || filename.includes('.log') ? filename : `${filename}_%DATE%.log`,
        format,
      }),
  };
  return configTransports?.map((t) => (typeof t === 'string' ? transports[t]() : t)) || transports['console']();
};
