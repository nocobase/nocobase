import { createRouterManager, Plugin, RouterManager, RouteSchemaComponent } from '@nocobase/client';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { MobileClientProvider } from './MobileClientProvider';
import MApplication from './router/Application';
import { mBlockInitializers, mBlockInitializers_deprecated } from './core/schema';
import { AppConfiguration, InterfaceConfiguration } from './configuration';
import { NAMESPACE } from './locale';

export class MobileClientPlugin extends Plugin {
  public mobileRouter: RouterManager;
  async load() {
    this.setMobileRouter();
    this.addRoutes();
    this.addSettings();
    this.app.use(MobileClientProvider);
    this.app.schemaInitializerManager.add(mBlockInitializers_deprecated);
    this.app.schemaInitializerManager.add(mBlockInitializers);
  }

  addSettings() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Mobile Client-side", { ns: "${NAMESPACE}" })}}`,
      icon: 'MobileOutlined',
      Component: () => <Outlet />,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.interface`, {
      title: `{{t("Interface Configuration", { ns: "${NAMESPACE}" })}}`,
      Component: InterfaceConfiguration,
      sort: 1,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.app`, {
      title: `{{t("App Configuration", { ns: "${NAMESPACE}" })}}`,
      Component: AppConfiguration,
      sort: 2,
    });
  }

  setMobileRouter() {
    const router = createRouterManager({ type: 'hash' }, this.app);
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
