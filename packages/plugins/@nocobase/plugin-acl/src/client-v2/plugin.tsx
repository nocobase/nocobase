import { Plugin } from '@nocobase/client-v2';

export class PluginAclClientV2 extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponentLoaders({
      DemoFlowSettingsLazyField: () => import('./settings/DemoFlowSettingsLazyField'),
    });

    this.router.add('acl-v2.homepage', {
      path: '/v2-demo/',
      componentLoader: () => import('./routes/DemoHomepageRoute'),
    });
    this.router.add('acl-v2.app-info', {
      path: '/v2-demo/app-info',
      componentLoader: () => import('./routes/AppInfoDemoRoute'),
    });
    this.router.add('acl-v2.flow-settings-component-loader', {
      path: '/v2-demo/flow-settings-component-loader',
      componentLoader: () => import('./routes/FlowSettingsComponentLoaderDemoRoute'),
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

export default PluginAclClientV2;
