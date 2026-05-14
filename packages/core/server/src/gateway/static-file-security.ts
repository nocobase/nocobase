/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

const ACTIVE_CONTENT_EXTENSIONS = new Set(['.htm', '.html', '.svg', '.svgz', '.xhtml']);

function stripQueryAndHash(pathname = '') {
  return pathname.split('?')[0].split('#')[0];
}

export function hasActiveContentExtension(pathname = '') {
  const ext = path.extname(stripQueryAndHash(pathname)).toLowerCase();
  return ACTIVE_CONTENT_EXTENSIONS.has(ext);
}

export function getStorageUploadSecurityHeaders(pathname = '') {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
  };

  if (hasActiveContentExtension(pathname)) {
    headers['Content-Disposition'] = 'attachment';
  }

  return headers;
}
