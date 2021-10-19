import React, { createContext } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '.';
// import { ConfigProvider as AntdConfigProvider } from 'antd';
// import enUS from 'antd/lib/locale/en_US';
// import zhCN from 'antd/lib/locale/zh_CN';
import { ClientProvider } from './constate';
// import moment from 'moment';
// import 'moment/locale/zh-cn';
// moment.locale('zh-cn');

const ConfigContext = createContext<any>(null);

export function ConfigProvider(props: any) {
  const { client } = props;
  return (
    <ClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
    </ClientProvider>
  );
}
