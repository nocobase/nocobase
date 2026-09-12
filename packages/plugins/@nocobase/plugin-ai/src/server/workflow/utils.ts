/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import _ from 'lodash';

export function resolveContentType(headers: Record<string, any>) {
  const contentType = headers?.['content-type'];
  if (Array.isArray(contentType)) {
    return contentType[0]?.split(';')[0]?.trim();
  }
  return contentType?.split(';')[0]?.trim();
}

export function resolveFileIdentity(url: string, headers: Record<string, any>) {
  const fullFilename = resolveFilenameFromContentDisposition(headers) ?? resolveFilenameFromUrl(url) ?? 'file';
  const extname = path.extname(fullFilename);
  const title = extname ? fullFilename.slice(0, -extname.length) : fullFilename;

  return {
    title,
    filename: fullFilename,
    extname,
  };
}

function resolveContentDisposition(headers: Record<string, any>) {
  const contentDisposition = headers?.['content-disposition'];
  if (Array.isArray(contentDisposition)) {
    return contentDisposition[0];
  }
  return contentDisposition;
}

function decodeFilename(value: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function resolveFilenameFromContentDisposition(headers: Record<string, any>) {
  const contentDisposition = resolveContentDisposition(headers);
  if (!contentDisposition) {
    return;
  }

  const encodedMatch = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (encodedMatch) {
    const encodedValue = encodedMatch[1].trim().replace(/^"(.*)"$/, '$1');
    const [, filename = encodedValue] = encodedValue.match(/^(?:[^']*)''(.*)$/) ?? [];
    if (filename) {
      return decodeFilename(filename);
    }
  }

  const filenameMatch = contentDisposition.match(/filename\s*=\s*("(?:[^"\\]|\\.)*"|[^;]+)/i);
  if (!filenameMatch) {
    return;
  }

  const filename = filenameMatch[1]
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .replace(/\\"/g, '"');
  return decodeFilename(filename);
}

function resolveFilenameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const basename = path.basename(pathname);
    return basename ? decodeFilename(basename) : undefined;
  } catch (error) {
    const pathname = url.split(/[?#]/, 1)[0];
    const basename = path.basename(pathname);
    return basename ? decodeFilename(basename) : undefined;
  }
}
