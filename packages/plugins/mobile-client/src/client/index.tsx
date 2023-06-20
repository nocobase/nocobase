import { Plugin } from '@nocobase/client';
import React from 'react';
import { MobileClientProvider } from './MobileClientProvider';
import MApplication from './router/Application';

export class MobileClientPlugin extends Plugin {
  async load() {
    this.addRoutes();
    this.app.use(MobileClientProvider);
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
