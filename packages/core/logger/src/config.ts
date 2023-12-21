import path from 'path';

export const getLoggerLevel = () =>
  process.env.LOGGER_LEVEL || (process.env.APP_ENV === 'development' ? 'debug' : 'info');

export const getLoggerFilePath = (...paths: string[]): string => {
  return path.resolve(process.env.LOGGER_BASE_PATH || path.resolve(process.cwd(), 'storage', 'logs'), ...paths);
};

export const getLoggerTransport = () =>
  (
    process.env.LOGGER_TRANSPORT || (process.env.APP_ENV === 'development' ? 'console' : 'console,dailyRotateFile')
  ).split(',');

export const getLoggerFormat = () => process.env.LOGGER_FORMAT || 'logfmt';
