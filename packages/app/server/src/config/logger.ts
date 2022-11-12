import { AppLoggerOptions } from '@nocobase/logging';

export default {
  transports: process.env.LOGGER_TRANSPORT || ['console', 'dailyRotateFile'],
} as AppLoggerOptions;
