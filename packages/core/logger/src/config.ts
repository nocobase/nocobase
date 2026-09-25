/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { storagePathJoin } from '@nocobase/utils';

export const getLoggerLevel = () =>
  process.env.LOGGER_LEVEL || (process.env.APP_ENV === 'development' ? 'debug' : 'info');

/**
 * Resolve a directory inside the log root. Callers pass app names, plugin names and record ids, so the result is
 * checked to stay under the root: `path.resolve` silently adopts an absolute segment and happily walks out of the
 * root on `..`, which would turn any caller that forwards untrusted input into an arbitrary-directory write.
 */
export const getLoggerFilePath = (...paths: string[]): string => {
  const root = path.resolve(storagePathJoin('logs'));
  const resolved = path.resolve(root, ...paths);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`log path ${paths.join('/')} escapes the log directory`);
  }
  return resolved;
};

export const getLoggerTransport = (): ('console' | 'file' | 'dailyRotateFile')[] =>
  ((process.env.LOGGER_TRANSPORT as any) || 'console,dailyRotateFile').split(',');

export const getLoggerFormat = (): 'logfmt' | 'json' | 'delimiter' | 'console' =>
  (process.env.LOGGER_FORMAT as any) || (process.env.APP_ENV === 'development' ? 'console' : 'json');
