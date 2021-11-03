import React, { createContext } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { i18n } from './i18n';
import { ConfigProvider as AntdConfigProvider } from 'antd';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import { ClientProvider } from './constate';

function AntdProvider(props) {
  const { i18n } = useTranslation();
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
