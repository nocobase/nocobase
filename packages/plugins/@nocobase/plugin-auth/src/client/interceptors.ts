/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import debounce from 'lodash/debounce';
import { Application } from '@nocobase/client';
import type { AxiosResponse } from 'axios';

type AuthErrorType =
  | 'EMPTY_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'INVALID_TOKEN'
  | 'RENEWED_TOKEN'
  | 'MISSING_SESSION'
  | 'TOKEN_RENEW_FAILED'
  | 'BLOCKED_TOKEN'
  | 'EXPIRED_SESSION'
  | 'NOT_EXIST_USER';

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
    const newToken = res.headers['x-new-token'];
    if (newToken) {
      app.apiClient.auth.setToken(newToken);
    }
    return res;
  };
  const errHandler = (error) => {
    const newToken = error.response.headers['x-new-token'];
    if (newToken) {
      app.apiClient.auth.setToken(newToken);
    }
    if (error.status === 401) {
      const errors = error?.response?.data?.errors;
      const firstError = Array.isArray(errors) ? errors[0] : null;
      if (!firstError) throw error;
      const errorType: AuthErrorType = firstError?.code;
      const state = app.router.state;
      const { pathname, search } = state.location;
      const basename = app.router.basename;
      if (pathname !== '/signin') {
        const redirectPath = pathname.startsWith(app.router.basename)
          ? pathname.slice(basename.length) || '/'
          : pathname;

        // to-do wait for solve infinite loop navigate
        // if (errorType === ('TOKEN_RENEW_FAILED' satisfies AuthErrorType)) {
        //   return axios.request(error.config);
        // }
        debouncedRedirect(() => {
          app.apiClient.auth.setToken(null);
          app.router.navigate(`/signin?redirect=/${redirectPath}${search}`, { replace: true });
        });
      }
    }
    throw error;
  };
  return [resHandler, errHandler];
}
