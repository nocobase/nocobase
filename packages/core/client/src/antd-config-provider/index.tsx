/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs } from '@nocobase/utils/client';
import { ConfigProvider, Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../api-client';
import { Plugin } from '../application/Plugin';
import { loadConstrueLocale } from './loadConstrueLocale';

export const AppLangContext = createContext<any>({});
AppLangContext.displayName = 'AppLangContext';

export const useAppLangContext = () => {
  return useContext(AppLangContext);
};

export function AntdConfigProvider(props) {
  const { remoteLocale, ...others } = props;
  const api = useAPIClient();
  const { i18n } = useTranslation();
  const { data, loading } = useRequest<{
    data: {
      lang: string;
      resources: any;
      moment: string;
      antd: any;
      cron: any;
    };
  }>(
    {
      url: 'app:getLang',
      params: {
        locale: api.auth.locale,
      },
    },
    {
      onSuccess(data) {
        const locale = api.auth.locale;
        if (data?.data?.lang && !locale) {
          api.auth.setLocale(data?.data?.lang);
          i18n.changeLanguage(data?.data?.lang);
        }
        Object.keys(data?.data?.resources || {}).forEach((key) => {
          i18n.addResources(data?.data?.lang, key, data?.data?.resources[key] || {});
        });
        loadConstrueLocale(data?.data);
        dayjs.locale(data?.data?.moment);
        window['cronLocale'] = data?.data?.cron;
      },
      manual: !remoteLocale,
    },
  );
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Spin />
      </div>
    );
  }
  return (
    <AppLangContext.Provider value={data?.data}>
      <ConfigProvider popupMatchSelectWidth={false} {...others} locale={data?.data?.antd || {}}>
        {props.children}
      </ConfigProvider>
    </AppLangContext.Provider>
  );
}

export class AntdConfigPlugin extends Plugin {
  async load() {
    this.app.use(AntdConfigProvider, this.options?.config || {});
  }
}
