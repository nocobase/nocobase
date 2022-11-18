import { Result } from 'ahooks/lib/useRequest/src/types';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest, PluginManagerContext, useSystemSettings } from '..';

export interface OIDCProvider {
  clientId: string;
  providerName: string;
  authorizeUrl: string;
}

export interface SSOData {
  oidc: OIDCProvider[];
}

const SSOListContext = createContext<SSOData>({
  oidc: [],
});

const SSOIdPsProvider: React.FC = (props) => {
  const result = useRequest({
    url: 'oidcProviders:list',
    params: {
      filter: {
        'enable.$eq': true,
      },
    },
  });
  if (result.loading) {
    return <Spin />;
  }
  return (
    <SSOListContext.Provider
      value={{
        oidc: result?.data?.data ?? [],
      }}
    >
      {props.children}
    </SSOListContext.Provider>
  );
};

export const useOSSData = () => useContext(SSOListContext);

export const SSODataProvider: React.FC = (props) => {
  const result = useRequest({
    url: 'applicationPlugins:list',
    params: {
      filter: {
        'name.$any': ['oidc'],
        'enabled.$eq': true,
      },
    },
  });
  if (result.loading) {
    return <Spin />;
  }
  return !result.loading && result.data?.data?.length ? (
    <SSOIdPsProvider>{props.children}</SSOIdPsProvider>
  ) : (
    (props.children as React.ReactElement)
  );
};
