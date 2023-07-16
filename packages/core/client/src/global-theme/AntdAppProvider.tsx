import { App } from 'antd';
import React from 'react';
import { useAPIClient } from '../api-client';

const AppInner = ({ children }: { children: React.ReactNode }) => {
  const { notification } = App.useApp();
  const apiClient = useAPIClient();

  apiClient.notification = notification;

  return <>{children}</>;
};

const AntdAppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <App>
      <AppInner>{children}</AppInner>
    </App>
  );
};

AntdAppProvider.displayName = 'AntdAppProvider';

export default AntdAppProvider;
