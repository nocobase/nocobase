import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu, Spin } from 'antd';
import { useHistory } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { createContext } from 'react';
import { useResourceRequest } from '../../constate';

export const SystemSettingsContext = createContext(null);

export function SystemSettingsProvider(props) {
  const resource = useResourceRequest({
    resourceName: 'system_settings',
    resourceKey: 1,
  });
  const service = useRequest(
    () =>
      resource.get({
        resourceKey: 1,
        appends: ['logo'],
      }),
    {
      formatResult: (data) => data?.data,
    },
  );
  return (
    <SystemSettingsContext.Provider value={{ service, resource }}>
      {service.loading ? (
        <Spin size={'large'} className={'nb-spin-center'} />
      ) : (
        props.children
      )}
    </SystemSettingsContext.Provider>
  );
}

export const useSystemSettings = () => {
  const ctx = useContext(SystemSettingsContext);
  return ctx?.service?.data || {};
};

export const SiteTitle = () => {
  const { service = {} } = useContext(SystemSettingsContext);
  const { loading, data } = service;
  return (
    <div className={'site-info'}>
      {!loading && data?.logo?.url && (
        <img className={'site-logo'} src={data?.logo?.url} />
      )}
    </div>
  );
};
