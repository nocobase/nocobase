import { AppLoggerOptions, getLoggerLevel, getLoggerTransport } from '@nocobase/logger';

export default {
  request: {
    transports: getLoggerTransport(),
    level: getLoggerLevel(),
  },
  system: {
    transports: getLoggerTransport(),
    level: getLoggerLevel(),
  },
} as AppLoggerOptions;
