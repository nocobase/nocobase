/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client';
import type { AxiosResponse } from 'axios';
import debounce from 'lodash/debounce';

const AuthErrorCode = {
  EMPTY_TOKEN: 'EMPTY_TOKEN' as const,
  EXPIRED_TOKEN: 'EXPIRED_TOKEN' as const,
  INVALID_TOKEN: 'INVALID_TOKEN' as const,
  TOKEN_RENEW_FAILED: 'TOKEN_RENEW_FAILED' as const,
  BLOCKED_TOKEN: 'BLOCKED_TOKEN' as const,
  EXPIRED_SESSION: 'EXPIRED_SESSION' as const,
  NOT_EXIST_USER: 'NOT_EXIST_USER' as const,
  SKIP_TOKEN_RENEW: 'SKIP_TOKEN_RENEW' as const,
  USER_HAS_NO_ROLES_ERR: 'USER_HAS_NO_ROLES_ERR' as const,
};

function removeBasename(pathname, basename) {
  // Escape special characters in basename for use in regex
  const escapedBasename = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Create a regex to match the basename at the start of pathname, followed by a slash or end of string
  const regex = new RegExp(`^${escapedBasename.replace(/\/?$/, '')}(\\/|$)`);
  // If it matches, remove the basename; otherwise, return the pathname unchanged
  return pathname.replace(regex, '/') || pathname;
}

const debouncedRedirect = debounce(
  (redirectFunc) => {
    redirectFunc();
  },
  3000,
  { leading: true, trailing: false },
);

export function authCheckMiddleware({ app }: { app: Application }) {
  const axios = app.apiClient.axios;
  const resHandler = (res: AxiosResponse) => {
    const newToken = res?.headers?.['x-new-token'];
    if (newToken) {
      app.apiClient.auth.setToken(newToken);
    }
    return res;
  };
  const errHandler = (error) => {
    const newToken = error?.response?.headers?.['x-new-token'];
    const errors = error?.response?.data?.errors;
    const firstError = Array.isArray(errors) ? errors[0] : null;

    const state = app.router.state;
    const { pathname, search } = state.location;
    const basename = app.router.basename;

    if (newToken) {
      app.apiClient.auth.setToken(newToken);
    }

    if (error.status === 401 && firstError?.code && AuthErrorCode[firstError.code]) {
      app.apiClient.auth.setToken('');
      if (pathname === app.getHref('signin') && firstError?.code !== AuthErrorCode.EMPTY_TOKEN && error.config) {
        error.config.skipNotify = false;
      }

      if (firstError?.code === 'USER_HAS_NO_ROLES_ERR') {
        // use app error to show error message
        error.config.skipNotify = true;
        app.error = firstError;
      }
    }

    if (error.status === 401 && !error.config?.skipAuth && firstError?.code && AuthErrorCode[firstError.code]) {
      if (!firstError || firstError?.code === AuthErrorCode.SKIP_TOKEN_RENEW) {
        throw error;
      }

      const isSkippedAuthCheckRoute = app.router.isSkippedAuthCheckRoute(pathname);
      if (isSkippedAuthCheckRoute) {
        error.config.skipNotify = true;
      }

      if (pathname !== app.getHref('signin') && !isSkippedAuthCheckRoute) {
        const redirectPath = removeBasename(pathname, basename);

        debouncedRedirect(() => {
          app.apiClient.auth.setToken(null);
          app.router.navigate(`/signin?redirect=${redirectPath}${search}`, { replace: true });
        });
      }
    }
    throw error;
  };
  return [resHandler, errHandler];
}
