import {
  createRouterManager,
  Plugin,
  RouterManager,
  RouteSchemaComponent,
  SettingMultiPageLayout,
} from '@nocobase/client';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { MobileClientProvider } from './MobileClientProvider';
import MApplication from './router/Application';
import { AppConfiguration, InterfaceConfiguration } from './configuration';
import { NAMESPACE } from './locale';

export class MobileClientPlugin extends Plugin {
  public mobileRouter: RouterManager;
  async load() {
    this.setMobileRouter();
    this.addRoutes();
    this.addSettings();
    this.app.use(MobileClientProvider);
  }

  addSettings() {
    this.app.settingsCenter.add(NAMESPACE, {
      title: `{{t("Mobile Client-side", { ns: "${NAMESPACE}" })}}`,
      icon: 'MobileOutlined',
      Component: () => <SettingMultiPageLayout />,
    });
    this.app.settingsCenter.add(`${NAMESPACE}.interface`, {
      title: `{{t("Interface Configuration", { ns: "${NAMESPACE}" })}}`,
      Component: InterfaceConfiguration,
    });
    this.app.settingsCenter.add(`${NAMESPACE}.app`, {
      title: `{{t("App Configuration", { ns: "${NAMESPACE}" })}}`,
      Component: AppConfiguration,
    });
  }

  setMobileRouter() {
    const router = createRouterManager({ type: 'hash' });
    router.add('root', {
      path: '/',
      element: <Navigate replace to="/mobile" />,
    });
    router.add('mobile', {
      path: '/mobile',
      element: <MApplication />,
    });
    router.add('mobile.page', {
      path: '/mobile/:name',
      element: <RouteSchemaComponent />,
    });
    this.mobileRouter = router;
  }

  getMobileRouterComponent() {
    return this.mobileRouter.getRouterComponent();
  }

  addRoutes() {
    this.app.router.add('mobile', {
      path: '/mobile',
      element: <MApplication />,
    });
    this.app.router.add('mobile.page', {
      path: '/mobile/:name',
      Component: 'RouteSchemaComponent',
    });
  }
}

export default MobileClientPlugin;
