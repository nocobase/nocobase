import { ConfigProvider, Spin } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../api-client';
import locale from '../locale';

export function AntdConfigProvider(props) {
  const { remoteLocale, ...others } = props;
  const api = useAPIClient();
  const { i18n } = useTranslation();
  const { loading } = useRequest(
    {
      url: 'app:getLang',
    },
    {
      onSuccess(data) {
        const locale = api.auth.locale;
        if (data?.data?.lang && !locale) {
          api.auth.setLocale(data?.data?.lang);
          i18n.changeLanguage(data?.data?.lang);
        }
      },
      manual: !remoteLocale,
    },
  );
  if (loading) {
    return <Spin />;
  }
  return (
    <ConfigProvider
      dropdownMatchSelectWidth={false}
      {...others}
      locale={locale[i18n.language].antd}
    >
      {props.children}
    </ConfigProvider>
  );
}
