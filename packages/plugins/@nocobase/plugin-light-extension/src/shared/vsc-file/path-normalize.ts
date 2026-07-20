/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { maxPathLength } from './constants';
import { VscError } from './errors';

const windowsDrivePrefix = /^[A-Za-z]:\//;

export function normalizePath(path: string): string {
  if (typeof path !== 'string') {
    throw new VscError('PATH_INVALID', 'Path must be a string');
  }

  const normalized = path.replace(/\\/g, '/');

  if (!normalized) {
    throw new VscError('PATH_INVALID', 'Path must not be empty');
  }
  if (normalized.length > maxPathLength) {
    throw new VscError('PATH_INVALID', `Path length must not exceed ${maxPathLength}`);
  }
  if (normalized.includes('\0')) {
    throw new VscError('PATH_INVALID', 'Path must not contain NUL');
  }
  if (normalized.startsWith('/') || windowsDrivePrefix.test(normalized)) {
    throw new VscError('PATH_INVALID', 'Path must be relative');
  }
  if (normalized.endsWith('/')) {
    throw new VscError('PATH_INVALID', 'Path must not end with a slash');
  }

  const segments = normalized.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new VscError('PATH_INVALID', 'Path must not contain empty, current, or parent segments');
  }

  return normalized;
}
