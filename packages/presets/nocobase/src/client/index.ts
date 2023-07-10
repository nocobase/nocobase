import { NocoBaseBuildInPlugin, Plugin } from '@nocobase/client';

const getCurrentTimezone = () => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  const timezone = String(timezoneOffset).padStart(2, '0') + ':00';
  return (timezoneOffset > 0 ? '+' : '-') + timezone;
};

function getBasename() {
  const match = location.pathname.match(/^\/apps\/([^/]*)\//);
  return match ? match[0] : '/';
}

export class NocoBaseClientPresetPlugin extends Plugin {
  async afterAdd() {
    this.router.setType('browser');
    this.router.setBasename(getBasename());
    this.app.apiClient.axios.interceptors.request.use((config) => {
      config.headers['X-Hostname'] = window?.location?.hostname;
      config.headers['X-Timezone'] = getCurrentTimezone();
      return config;
    });
    this.app.pm.add(NocoBaseBuildInPlugin);
    await this.loadRemotePlugin();
  }

  // TODO: 现在是先远程加载远程组件的名称，然后再加载本地组件
  // 后面会改为直接加载远程组件，现在暂时先这样处理
  // 远程加载的逻辑后面会挪到内核 `@nocobase/client` 中
  async loadRemotePlugin() {
    if (this.app.dynamicImport) {
      const res = await this.app.apiClient.request({ url: 'app:getPlugins' });
      const pluginNames = res.data?.data || [];
      for await (const pluginName of pluginNames) {
        const ProviderComponent = await this.app.dynamicImport(pluginName);
        this.app.pm.add(ProviderComponent.default, { name: pluginName });
      }
    }
  }
}
