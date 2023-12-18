import { Plugin } from '@nocobase/client';
import { AuthProvider } from './AuthProvider';
import { NAMESPACE } from './locale';
import { Authenticator } from './settings/Authenticator';
import { AuthLayout, SignInPage, SignUpPage } from './pages';
import { ComponentType } from 'react';
import { Registry } from '@nocobase/utils/client';
import { presetAuthType } from '../preset';
import { BasicSignInPage, BasicSignUpPage, Options } from './basic';
import { Authenticator as AuthenticatorType } from './authenticator';

export type AuthPage = {
  signIn: {
    display: 'form' | 'custom';
    tabTitle?: string;
    Component: ComponentType<{
      authenticator: AuthenticatorType;
    }>;
  };
  signUp?: {
    Component: ComponentType<{
      authenticatorName: string;
    }>;
  };
  configForm?: {
    Component: ComponentType;
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

    this.authPages.register(presetAuthType, {
      signIn: {
        display: 'form',
        tabTitle: this.app.i18n.t('Sign in via password', { ns: NAMESPACE }),
        Component: BasicSignInPage,
      },
      signUp: {
        Component: BasicSignUpPage,
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
