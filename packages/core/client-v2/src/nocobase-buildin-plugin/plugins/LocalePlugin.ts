/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { setValidateLanguage } from '@formily/validator';
import dayjs from 'dayjs';
import { App } from 'antd';
import { Plugin } from '../../Plugin';
import { dayjsLocale } from './dayjsLocale';
import { loadConstrueLocale } from './loadConstrueLocale';

/**
 * 同步后端下发的语言资源到 client-v2 运行时。
 */
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
      const data = res?.data?.data || {};

      this.engine.context.defineProperty('locales', { value: data });
      this.app.use(App, { component: false });

      if (data.lang) {
        api.auth.setLocale(data.lang);
        this.app.i18n.changeLanguage(data.lang);
      }

      Object.keys(data.resources || {}).forEach((key) => {
        this.app.i18n.addResources(data.lang, key, data.resources[key] || {});
      });

      setValidateLanguage(data.lang);
      loadConstrueLocale(data);

      const dayjsLang = dayjsLocale[data.lang] || 'en';
      await import(`dayjs/locale/${dayjsLang}`);
      dayjs.locale(dayjsLang);

      window['cronLocale'] = data.cron;
    } catch (error) {
      throw error;
    }
  }
}
