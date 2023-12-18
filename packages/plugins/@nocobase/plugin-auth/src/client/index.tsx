import { Plugin } from '@nocobase/client';
import { AuthProvider } from './AuthProvider';
import { NAMESPACE } from './locale';
import { Authenticator } from './settings/Authenticator';
import { AuthLayout, SigninPage, SignupPage } from './pages';
import { ComponentType } from 'react';
import { Registry } from '@nocobase/utils/client';
import { presetAuthType } from '../preset';
import { BasicSigninPage, BasicSignupPage, Options } from './basic';

export type AuthPage = {
  signIn: {
    display: 'form' | 'custom';
    tabTitle?: string;
    Component: ComponentType<any>;
  };
  signUp?: {
    Component: ComponentType<any>;
  };
  configForm?: {
    Component: ComponentType<any>;
  };
};

export class AuthPlugin extends Plugin {
  authPages = new Registry<AuthPage>();

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
      Component: 'SigninPage',
    });
    this.router.add('auth.signup', {
      path: '/signup',
      Component: 'SignupPage',
    });

    this.app.addComponents({
      AuthLayout,
      SigninPage,
      SignupPage,
    });

    this.app.providers.unshift([AuthProvider, {}]);

    this.authPages.register(presetAuthType, {
      signIn: {
        display: 'form',
        tabTitle: this.app.i18n.t('Sign in via password', { ns: NAMESPACE }),
        Component: BasicSigninPage,
      },
      signUp: {
        Component: BasicSignupPage,
      },
      configForm: {
        Component: Options,
      },
    });
  }
}

export default AuthPlugin;
export { useSignIn } from './basic';
export { useAuthenticator, AuthenticatorsContext } from './authenticator';
export type { Authenticator } from './authenticator';
