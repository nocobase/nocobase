import React, { createContext } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { i18n } from './i18n';
import { ConfigProvider as AntdConfigProvider, Spin } from 'antd';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import { ClientProvider, useClient } from './constate';
import useRequest from '@ahooksjs/use-request';

function AntdProvider(props) {
  const { i18n } = useTranslation();
  const { client } = useClient();
  const { loading } = useRequest(() => client.request('app:getLang'), {
    onSuccess(data) {
      const locale = localStorage.getItem('locale');
      if (locale !== data.lang) {
        console.log('changeLanguage', data.lang);
        i18n.changeLanguage(data.lang);
      }
    },
    refreshDeps: [i18n.language],
    formatResult: (data) => data?.data,
  });
  if (loading) {
    return <Spin />;
  }
  console.log('i18n.language', i18n.language);
  return <AntdConfigProvider locale={i18n.language === 'zh-CN' ? zhCN : enUS}>{props.children}</AntdConfigProvider>;
}

export function ConfigProvider(props: any) {
  const { client } = props;
  return (
    <ClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <AntdProvider>{props.children}</AntdProvider>
      </I18nextProvider>
    </ClientProvider>
  );
}
