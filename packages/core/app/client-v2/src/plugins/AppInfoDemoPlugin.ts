/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class AppInfoDemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponentLoaders({
      DemoFlowSettingsLazyField: () => import('../settings/DemoFlowSettingsLazyField'),
    });

    this.router.add('demo.homepage', {
      path: '/',
      componentLoader: () => import('../routes/DemoHomepageRoute'),
    });
    this.router.add('demo.app-info', {
      path: '/demo/app-info',
      componentLoader: () => import('../routes/AppInfoDemoRoute'),
    });
    this.router.add('demo.flow-settings-component-loader', {
      path: '/demo/flow-settings-component-loader',
      componentLoader: () => import('../routes/FlowSettingsComponentLoaderDemoRoute'),
    });

    try {
      const response = await this.app.apiClient.request({
        url: 'app:getInfo',
      });
      console.log('[client-v2 demo plugin] /api/app:getInfo', response?.data);
    } catch (error) {
      console.error('[client-v2 demo plugin] failed to request /api/app:getInfo', error);
    }
  }
}
