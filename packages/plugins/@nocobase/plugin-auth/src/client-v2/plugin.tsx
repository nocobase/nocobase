/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { ComponentType } from 'react';
import {
  getCurrentV2RedirectPath,
  Plugin,
  redirectToLegacySignin,
  UserCenterSelectItemModel,
  languageCodes,
} from '@nocobase/client-v2';
import debounce from 'lodash/debounce';
import { presetAuthType } from '../preset';
import type { Authenticator as AuthenticatorType } from './authenticator';
import AuthProvider from './providers/AuthProvider';
import { BasicSignInForm } from './forms/BasicSignInForm';
import { BasicSignUpForm } from './forms/BasicSignUpForm';
import { authLocaleResources, NAMESPACE } from './locale';

class UserCenterLanguageItemModel extends UserCenterSelectItemModel {
  static itemId = 'language';

  section = 'preferences' as const;
  sort = 350;
  label = 'Language';

  async prepare() {
    const systemSettings = await this.context.systemSettings.load();
    const enabledLanguages = systemSettings?.data?.enabledLanguages || [];

    this.options = enabledLanguages.map((code: string) => ({
      value: code,
      label: languageCodes[code]?.label || code,
    }));
    this.value = this.context.app.apiClient.auth.getLocale?.() || this.context.app.apiClient.auth.locale;
    this.ready = this.options.length > 1;
  }

  async onChange(value: string) {
    this.context.app.apiClient.auth.setLocale(value);
    window.location.reload();
  }
}

export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};

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

const debouncedRedirect = debounce(
  (handler: () => void) => {
    handler();
  },
  3000,
  { leading: true, trailing: false },
);

export class PluginAuthClientV2 extends Plugin {
  authTypes = new Registry<AuthOptions>();

  registerType(authType: string, options: AuthOptions) {
    this.authTypes.register(authType, options);
  }

  async load() {
    Object.entries(authLocaleResources).forEach(([lang, resource]) => {
      this.app.i18n.addResources(lang, NAMESPACE, resource);
    });

    this.app.use(AuthProvider);
    this.app.flowEngine.registerModels({ UserCenterLanguageItemModel });

    this.addRoutes();
    this.registerPresetAuthType();
    this.installInterceptors();
  }

  private addRoutes() {
    this.router.add('auth', {
      componentLoader: () => import('./pages/AuthLayout'),
    });
    this.router.add('auth.signin', {
      path: '/signin',
      skipAuthCheck: true,
      componentLoader: () => import('./pages/SignInPage'),
    });
    this.router.add('auth.signup', {
      path: '/signup',
      skipAuthCheck: true,
      componentLoader: () => import('./pages/SignUpPage'),
    });
    this.router.add('auth.forgotPassword', {
      path: '/forgot-password',
      skipAuthCheck: true,
      componentLoader: () => import('./pages/ForgotPasswordPage'),
    });
    this.router.add('auth.resetPassword', {
      path: '/reset-password',
      skipAuthCheck: true,
      componentLoader: () => import('./pages/ResetPasswordPage'),
    });
  }

  private registerPresetAuthType() {
    this.registerType(presetAuthType, {
      components: {
        SignInForm: BasicSignInForm,
        SignUpForm: BasicSignUpForm,
      },
    });
  }

  private installInterceptors() {
    const axios = this.app.apiClient.axios;
    const resHandler = (res: any) => {
      const newToken = res?.headers?.['x-new-token'];
      if (newToken) {
        this.app.apiClient.auth.setToken(newToken);
      }
      return res;
    };
    const errHandler = (error: any) => {
      const newToken = error?.response?.headers?.['x-new-token'];
      const errors = error?.response?.data?.errors;
      const firstError = Array.isArray(errors) ? errors[0] : null;
      const locationLike = this.app.router.router?.state?.location || window.location;
      const pathname = locationLike?.pathname || window.location.pathname;
      const status = error?.status || error?.response?.status;

      if (newToken) {
        this.app.apiClient.auth.setToken(newToken);
      }

      if (status === 401 && firstError?.code && AuthErrorCode[firstError?.code as keyof typeof AuthErrorCode]) {
        this.app.apiClient.auth.setToken('');
        this.app.apiClient.auth.setRole('');
        this.app.apiClient.auth.setAuthenticator('');
      }

      if (
        status === 401 &&
        !error.config?.skipAuth &&
        firstError?.code &&
        AuthErrorCode[firstError?.code as keyof typeof AuthErrorCode]
      ) {
        if (firstError?.code === AuthErrorCode.SKIP_TOKEN_RENEW) {
          throw error;
        }

        const isSkippedAuthCheckRoute = this.app.router.isSkippedAuthCheckRoute(pathname);
        if (isSkippedAuthCheckRoute) {
          error.config.skipNotify = true;
        }

        if (!isSkippedAuthCheckRoute) {
          const redirectPath = getCurrentV2RedirectPath(this.app, locationLike);
          debouncedRedirect(() => {
            this.app.apiClient.auth.setToken('');
            redirectToLegacySignin(this.app, redirectPath, { replace: true });
          });
          return new Promise<never>(() => undefined);
        }
      }
      throw error;
    };

    // @ts-ignore
    axios.interceptors.response.handlers.unshift({
      fulfilled: resHandler,
      rejected: errHandler,
      synchronous: false,
      runWhen: null,
    });
  }
}

export default PluginAuthClientV2;
