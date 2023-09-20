import { SettingsCenterProvider, useAPIClient } from '@nocobase/client';
import React from 'react';
import { useLoggerTranslation } from './locale';
import { LogsDownloader } from './LogsDownloader';

export const LoggerProvider = React.memo((props) => {
  const { t } = useLoggerTranslation();

  return (
    <SettingsCenterProvider
      settings={{
        logger: {
          title: t('Logger'),
          icon: 'FileTextOutlined',
          tabs: {
            download: {
              title: t('Download logs'),
              component: () => <LogsDownloader />,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
});
LoggerProvider.displayName = 'LoggerProvider';
