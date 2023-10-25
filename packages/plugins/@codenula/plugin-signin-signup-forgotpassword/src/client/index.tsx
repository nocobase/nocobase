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
import React from 'react';
import './signin.css';
import './forgotPassword.css';
import './assets/icomoon/icomoon.css';

import CustomSigninPage from './pages/CustomSigninPage';
import CustomSignupPage from './pages/CustomSignupPage';
import CustomForgotPasswordPage from './pages/CustomForgotPasswordPage';

export class PluginSigninSignupForgotpasswordClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
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
