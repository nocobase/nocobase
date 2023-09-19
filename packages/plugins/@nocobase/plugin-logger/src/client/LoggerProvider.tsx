import { useCurrentUserSettingsMenu } from '@nocobase/client';
import { MenuProps } from 'antd';
import React, { useEffect } from 'react';

export const LoggerProvider = React.memo((props) => {
  const { addMenuItem } = useCurrentUserSettingsMenu();

  useEffect(() => {
    addMenuItem(
      {
        key: 'logger',
        eventKey: 'logger',
        label: '日志下载',
      } as MenuProps['items'][0],
      { before: 'divider_4' },
    );
  }, [addMenuItem]);

  return <>{props.children}</>;
});
LoggerProvider.displayName = 'LoggerProvider';
