/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isEmbedRoutePathname } from '../client-v2/route';
import { restoreEmbedSessionToken, type EmbedSessionAppLike } from '../client-v2/embedSession';

const EMBED_UNAUTHORIZED_USER_ID = '__nocobase_embed_unauthorized__';
const EMBED_UNAUTHORIZED_USER_FLAG = '__nocobaseEmbedUnauthorized';

const registeredApiClients = new WeakSet<object>();

type EmbedAppLike = EmbedSessionAppLike & {
  apiClient: EmbedSessionAppLike['apiClient'] & {
    axios: {
      interceptors: {
        response: {
          use: (fulfilled?: (response: unknown) => unknown, rejected?: (error: unknown) => unknown) => unknown;
        };
      };
    };
  };
  getRouteUrl?: (pathname: string) => string;
};

type RequestConfigLike = {
  url?: string;
};

type ResponseErrorLike = {
  config?: RequestConfigLike;
  response?: {
    status?: number;
    statusText?: string;
    headers?: Record<string, unknown>;
  };
  status?: number;
};

type EmbedUnauthorizedUser = {
  id: string;
  [EMBED_UNAUTHORIZED_USER_FLAG]: true;
};

function getErrorStatus(error: unknown) {
  const errorLike = error as ResponseErrorLike;
  return errorLike?.response?.status || errorLike?.status;
}

function getRequestPathname(config?: RequestConfigLike) {
  const url = config?.url;

  if (!url) {
    return '';
  }

  const pathname = url.split('?')[0];
  if (pathname === 'auth:check' || pathname === '/auth:check') {
    return pathname;
  }

  try {
    return new URL(url, window.location.origin).pathname;
  } catch (_error) {
    return pathname;
  }
}

function isAuthCheckRequest(config?: RequestConfigLike) {
  const pathname = getRequestPathname(config).replace(/^\/api(?=\/)/, '');
  return pathname === '/auth:check' || pathname === 'auth:check';
}

function createEmbedUnauthorizedUser(): EmbedUnauthorizedUser {
  return {
    id: EMBED_UNAUTHORIZED_USER_ID,
    [EMBED_UNAUTHORIZED_USER_FLAG]: true,
  };
}

export function isEmbedUnauthorizedUser(user: unknown) {
  return (
    !!user &&
    typeof user === 'object' &&
    (user as { id?: unknown })?.id === EMBED_UNAUTHORIZED_USER_ID &&
    (user as Record<string, unknown>)?.[EMBED_UNAUTHORIZED_USER_FLAG] === true
  );
}

function createEmbedUnauthorizedAuthCheckResponse(error: ResponseErrorLike) {
  return {
    ...error.response,
    config: error.config,
    data: {
      data: createEmbedUnauthorizedUser(),
    },
    headers: error.response?.headers || {},
    status: 200,
    statusText: 'OK',
  };
}

function handleEmbedAuthCheckError(app: EmbedAppLike, error: unknown) {
  const errorLike = error as ResponseErrorLike;

  if (getErrorStatus(errorLike) !== 401) {
    throw error;
  }

  if (!isEmbedRoutePathname(app, window.location.pathname)) {
    throw error;
  }

  restoreEmbedSessionToken(app);

  if (!isAuthCheckRequest(errorLike.config)) {
    throw error;
  }

  return createEmbedUnauthorizedAuthCheckResponse(errorLike);
}

export function registerEmbedAuthCheckInterceptor(app: EmbedAppLike) {
  const apiClient = app.apiClient;

  if (registeredApiClients.has(apiClient)) {
    return;
  }

  registeredApiClients.add(apiClient);
  apiClient.axios.interceptors.response.use(undefined, (error) => handleEmbedAuthCheckError(app, error));
}
