import { Logger } from 'winston';
import { SystemLoggerOptions, createSystemLogger } from './system-logger';

export const createAppLogger = ({ app, ...options }: SystemLoggerOptions & { app?: string }) =>
  createSystemLogger({ appName: app, filename: 'system', seperateError: true, ...options });

export type logMethod = (
  message: string,
  meta?: {
    module?: string;
    submodule?: string;
    method?: string;
    [key: string]: any;
  },
) => void;

export interface AppLogger extends Logger {
  info: logMethod;
  warn: logMethod;
  error: logMethod;
  debug: logMethod;
}
