import { AppLangContext, loadConstrueLocale, useAPIClient, useAppLangContext, useRequest } from '@nocobase/client';
import { ConfigProvider, Spin } from 'antd';
import deepmerge from 'deepmerge';
import moment from 'moment';
import React, { createContext } from 'react';
import { useTranslation } from 'react-i18next';

export const LocalizationContext = createContext<any>({});

export const LocalizationProvider = (props) => {
  const appLang = useAppLangContext();
  const api = useAPIClient();
  const { i18n } = useTranslation();

  const { loading } = useRequest(
    {
      url: 'localization:all',
    },
    {
      onSuccess(data) {
        const custom = data?.data || {};
        if (appLang.resources) {
          Object.keys(appLang.resources).forEach((key) => {
            if (custom[`resources.${key}`]) {
              appLang.resources[key] = deepmerge(appLang.resources[key], custom[`resources.${key}`]);
              i18n.addResources(appLang?.lang, key, appLang.resources[key]);
            }
          });
        }
        if (custom.antd) {
          appLang.antd = deepmerge(appLang.antd, custom.antd);
        }
        if (custom.construe) {
          appLang.construe = deepmerge(appLang.construe, custom.construe);
          loadConstrueLocale(appLang);
        }
        if (custom.moment) {
          appLang.moment = deepmerge(appLang.moment, custom.moment);
          moment.locale(appLang.moment);
        }
        if (custom.cron) {
          appLang.cron = deepmerge(appLang.cron, custom.cron);
          window['cronLocale'] = appLang.cron;
        }
      },
    },
  );
  if (loading) {
    return <Spin />;
  }
  return (
    <AppLangContext.Provider value={appLang}>
      <ConfigProvider dropdownMatchSelectWidth={false} {...props} locale={appLang.antd}>
        {props.children}
      </ConfigProvider>
    </AppLangContext.Provider>
  );
};
