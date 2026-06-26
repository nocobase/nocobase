/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IdpOauthService } from './service';
import { resolveCurrentUser } from './utils';

type Provider = import('oidc-provider').Provider;

type DeviceVerificationAction = 'show' | 'approve' | 'cancel';

type DeviceVerificationContext = {
  method: string;
  path: string;
  query?: Record<string, unknown>;
  request: {
    body?: Record<string, unknown>;
  };
  status?: number;
  body?: unknown;
  withoutDataWrapping?: boolean;
  throw: (...args: unknown[]) => never;
};

type DeviceVerificationUser = {
  id: string | number;
};

const OIDC_SCOPES = new Set(['openid', 'offline_access', 'profile', 'email']);

function epochTime(date = Date.now()) {
  return Math.floor(date / 1000);
}

function normalizeUserCode(input: unknown) {
  return String(input || '')
    .replace(/[a-z]/g, (char) => char.toUpperCase())
    .replace(/\W/g, '');
}

function formatUserCode(input: unknown) {
  const userCode = normalizeUserCode(input);
  return userCode.match(/.{1,4}/g)?.join('-') || '';
}

function splitScopes(value: unknown) {
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
}

function getStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && !!item);
  }

  return typeof value === 'string' && value ? [value] : [];
}

function getUserCode(ctx: DeviceVerificationContext) {
  return normalizeUserCode(ctx.request.body?.user_code || ctx.query?.user_code);
}

export function getDeviceVerificationAction(pathname: string, apiBasePath: string): DeviceVerificationAction | null {
  const basePath = `${apiBasePath}/idpOAuth/device/verification`;

  if (pathname === basePath) {
    return 'show';
  }

  if (pathname === `${basePath}:approve`) {
    return 'approve';
  }

  if (pathname === `${basePath}:cancel`) {
    return 'cancel';
  }

  return null;
}

export function isProviderDeviceVerificationPage(pathname: string, apiBasePath: string) {
  const devicePath = `${apiBasePath}/idpOAuth/device`;

  if (pathname === devicePath) {
    return true;
  }

  if (!pathname.startsWith(`${devicePath}/`)) {
    return false;
  }

  return !pathname.startsWith(`${devicePath}/auth`) && !pathname.startsWith(`${devicePath}/verification`);
}

async function findDeviceCode(provider: Provider, userCode: string) {
  return provider.DeviceCode.findByUserCode(userCode, {
    ignoreExpiration: true,
  });
}

async function getDeviceClient(provider: Provider, code: { clientId?: string }) {
  if (!code.clientId) {
    return undefined;
  }

  return provider.Client.find(code.clientId);
}

function getClientName(client: { clientName?: string; clientId?: string } | undefined) {
  return client?.clientName || client?.clientId || 'Application';
}

async function buildDeviceState(ctx: DeviceVerificationContext, provider: Provider, user?: DeviceVerificationUser) {
  const userCode = getUserCode(ctx);
  const displayUserCode = formatUserCode(userCode);
  if (!userCode) {
    return {
      status: 'missing_code',
    };
  }

  const code = await findDeviceCode(provider, userCode);
  if (!code) {
    return {
      status: 'not_found',
      userCode: displayUserCode,
    };
  }

  const client = await getDeviceClient(provider, code);
  const baseState = {
    userCode: displayUserCode,
    clientName: getClientName(client),
  };

  if (code.isExpired) {
    return {
      ...baseState,
      status: 'expired',
    };
  }

  if (code.error) {
    return {
      ...baseState,
      status: 'cancelled',
    };
  }

  if (code.accountId) {
    return {
      ...baseState,
      status: 'complete',
    };
  }

  if (code.inFlight || code.consumed) {
    return {
      ...baseState,
      status: 'already_used',
    };
  }

  if (!user) {
    return {
      ...baseState,
      status: 'login',
    };
  }

  return {
    ...baseState,
    status: 'pending',
  };
}

function getRequestedResources(params: Record<string, unknown>) {
  return getStringArray(params.resource);
}

function splitRequestedScopes(params: Record<string, unknown>) {
  const requestedScopes = splitScopes(params.scope);
  const oidcScopes = requestedScopes.filter((scope) => OIDC_SCOPES.has(scope));
  const resourceScopes = requestedScopes.filter((scope) => !OIDC_SCOPES.has(scope));

  return {
    requestedScopes,
    oidcScopes,
    resourceScopes,
  };
}

async function approveDeviceCode(ctx: DeviceVerificationContext, provider: Provider, user?: DeviceVerificationUser) {
  if (!user?.id) {
    ctx.throw(401, 'Authentication required');
  }

  const userCode = getUserCode(ctx);
  const displayUserCode = formatUserCode(userCode);
  const code = userCode ? await findDeviceCode(provider, userCode) : undefined;
  if (!code || code.isExpired || code.error || code.accountId || code.inFlight || code.consumed) {
    return buildDeviceState(ctx, provider, user);
  }

  const clientId = code.clientId;
  const params = (code.params || {}) as Record<string, unknown>;
  const { requestedScopes, oidcScopes, resourceScopes } = splitRequestedScopes(params);
  const resources = getRequestedResources(params);
  const grant = new provider.Grant({
    accountId: String(user.id),
    clientId,
  });

  if (oidcScopes.length) {
    grant.addOIDCScope(oidcScopes.join(' '));
  }

  if (resourceScopes.length) {
    resources.forEach((resource) => grant.addResourceScope(resource, resourceScopes.join(' ')));
  }

  Object.assign(code, {
    accountId: String(user.id),
    authTime: epochTime(),
    grantId: await grant.save(),
    resource: resources.length > 1 ? resources : resources[0],
    scope: requestedScopes.join(' '),
  });

  if (!resources.length) {
    delete code.resource;
  }

  await code.save();

  return {
    status: 'complete',
    userCode: displayUserCode,
    clientName: getClientName(await getDeviceClient(provider, code)),
  };
}

async function cancelDeviceCode(ctx: DeviceVerificationContext, provider: Provider) {
  const userCode = getUserCode(ctx);
  const displayUserCode = formatUserCode(userCode);
  const code = userCode ? await findDeviceCode(provider, userCode) : undefined;
  if (!code || code.isExpired || code.error || code.accountId || code.inFlight || code.consumed) {
    return buildDeviceState(ctx, provider);
  }

  Object.assign(code, {
    error: 'access_denied',
    errorDescription: 'End-User aborted interaction',
  });
  await code.save();

  return {
    status: 'cancelled',
    userCode: displayUserCode,
    clientName: getClientName(await getDeviceClient(provider, code)),
  };
}

export async function handleDeviceVerificationRequest(
  ctx: DeviceVerificationContext,
  service: IdpOauthService,
  apiBasePath: string,
) {
  const action = getDeviceVerificationAction(ctx.path, apiBasePath);
  if (!action) {
    return false;
  }

  if ((action === 'show' && ctx.method !== 'GET') || (action !== 'show' && ctx.method !== 'POST')) {
    ctx.throw(405);
  }

  ctx.withoutDataWrapping = true;
  const provider = await service.ensureProviderForContext(ctx);
  const user = await resolveCurrentUser(ctx, service);
  const body = await service.runWithProviderContext(ctx, async () => {
    if (action === 'approve') {
      return approveDeviceCode(ctx, provider, user);
    }

    if (action === 'cancel') {
      return cancelDeviceCode(ctx, provider);
    }

    return buildDeviceState(ctx, provider, user);
  });

  ctx.body = body;
  return true;
}
