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
    await this.app.pm.add(NocoBaseBuildInPlugin);
  }
}
