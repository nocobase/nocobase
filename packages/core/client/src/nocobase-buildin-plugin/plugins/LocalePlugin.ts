/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { setValidateLanguage } from '@formily/validator';
import { App } from 'antd';
import dayjs from 'dayjs';
import { loadConstrueLocale } from '../../antd-config-provider/loadConstrueLocale';
import { Plugin } from '../../application/Plugin';
import { dayjsLocale } from '../../locale';

export class LocalePlugin extends Plugin {
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
      this.engine.context.defineProperty('locales', {
        value: data?.data || {},
        info: {
          description: 'Locales payload loaded from server (app:getLang).',
          detail: 'Record<string, any>',
        },
      });
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
