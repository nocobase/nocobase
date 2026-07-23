/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, getHostname } from '@nocobase/server';
import type { IncomingMessage } from 'http';

function getRequestHostname(req: IncomingMessage): string {
  const hostnameHeader = req.headers['x-hostname'];
  if (Array.isArray(hostnameHeader)) {
    return hostnameHeader[0] || '';
  }
  return hostnameHeader || getHostname(req);
}

/**
 * Resolve the legacy sub-application URL segment for an authentication
 * redirect. A sub-application reached through its custom domain is mounted at
 * the root, while one reached through the supervisor domain uses
 * `/apps/<name>`.
 */
export async function resolveSubAppSegment(req: IncomingMessage, appName?: string | null): Promise<string> {
  if (!appName || appName === 'main') {
    return '';
  }

  const appSupervisor = AppSupervisor.getInstance();
  if (!appSupervisor || appSupervisor.runningMode === 'single') {
    return '';
  }

  const hostname = getRequestHostname(req);
  if (hostname) {
    const cnameAppName = await appSupervisor.getAppNameByCName?.(hostname);
    if (cnameAppName === appName) {
      return '';
    }
  }

  return `/apps/${appName}`;
}
