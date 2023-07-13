import { AppLangContext, useAppLangContext, useRequest } from '@nocobase/client';
import { ConfigProvider, Spin } from 'antd';
import deepmerge from 'deepmerge';
import React, { createContext } from 'react';
import { useTranslation } from 'react-i18next';

export const LocalizationContext = createContext<any>({});

export const LocalizationProvider = (props) => {
  const appLang = useAppLangContext();
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
            }
          });
          // For duplicate texts, use translations from client to override translations in other modules
          const client = appLang.resources.client || {};
          Object.keys(appLang.resources).forEach((key) => {
            if (key === 'client') {
              return;
            }
            Object.keys(appLang.resources[key]).forEach((text) => {
              if (client[text]) {
                appLang.resources[key][text] = client[text];
              }
            });
            i18n.addResources(appLang.lang, key, appLang.resources[key]);
          });
        }
        i18n.changeLanguage(appLang.lang);
      },
    },
  );
  if (loading) {
    return <Spin />;
  }
  return (
    <AppLangContext.Provider value={appLang}>
      <ConfigProvider popupMatchSelectWidth={false} {...props} locale={appLang.antd}>
        {props.children}
      </ConfigProvider>
    </AppLangContext.Provider>
  );
};
