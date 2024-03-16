import { Application, NocoBaseBuildInPlugin, Plugin } from '@nocobase/client';

const getCurrentTimezone = () => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  const timezone = String(Math.abs(timezoneOffset)).padStart(2, '0') + ':00';
  return (timezoneOffset > 0 ? '+' : '-') + timezone;
};

function getBasename(app: Application) {
  const publicPath = app.getPublicPath();
  const pattern = `^${publicPath}apps/([^/]*)/`;
  const match = location.pathname.match(new RegExp(pattern));
  return match ? match[0] : publicPath;
}

export class NocoBaseClientPresetPlugin extends Plugin {
  async afterAdd() {
    this.router.setType('browser');
    this.router.setBasename(getBasename(this.app));
    this.app.apiClient.axios.interceptors.request.use((config) => {
      config.headers['X-Hostname'] = window?.location?.hostname;
      config.headers['X-Timezone'] = getCurrentTimezone();
      return config;
    });
    await this.app.pm.add(NocoBaseBuildInPlugin);
  }
}
