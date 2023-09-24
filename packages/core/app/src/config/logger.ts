import { AppLoggerOptions, getLoggerLevel, getLoggerTransport } from '@nocobase/logger';

export default {
  transports: getLoggerTransport(),
  level: getLoggerLevel(),
} as AppLoggerOptions;
