import { getLoggerLevel, getLoggerTransport } from '@nocobase/logger';
import { AppLoggerOptions } from '@nocobase/server';

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
