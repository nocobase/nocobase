import { ConfigProvider, Spin } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../api-client';

export function AntdConfigProvider(props) {
  const { remoteLocale, ...others } = props;
  const api = useAPIClient();
  const { i18n } = useTranslation();
  const { data, loading } = useRequest(
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
        Object.keys(data?.data?.resources || {}).forEach((key) => {
          i18n.addResources(data?.data?.lang, key, data?.data?.resources[key] || {});
        });
      },
      manual: !remoteLocale,
    },
  );
  if (loading) {
    return <Spin />;
  }
  return (
    <ConfigProvider dropdownMatchSelectWidth={false} {...others} locale={data?.data?.antd || {}}>
      {props.children}
    </ConfigProvider>
  );
}
