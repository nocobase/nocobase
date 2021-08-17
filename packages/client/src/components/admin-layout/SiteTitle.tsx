import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu, Spin } from 'antd';
import { useHistory } from 'react-router-dom';
import { request } from '../../schemas';
import { useRequest } from 'ahooks';
import { Resource } from '../../resource';
import { createContext } from 'react';

export const SystemSettingsContext = createContext(null);

export function SystemSettingsProvider(props) {
  const resource = Resource.make({
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
      {service.loading ? <Spin /> : props.children}
    </SystemSettingsContext.Provider>
  );
}

export const SiteTitle = () => {
  const { service = {} } = useContext(SystemSettingsContext);
  const { loading, data } = service;
  return (
    <div className={'site-info'}>
      {!loading && data?.logo?.url && (
        <img className={'site-logo'} src={data?.logo?.url} />
      )}
      {!loading && !data?.showLogoOnly && data?.title && (
        <div className={'site-title'}>{data.title}</div>
      )}
    </div>
  );
};
