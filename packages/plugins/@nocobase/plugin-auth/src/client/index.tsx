import { Plugin } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';
import { presetAuthType } from '../preset';
import { AuthProvider } from './AuthProvider';
import { Authenticator as AuthenticatorType } from './authenticator';
import { Options, SignInForm, SignUpForm } from './basic';
import { NAMESPACE } from './locale';
import { AuthLayout, SignInPage, SignUpPage } from './pages';
import { Authenticator } from './settings/Authenticator';

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
  }
}

export { AuthenticatorsContext, useAuthenticator } from './authenticator';
export type { Authenticator } from './authenticator';
export { useSignIn } from './basic';

export default PluginAuthClient;
