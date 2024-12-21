/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, lazy, useLazy, registerSecuritySettingsTab } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';
import { presetAuthType } from '../preset';
// import { AuthProvider } from './AuthProvider';
const { AuthProvider } = lazy(() => import('./AuthProvider'), 'AuthProvider');
import type { Authenticator as AuthenticatorType } from './authenticator';
// import { Options, SignInForm, SignUpForm } from './basic';
const { Options, SignInForm, SignUpForm } = lazy(() => import('./basic'), 'Options', 'SignInForm', 'SignUpForm');
import { NAMESPACE } from './locale';
// import { AuthLayout, SignInPage, SignUpPage } from './pages';
const { AuthLayout, SignInPage, SignUpPage } = lazy(() => import('./pages'), 'AuthLayout', 'SignInPage', 'SignUpPage');
// import { Authenticator } from './settings/Authenticator';
const { Authenticator } = lazy(() => import('./settings/Authenticator'), 'Authenticator');
const { AccessSettings } = lazy(() => import('./settings/access'), 'AccessSettings');
// export { AuthenticatorsContextProvider, AuthLayout } from './pages/AuthLayout';
const { AuthenticatorsContextProvider, AuthLayout: ExportAuthLayout } = lazy(
  () => import('./pages'),
  'AuthenticatorsContextProvider',
  'AuthLayout',
);
export { AuthenticatorsContextProvider, ExportAuthLayout as AuthLayout };

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
      Component: Authenticator,
      aclSnippet: 'pm.auth.authenticators',
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
    registerSecuritySettingsTab({
      app: this.app,
      name: 'access',
      title: `{{t("Access control", { ns: "${NAMESPACE}" })}}`,
      sort: 0,
      Component: AccessSettings,
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

export { useSignIn };

export default PluginAuthClient;
