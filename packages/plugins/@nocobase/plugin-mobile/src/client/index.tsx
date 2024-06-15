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
import { MobileApplication } from './mobile-application';

import { TabBar, mobileMenuInitializer } from './tabbar';

export * from './tabbar';

export class PluginMobileClient extends Plugin {
  mobileRouter: RouterManager;

  options: { type: 'hash' | 'browser' | 'memory' } = { type: 'hash' };

  async load() {
    this.app.addComponents({ MobileTabBar: TabBar });
    this.app.schemaInitializerManager.add(mobileMenuInitializer);
  }

  setMobileRouter() {
    const router = createRouterManager({ type: this.options?.type || 'hash' }, this.app);
    router.add('mobile', {
      path: '/mobile',
      element: <MobileApplication />,
    });

    this.mobileRouter = router;
  }
}

export default PluginMobileClient;
