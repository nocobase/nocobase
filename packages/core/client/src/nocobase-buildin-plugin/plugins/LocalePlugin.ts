import { dayjs } from '@nocobase/utils/client';
import { ConfigProvider } from 'antd';
import { loadConstrueLocale } from '../../antd-config-provider/loadConstrueLocale';
import { Plugin } from '../../application/Plugin';

export class LocalePlugin extends Plugin {
  locales: any = {};
  async afterAdd() {
    const api = this.app.apiClient;
    const locale = api.auth.locale;
    try {
      const { data } = await api.request({
        url: 'app:getLang',
        params: {
          locale,
        },
      });
      this.locales = data?.data || {};
      this.app.use(ConfigProvider, { locale: this.locales.antd, popupMatchSelectWidth: false });
      if (data?.data?.lang && !locale) {
        api.auth.setLocale(data?.data?.lang);
        this.app.i18n.changeLanguage(data?.data?.lang);
      }
      Object.keys(data?.data?.resources || {}).forEach((key) => {
        this.app.i18n.addResources(data?.data?.lang, key, data?.data?.resources[key] || {});
      });
      loadConstrueLocale(data?.data);
      dayjs.locale(data?.data?.moment);
      window['cronLocale'] = data?.data?.cron;
    } catch (error) {
      (() => {})();
      throw error;
    }
  }
}
