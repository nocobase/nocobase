import { AppLoggerOptions } from '@nocobase/logger';

export default {
  transports: process.env.LOGGER_TRANSPORT || ['console', 'dailyRotateFile'],
  level: process.env.LOGGER_LEVEL || (process.env.APP_ENV === 'development' ? 'debug' : 'info'),
} as AppLoggerOptions;
