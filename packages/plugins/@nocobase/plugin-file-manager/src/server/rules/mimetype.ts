/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import match from 'mime-match';

export function normalizeMimePattern(pattern: string | string[] = '*') {
  const value = Array.isArray(pattern) ? pattern.join(',') : pattern;
  return value
    .toString()
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function matchesMimePattern(mimetype: string, pattern: string | string[] = '*') {
  const normalizedPattern = normalizeMimePattern(pattern);
  if (!normalizedPattern.length || normalizedPattern.includes('*')) {
    return true;
  }
  return normalizedPattern.some(match(mimetype.toLowerCase()));
}

export default function (file, options: string | string[] = '*'): boolean {
  return matchesMimePattern(file.mimetype, options);
}
