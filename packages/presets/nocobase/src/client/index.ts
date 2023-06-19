import { Plugin } from '@nocobase/client';

export class NoCoBaseClientPresetPlugin extends Plugin {
  async afterAdd() {
    await this.loadRemotePlugin();
  }

  // TODO: 现在是先远程加载远程组件的名称，然后再加载本地组件
  // 后面会改为直接加载远程组件，现在暂时先这样处理
  // 远程加载的逻辑后面会挪到内核 `@nocobase/client` 中
  async loadRemotePlugin() {
    const res = await this.app.apiClient.request({ url: 'app:getPlugins' });
    const pluginNames = res.data?.data || [];

    for await (const pluginName of pluginNames) {
      const ProviderComponent = await import(`./plugins/${pluginName}`);
      this.app.pm.add(ProviderComponent);
    }
  }
}
