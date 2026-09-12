/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeFileAccessExtname, trimPublicPath } from './utils';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;

export type PermanentFileReference = {
  appName: string;
  dataSourceKey: string;
  collectionName: string;
  id: string;
  extname?: string;
};

function invalidFileURL() {
  return Object.assign(new Error('Invalid file URL'), { status: 404 });
}

function stripPublicPath(pathname: string) {
  const publicPath = trimPublicPath(process.env.APP_PUBLIC_PATH);
  if (publicPath && (pathname === publicPath || pathname.startsWith(`${publicPath}/`))) {
    return pathname.slice(publicPath.length) || '/';
  }
  return pathname;
}

function getURLOrigin(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch (error) {
    return null;
  }
}

export function parsePermanentFileReference(value: unknown, origin?: string): PermanentFileReference | null {
  if (typeof value !== 'string' || !value || value.startsWith('//')) {
    return null;
  }

  let url: URL;
  if (value.startsWith('/')) {
    url = new URL(value, 'http://localhost');
  } else {
    try {
      url = new URL(value);
    } catch (error) {
      return null;
    }
    const configuredOrigin = process.env.APP_PUBLIC_ORIGIN;
    const trustedOrigin = configuredOrigin ? getURLOrigin(configuredOrigin) : getURLOrigin(origin);
    if (!trustedOrigin || url.origin !== trustedOrigin) {
      return null;
    }
  }

  if (url.searchParams.has('temporaryAccessToken')) {
    return null;
  }

  const segments = stripPublicPath(url.pathname).split('/').filter(Boolean);
  if (segments[0] !== 'files') {
    return null;
  }
  if (segments.length !== 5) {
    throw invalidFileURL();
  }

  try {
    const appName = decodeURIComponent(segments[1]);
    const dataSourceKey = decodeURIComponent(segments[2]);
    const collectionName = decodeURIComponent(segments[3]);
    const fileIdSegment = decodeURIComponent(segments[4]);
    const extnameIndex = fileIdSegment.lastIndexOf('.');
    const extname = extnameIndex > 0 ? normalizeFileAccessExtname(fileIdSegment.slice(extnameIndex)) : '';
    const id = extname ? fileIdSegment.slice(0, extnameIndex) : fileIdSegment;

    if (
      !IDENTIFIER_PATTERN.test(appName) ||
      !IDENTIFIER_PATTERN.test(dataSourceKey) ||
      !IDENTIFIER_PATTERN.test(collectionName) ||
      !id ||
      id.includes('/') ||
      id.includes('\\') ||
      id.includes('\0')
    ) {
      throw invalidFileURL();
    }

    return {
      appName,
      dataSourceKey,
      collectionName,
      id,
      extname: extname || undefined,
    };
  } catch (error) {
    throw invalidFileURL();
  }
}
