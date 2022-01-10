import React, { createContext } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ConfigProvider, Spin } from 'antd';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';

export function AntdConfigProvider(props) {
  const { i18n } = useTranslation();
  return <ConfigProvider locale={i18n.language === 'zh-CN' ? zhCN : enUS}>{props.children}</ConfigProvider>;
}
