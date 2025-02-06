/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, lazy, useLazy } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';
import { presetAuthType } from '../preset';
import type { Authenticator as AuthenticatorType } from './authenticator';
import { authCheckMiddleware } from './interceptors';
import { NAMESPACE } from './locale';
// import { AuthProvider } from './AuthProvider';
const { AuthProvider } = lazy(() => import('./AuthProvider'), 'AuthProvider');
// import { Options, SignInForm, SignUpForm } from './basic';
const { Options, SignInForm, SignUpForm } = lazy(() => import('./basic'), 'Options', 'SignInForm', 'SignUpForm');
// import { AuthLayout, SignInPage, SignUpPage } from './pages';
const { AuthLayout, SignInPage, SignUpPage } = lazy(() => import('./pages'), 'AuthLayout', 'SignInPage', 'SignUpPage');
// import { Authenticator } from './settings/Authenticator';
const { Authenticator } = lazy(() => import('./settings/Authenticator'), 'Authenticator');
const { TokenPolicySettings } = lazy(() => import('./settings/token-policy'), 'TokenPolicySettings');

const { AuthenticatorsContextProvider, AuthLayout: ExportAuthLayout } = lazy(
  () => import('./pages'),
  'AuthenticatorsContextProvider',
  'AuthLayout',
);
export { ExportAuthLayout as AuthLayout, AuthenticatorsContextProvider };

export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};

export class PluginAuthClient extends Plugin {
  authTypes = new Registry<AuthOptions>();

  registerType(authType: string, options: AuthOptions) {
    this.authTypes.register(authType, options);
  }

  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'LoginOutlined',
      title: `{{t("Authentication", { ns: "${NAMESPACE}" })}}`,
      aclSnippet: 'pm.auth',
    });
    this.app.pluginSettingsManager.add('auth.authenticators', {
      icon: 'LoginOutlined',
      title: `{{t("Authenticators", { ns: "${NAMESPACE}" })}}`,
      Component: Authenticator,
      aclSnippet: 'pm.auth.authenticators',
      sort: 1,
    });

    this.router.add('auth', {
      Component: 'AuthLayout',
    });
    this.router.add('auth.signin', {
      path: '/signin',
      Component: 'SignInPage',
    });
    this.router.add('auth.signup', {
      path: '/signup',
      Component: 'SignUpPage',
    });

    this.app.addComponents({
      AuthLayout,
      SignInPage,
      SignUpPage,
    });

    this.app.providers.unshift([AuthProvider, {}]);

    this.registerType(presetAuthType, {
      components: {
        SignInForm: SignInForm,
        SignUpForm: SignUpForm,
        AdminSettingsForm: Options,
      },
    });
    this.app.pluginSettingsManager.add(`security.token-policy`, {
      title: `{{t("Token policy", { ns: "${NAMESPACE}" })}}`,
      Component: TokenPolicySettings,
      aclSnippet: `pm.security.token-policy`,
      icon: 'ApiOutlined',
      sort: 0,
    });
    const [fulfilled, rejected] = authCheckMiddleware({ app: this.app });
    this.app.apiClient.axios.interceptors.response['handlers'].unshift({
      fulfilled,
      rejected,
      synchronous: false,
      runWhen: null,
    });
  }
}

export { AuthenticatorsContext, useAuthenticator } from './authenticator';
export type { Authenticator } from './authenticator';
// export { useSignIn } from './basic';
const useSignIn = function (name: string) {
  const useSignIn = useLazy<typeof import('./basic').useSignIn>(() => import('./basic'), 'useSignIn');
  return useSignIn(name);
};
const useRedirect = function (next = '/admin') {
  const useRedirect = useLazy<typeof import('./basic').useRedirect>(() => import('./basic'), 'useRedirect');
  return useRedirect(next);
};

export { useSignIn, useRedirect };

export default PluginAuthClient;
