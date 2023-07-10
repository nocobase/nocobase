import { createRouterManager, Plugin, RouterManager, RouteSchemaComponent } from '@nocobase/client';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { MobileClientProvider } from './MobileClientProvider';
import MApplication from './router/Application';

export class MobileClientPlugin extends Plugin {
  public mobileRouter: RouterManager;
  async load() {
    this.setMobileRouter();
    this.addRoutes();
    this.app.use(MobileClientProvider);
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
