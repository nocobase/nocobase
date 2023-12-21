import winston from 'winston';
import { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';

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
