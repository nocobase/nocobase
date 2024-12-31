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

type JTIStatus = 'valid' | 'idle' | 'revoked' | 'missing' | 'renewed' | 'unrenewable' | 'renewed';
type CheckResult = {
  token: { status: 'valid' | 'expired' | 'invalid' | 'empty'; type?: 'API' | 'user'; newToken?: string };
  jti?: { status: JTIStatus };
  user?: any;
  message?: string;
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
    const headers = error?.response?.headers;
    if (error.status === 401) {
      const errors = error?.response?.data?.errors;
      const unauthorizedError = errors.find((error) => error.code === 'UNAUTHORIZED');
      const errorData: CheckResult = unauthorizedError?.data ?? {};
      error.silence = true;
      const state = app.router.state;
      const { pathname, search } = state.location;
      const basename = app.router.basename;
      if (pathname !== '/signin') {
        const redirectPath = pathname.startsWith(app.router.basename)
          ? pathname.slice(basename.length) || '/'
          : pathname;
        if (errorData?.token?.newToken) {
          app.apiClient.auth.setToken(errorData?.token?.newToken);
          return axios.request(error.config);
        } else if (errorData?.jti?.status === 'unrenewable') {
          return axios.request(error.config);
        } else if (errorData?.jti?.status === 'idle') {
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
