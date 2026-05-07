/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IdpOauthService } from './service';

export function normalizeBasePath(path = '') {
  const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

export function getCurrentUser(ctx: any) {
  return ctx.auth?.user || ctx.state?.currentUser;
}

export async function resolveCurrentUser(ctx: any, service?: IdpOauthService) {
  const currentUser = getCurrentUser(ctx);
  if (currentUser) {
    return currentUser;
  }

  const bridgeUser = service ? await service.resolveInteractionBridgeUser(ctx) : undefined;
  if (bridgeUser) {
    return bridgeUser;
  }

  return undefined;
}
