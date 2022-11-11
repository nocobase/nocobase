import { LoggerOptions } from '@nocobase/logger';

export default {
  transports: process.env.LOGGER_TRANSPORT || ['console', 'dailyRotateFile'],
} as LoggerOptions;
