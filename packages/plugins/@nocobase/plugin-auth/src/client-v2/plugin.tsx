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
import { getCurrentV2RedirectPath, Plugin, UserCenterSelectItemModel, languageCodes } from '@nocobase/client-v2';
import debounce from 'lodash/debounce';
import { presetAuthType } from '../preset';
import type { Authenticator as AuthenticatorType } from './authenticator';
import AuthProvider from './providers/AuthProvider';
import { NAMESPACE } from './locale';

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

type LoaderOf<P = Record<string, never>> = () => Promise<{ default: ComponentType<P> }>;

/**
 * V2 auth-type registration. Every form/button is registered as an async `import()` loader rather than a synchronous component reference. Consumers resolve them with `React.lazy` at render time so each auth-type contributes its own webpack chunk and is only fetched when an authenticator of that type is actually shown.
 *
 * Migration note: this replaces the v1 `components: { SignInForm, ... }` shape — sync component refs are no longer accepted.
 */
export type AuthOptions = {
  /** Sign-in form for an authenticator of this type. */
  signInFormLoader?: LoaderOf<{ authenticator: AuthenticatorType }>;
  /** Sign-up form for an authenticator of this type. */
  signUpFormLoader?: LoaderOf<{ authenticatorName: string }>;
  /** Optional button rendered on the sign-in page alongside the form tabs. */
  signInButtonLoader?: LoaderOf<{ authenticator: AuthenticatorType }>;
  /**
   * Per-authenticator administrator settings form, embedded inside the Authenticators page drawer below the common fields. Receives no props — it should read the current record / form values via antd `Form.useWatch` + `Form.Item`.
   */
  adminSettingsFormLoader?: LoaderOf;
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
    // i18n resources are auto-loaded by v2 buildin `LocalePlugin.afterAdd`; see plugin-password-policy/locale.ts for the full rationale.

    // `unshift` (not `app.use`/`push`) so AuthProvider becomes the outermost wrap — same as v1. Otherwise CurrentUserProvider mounts first, renders its own Spin and blocks children, and runs `/auth:check` before AuthProvider has had a chance to read the `?token=` query param the CAS / SAML server callbacks emit. The auth check then 401s and the browser bounces back to /signin.
    this.app.providers.unshift([AuthProvider, {}]);
    this.app.flowEngine.registerModels({ UserCenterLanguageItemModel });

    this.addRoutes();
    this.registerPresetAuthType();
    this.registerSettingsPages();
    this.installInterceptors();
  }

  private registerSettingsPages() {
    const t = (key: string) => this.app.i18n.t(key, { ns: NAMESPACE });
    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: t('Authentication'),
      icon: 'LoginOutlined',
      aclSnippet: 'pm.auth',
    });
    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'authenticators',
      title: t('Authenticators'),
      icon: 'LoginOutlined',
      aclSnippet: 'pm.auth.authenticators',
      sort: 1,
      componentLoader: () => import('./pages/AuthenticatorsPage'),
    });
    // Token policy lives under the shared `security` menu (registered by the v2 buildin plugin) alongside password-policy and locked-users. `sort: 0` keeps it as the first tab — same order as v1.
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'security',
      key: 'token-policy',
      title: t('Token policy'),
      icon: 'ApiOutlined',
      aclSnippet: 'pm.security.token-policy',
      sort: 0,
      componentLoader: () => import('./pages/TokenPolicyPage'),
    });
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
      signInFormLoader: () => import('./forms/BasicSignInForm'),
      signUpFormLoader: () => import('./forms/BasicSignUpForm'),
      adminSettingsFormLoader: () => import('./forms/BasicAuthAdminSettings'),
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
            // 用 react-router navigate (虚拟跳转)而不是 location.replace, 避免覆盖同时段其它响应拦截器触发的 window.location.href 整页跳转 (例如 2FA 接收到服务端 302 时)。
            this.app.router.navigate(`/signin?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
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
