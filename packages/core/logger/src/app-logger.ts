import { Logger } from 'winston';
import { SystemLoggerOptions, createSystemLogger } from './system-logger';
import { getLoggerFilePath } from './config';

export const createAppLogger = ({ app, ...options }: SystemLoggerOptions & { app?: string }) =>
  createSystemLogger({ dirname: getLoggerFilePath(app), filename: 'system', seperateError: true, ...options });

export type logMethod = (
  message: string,
  meta?: {
    module?: string;
    submodule?: string;
    method?: string;
    [key: string]: any;
  },
) => AppLogger;

export interface AppLogger extends Omit<Logger, 'info' | 'warn' | 'error' | 'debug'> {
  info: logMethod;
  warn: logMethod;
  error: logMethod;
  debug: logMethod;
}
