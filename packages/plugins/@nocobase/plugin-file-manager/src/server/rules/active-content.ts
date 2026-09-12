/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Path from 'path';
import match from 'mime-match';
import mime from 'mime-types';

export const ACTIVE_CONTENT_MIMETYPES = new Set([
  'application/pdf',
  'application/xhtml+xml',
  'application/xml',
  'application/xslt+xml',
  'image/svg+xml',
  'text/html',
  'text/xml',
]);

export const ACTIVE_CONTENT_EXTENSIONS = new Set([
  '.htm',
  '.html',
  '.pdf',
  '.svg',
  '.svgz',
  '.xht',
  '.xhtml',
  '.xml',
  '.xsl',
  '.xslt',
]);

function normalizeMimePattern(pattern: string | string[] = '*') {
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

export function isDisallowedActiveContent(
  filename: string,
  mimetype?: string | null,
  pattern: string | string[] = '*',
): boolean {
  const normalizedPattern = normalizeMimePattern(pattern);
  if (!normalizedPattern.length || normalizedPattern.includes('*')) {
    return false;
  }

  const normalizedMimeType = mimetype?.trim().toLowerCase();
  const filenameMimeType = mime.lookup(filename);
  const normalizedFilenameMimeType = typeof filenameMimeType === 'string' ? filenameMimeType.toLowerCase() : undefined;
  const extension = Path.extname(filename).toLowerCase();
  const isActiveMimeType = normalizedMimeType ? ACTIVE_CONTENT_MIMETYPES.has(normalizedMimeType) : false;
  const isActiveFilenameMimeType = normalizedFilenameMimeType
    ? ACTIVE_CONTENT_MIMETYPES.has(normalizedFilenameMimeType)
    : false;
  const isActiveContent = isActiveMimeType || isActiveFilenameMimeType || ACTIVE_CONTENT_EXTENSIONS.has(extension);

  if (!isActiveContent) {
    return false;
  }

  const activeMimeType = isActiveFilenameMimeType ? normalizedFilenameMimeType : normalizedMimeType;
  return !activeMimeType || !normalizedPattern.includes(activeMimeType);
}
