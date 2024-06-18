/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Plugin, RouterManager, createRouterManager } from '@nocobase/client';
import { Mobile } from './mobile';
import { MobileLayout } from './mobile/MobileLayout';

export class PluginMobileClient extends Plugin {
  mobileRouter?: RouterManager;

  async load() {
    this.addAppRoutes();
    this.setMobileRouter();
    this.addRoutes();
  }

  setMobileRouter() {
    const router = createRouterManager(this.options?.config?.router || { type: 'browser' }, this.app);
    this.mobileRouter = router;
  }

  addRoutes() {
    this.mobileRouter.add('mobile', {
      element: <MobileLayout />,
    });

    this.mobileRouter.add('mobile.home', {
      path: '/',
      element: <div>home page</div>,
    });
  }

  addAppRoutes() {
    this.app.router.add('mobile', {
      path: '/mobile/*',
      element: <Mobile />,
    });
  }

  getRouterComponent() {
    return this.mobileRouter.getRouterComponent();
  }
}

export default PluginMobileClient;
