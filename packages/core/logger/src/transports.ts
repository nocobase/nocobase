import winston from 'winston';
import { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';
import { LoggerOptions } from './logger';
import { getLoggerFilePath, getLoggerTransport } from './config';
import path from 'path';
import { colorFormat } from './format';

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
  const { filename, format, transports: _transports } = options;
  let { dirname } = options;
  const configTransports = _transports || getLoggerTransport();
  dirname = dirname || getLoggerFilePath();
  if (!path.isAbsolute(dirname)) {
    dirname = path.resolve(process.cwd(), dirname);
  }

  const transports = {
    console: () =>
      Transports.console({
        format: winston.format.combine(winston.format.colorize(), colorFormat, format as winston.Logform.Format),
      }),
    file: () =>
      Transports.file({
        dirname,
        filename: filename.includes('.log') ? filename : `${filename}.log`,
        format: format as winston.Logform.Format,
      }),
    dailyRotateFile: () =>
      Transports.dailyRotateFile({
        dirname,
        filename: filename.includes('%DATE%') || filename.includes('.log') ? filename : `${filename}_%DATE%.log`,
        format: format as winston.Logform.Format,
      }),
  };
  return configTransports?.map((t) => (typeof t === 'string' ? transports[t]() : t)) || transports['console']();
};
