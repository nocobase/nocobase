import { setValidateLanguage } from '@formily/validator';
import { App, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { loadConstrueLocale } from '../../antd-config-provider/loadConstrueLocale';
import { Plugin } from '../../application/Plugin';
import { dayjsLocale } from '../../locale';

export class LocalePlugin extends Plugin {
  locales: any = {};
  async afterAdd() {
    const api = this.app.apiClient;
    const locale = api.auth.locale;
    try {
      const res = await api.request({
        url: 'app:getLang',
        params: {
          locale,
        },
        headers: {
          'X-Role': 'anonymous',
        },
      });
      const data = res?.data;
      this.locales = data?.data || {};
      this.app.use(ConfigProvider, { locale: this.locales.antd, popupMatchSelectWidth: false });
      this.app.use(App, { component: false });
      if (data?.data?.lang) {
        api.auth.setLocale(data?.data?.lang);
        this.app.i18n.changeLanguage(data?.data?.lang);
      }
      Object.keys(data?.data?.resources || {}).forEach((key) => {
        this.app.i18n.addResources(data?.data?.lang, key, data?.data?.resources[key] || {});
      });
      setValidateLanguage(data?.data?.lang);
      loadConstrueLocale(data?.data);
      const dayjsLang = dayjsLocale[data?.data?.lang] || 'en';
      await import(`dayjs/locale/${dayjsLang}`);
      dayjs.locale(dayjsLang);
      window['cronLocale'] = data?.data?.cron;
    } catch (error) {
      (() => {})();
      throw error;
    }
  }
}
