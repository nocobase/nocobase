/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createRouterManager, PinnedPluginListProvider, Plugin, RouterManager } from '@nocobase/client';
import React from 'react';
import { EventFlowConfig } from './EventFlowConfig';
import { EventflowIcon } from './EventflowIcon';
import { EventFlowList } from './EventFlowList';
import { EventFlowProvider } from './EventFlowProvider';
import { PluginEventflowExamplesClient } from './PluginEventflowExamplesClient';

export class PluginEventflowClient extends Plugin {
  private _router: RouterManager;
  public get router(): RouterManager {
    return this._router;
  }

  setRouter() {
    const router = createRouterManager({ type: 'memory', initialEntries: ['/'] }, this.app);
    this._router = router;

    router.add('list', {
      path: '/',
      Component: EventFlowList,
    });

    router.add('eventflow', {
      path: '/eventflow/:key',
      Component: EventFlowConfig,
    });
  }

  renderRouter() {
    const Router = this.router.getRouterComponent();
    return React.createElement(Router);
  }

  addEventflowIcon() {
    this.app.addComponents({ EventflowIcon });
    this.app.addProvider(PinnedPluginListProvider, {
      items: { eventFlow: { order: 110, component: 'EventflowIcon', pin: true } },
    });
  }

  addEventFlowProvider() {
    this.app.addProvider(EventFlowProvider);
  }

  async load() {
    this.setRouter();
    this.addEventFlowProvider();
    this.addEventflowIcon();
  }

  async afterAdd() {
    await this.pm.add(PluginEventflowExamplesClient);
  }
}

export default PluginEventflowClient;
