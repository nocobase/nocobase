/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App } from 'antd';
import React, { memo, useEffect } from 'react';
import { useAPIClient } from '../api-client';
import { useApp } from '../application';

const AppInner = memo(({ children }: { children: React.ReactNode }) => {
  const app = useApp();
  const { notification } = App.useApp();
  const apiClient = useAPIClient();

  useEffect(() => {
    apiClient.notification = notification;
    app.notification = notification;
  }, [notification]);

  return <>{children}</>;
});
AppInner.displayName = 'AppInner';

const AntdAppProvider = ({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <App
      className={className}
      style={{
        height: '100%',
        ...style,
      }}
    >
      <AppInner>{children}</AppInner>
    </App>
  );
};

AntdAppProvider.displayName = 'AntdAppProvider';

export default AntdAppProvider;
