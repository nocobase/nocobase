import { TableOutlined } from '@ant-design/icons';

import {
  Plugin,
  SchemaComponentOptions,
  SchemaInitializer,
  SchemaInitializerContext,
  SettingsCenterProvider,
} from '@nocobase/client';

import { ResetPassword } from './pages/ResetPassword';
import { useTranslation } from 'react-i18next';
import { SigninSignupDesigner } from './SigninSignupDesigner';
import React, { useContext } from 'react';
import './signin.css';
import './forgotPassword.css';
import './assets/icomoon/icomoon.css';

import CustomSigninPage from './pages/CustomSigninPage';
import CustomSignupPage from './pages/CustomSignupPage';
import CustomForgotPasswordPage from './pages/CustomForgotPasswordPage';
import Home from './pages/SigninOptions';
import SigninOptions from './pages/SigninOptions';
import SignupOptions from './pages/SignupOptions';
import ForgotPasswordOptions from './pages/ForgotPasswordOptions';

export const SigninSignupInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'SigninSignupDesigner',
          properties: {
            request: {
              type: 'void',
              'x-component': 'div',
              'x-content': 'Input Request',
            },
          },
        });
      }}
      title={t('Input block')}
    />
  );
};
const SigninSignpProviderNew = React.memo((props) => {
  const items = useContext<any>(SchemaInitializerContext);
  const children = items.BlockInitializers.items[1].children;
  children.push({
    key: 'signin-signup',
    type: 'item',
    title: '{{t("Signin Signup block")}}',
    component: 'SigninSignupInitializer',
  });
  return (
    <SettingsCenterProvider
      settings={{
        'signin-signup-forgotpassword': {
          title: 'Signin/Signup/Forgot-password options',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Signin options',
              component: () => <SigninOptions />,
            },
            tab2: {
              title: 'Signup options',
              component: () => <SignupOptions />,
            },
            tab3: {
              title: 'Forgot password options',
              component: () => <ForgotPasswordOptions />,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{ SigninSignupDesigner, SigninSignupInitializer }}>
        <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
      </SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
SigninSignpProviderNew.displayName = 'SigninSignup';

export class PluginSigninSignupForgotpasswordClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addProvider(SigninSignpProviderNew);
    console.log(this.app);
    this.addRoutes();
    this.app.addComponents({
      SigninPage: CustomSigninPage,
      SignupPage: CustomSignupPage,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
  addRoutes() {
    this.app.router.add('forgotPassword', {
      path: '/forgotPassword',
      element: <CustomForgotPasswordPage />,
    });
    this.app.router.add('resetPassword', {
      path: '/resetPassword/:email/:token',
      element: <ResetPassword />,
    });
  }
}

export default PluginSigninSignupForgotpasswordClient;
