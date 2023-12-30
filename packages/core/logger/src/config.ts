import path from 'path';

export const getLoggerLevel = () =>
  process.env.LOGGER_LEVEL || (process.env.APP_ENV === 'development' ? 'debug' : 'info');

export const getLoggerFilePath = (...paths: string[]): string => {
  return path.resolve(process.env.LOGGER_BASE_PATH || path.resolve(process.cwd(), 'storage', 'logs'), ...paths);
};

export const getLoggerTransport = (): ('console' | 'file' | 'dailyRotateFile')[] =>
  (
    (process.env.LOGGER_TRANSPORT as any) ||
    (process.env.APP_ENV === 'development' ? 'console' : 'console,dailyRotateFile')
  ).split(',');

export const getLoggerFormat = (): 'logfmt' | 'json' | 'delimiter' | 'console' =>
  (process.env.LOGGER_FORMAT as any) || (process.env.APP_ENV === 'development' ? 'console' : 'json');
