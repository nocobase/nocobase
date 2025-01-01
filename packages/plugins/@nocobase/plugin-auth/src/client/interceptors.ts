/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Modal } from 'antd';
import debounce from 'lodash/debounce';
import { Application } from '@nocobase/client';

export type AuthErrorType =
  | 'empty'
  | 'expired'
  | 'invalid'
  | 'renewed'
  | 'missing'
  | 'inactive'
  | 'renewed'
  | 'unrenewable'
  | 'blocked'
  | 'login-timeout';

export const AUTHERRORNAME = 'AuthError';
export type AhthErrorData = {
  newToken?: string;
};

const debouncedRedirect = debounce(
  (redirectFunc) => {
    redirectFunc();
  },
  3000,
  { leading: true, trailing: false },
);
export function authCheckMiddleware({ app }: { app: Application }) {
  const axios = app.apiClient.axios;
  const resHandler = (res) => res;
  const errHandler = (error) => {
    if (error.status === 401) {
      const errors = error?.response?.data?.errors;
      const authError = errors.find((error) => error.code === AUTHERRORNAME);
      const errorData: AhthErrorData = authError?.data;
      const errorType: AuthErrorType = authError?.type;
      const state = app.router.state;
      const { pathname, search } = state.location;
      const basename = app.router.basename;
      if (pathname !== '/signin') {
        const redirectPath = pathname.startsWith(app.router.basename)
          ? pathname.slice(basename.length) || '/'
          : pathname;
        if (errorData?.newToken) {
          app.apiClient.auth.setToken(errorData?.newToken);
          return axios.request(error.config);
        } else if (errorType === 'renewed') {
          return axios.request(error.config);
        } else if (errorType === 'inactive') {
          debouncedRedirect(() => {
            app.apiClient.auth.setToken(null);
            Modal.confirm({
              title: app.i18n.t('Inactivity warning', { ns: 'auth' }),
              content: app.i18n.t(
                'You have been inactive for a while and will be signed out. Please sign in again to continue.',
                { ns: 'auth' },
              ),
              onOk: () => {
                app.router.navigate(`/signin?redirect=/${redirectPath}${search}`, { replace: true });
              },
              cancelButtonProps: { style: { display: 'none' } },
            });
          });
        } else {
          debouncedRedirect(() => {
            app.apiClient.auth.setToken(null);
            app.router.navigate(`/signin?redirect=/${redirectPath}${search}`, { replace: true });
          });
        }
      }
    }
    throw error;
  };
  return [resHandler, errHandler];
}
