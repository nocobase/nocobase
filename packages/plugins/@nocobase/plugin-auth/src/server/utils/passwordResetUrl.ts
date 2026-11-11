/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolveSigninPrefix } from './buildRedirectPath';
import { resolveSubAppSegment } from './resolveSubAppSegment';

export const resetOriginRequired =
  'Configure APP_PUBLIC_ORIGIN with the public HTTP or HTTPS origin to enable email password recovery.';

export function getPasswordResetOrigin(): URL | undefined {
  const value = process.env.APP_PUBLIC_ORIGIN?.trim();
  if (!value || !/^https?:\/\/[^\s@,/?#\\]+\/?$/i.test(value)) {
    return;
  }
  try {
    return new URL(value);
  } catch {
    return;
  }
}

export async function getPasswordResetPage(origin: URL, appName: string, clientBaseURL: unknown) {
  // Older SDKs identify their client shell through baseURL. Only use its pathname to select v1 or v2.
  let clientPath = '';
  if (typeof clientBaseURL === 'string') {
    try {
      clientPath = new URL(clientBaseURL).pathname;
    } catch {
      // A missing or invalid shell hint uses the legacy route.
    }
  }
  const subAppSegment = await resolveSubAppSegment(origin, appName);
  const appPublicPath = '/' + (process.env.APP_PUBLIC_PATH || '').trim().replace(/^\/+|\/+$/g, '');
  const prefix = resolveSigninPrefix({ appPublicPath, redirect: clientPath, subAppSegment });
  const url = new URL(origin.origin);
  url.pathname = `${prefix}/reset-password`;
  return url;
}
