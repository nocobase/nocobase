import { App } from 'antd';
import React, { memo, useEffect } from 'react';
import { useAPIClient } from '../api-client';

const AppInner = memo(({ children }: { children: React.ReactNode }) => {
  const { notification } = App.useApp();
  const apiClient = useAPIClient();

  useEffect(() => {
    apiClient.notification = notification;
  }, [notification]);

  return <>{children}</>;
});

const AntdAppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <App
      style={{
        height: '100%',
      }}
    >
      <AppInner>{children}</AppInner>
    </App>
  );
};

AntdAppProvider.displayName = 'AntdAppProvider';

export default AntdAppProvider;
