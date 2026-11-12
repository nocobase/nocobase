/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { resolveSigninPrefix } from './buildRedirectPath';

const resetOriginRequired =
  'Configure APP_PUBLIC_ORIGIN with the public HTTP or HTTPS origin to enable email password recovery.';

const invalidDomain = 'Check the custom domain registered for this sub-application to enable email password recovery.';
const unavailableDomain = 'Could not read the sub-application domain settings for email password recovery.';

type ResetDestination = { origin: URL; subAppSegment: string };

function parsePublicOrigin(value?: string): URL | undefined {
  if (!value || !/^https?:\/\/[^\s@,/?#\\]+\/?$/i.test(value)) {
    return;
  }
  try {
    return new URL(value);
  } catch {
    return;
  }
}

function parseCustomDomain(hostname: string): URL | undefined {
  const dnsLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (hostname.length > 253 || !hostname.split('.').every((label) => dnsLabel.test(label))) {
    return;
  }
  const origin = parsePublicOrigin(`https://${hostname}`);
  return origin?.hostname === hostname.toLowerCase() ? origin : undefined;
}

export async function getPasswordResetDestination(appName: string): Promise<ResetDestination | { error: string }> {
  let subAppSegment = '';
  if (appName !== 'main') {
    const supervisor = AppSupervisor.getInstance();
    const app = await supervisor.getAppModel(appName).catch(() => null);
    if (!app || app.name !== appName) {
      return { error: unavailableDomain };
    }
    if (app.cname != null && app.cname !== '') {
      const origin = typeof app.cname === 'string' && parseCustomDomain(app.cname);
      return origin ? { origin, subAppSegment: '' } : { error: invalidDomain };
    }
    if (supervisor.runningMode !== 'single') {
      subAppSegment = `/apps/${appName}`;
    }
  }
  const origin = parsePublicOrigin(process.env.APP_PUBLIC_ORIGIN?.trim());
  return origin ? { origin, subAppSegment } : { error: resetOriginRequired };
}

export function getPasswordResetPage({ origin, subAppSegment }: ResetDestination, clientBaseURL: unknown) {
  // Older SDKs identify their client shell through baseURL. Only use its pathname to select v1 or v2.
  let clientPath = '';
  if (typeof clientBaseURL === 'string') {
    try {
      clientPath = new URL(clientBaseURL).pathname;
    } catch {
      // A missing or invalid shell hint uses the legacy route.
    }
  }
  const appPublicPath = '/' + (process.env.APP_PUBLIC_PATH || '').trim().replace(/^\/+|\/+$/g, '');
  const prefix = resolveSigninPrefix({ appPublicPath, redirect: clientPath, subAppSegment });
  const url = new URL(origin.origin);
  url.pathname = `${prefix}/reset-password`;
  return url;
}
