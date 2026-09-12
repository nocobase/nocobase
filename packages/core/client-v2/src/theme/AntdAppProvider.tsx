/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '../hooks/useApp';
import { App } from 'antd';
import React, { memo, useLayoutEffect } from 'react';

const AppInner = memo(({ children }: { children: React.ReactNode }) => {
  const app = useApp();
  const { notification } = App.useApp();

  useLayoutEffect(() => {
    app.context.defineProperty('notification', {
      value: notification,
    });
  }, [app, notification]);

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
