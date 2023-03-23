import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { DuplicatorDump } from './DuplicatorDump';
import { DuplicatorRestore } from './DuplicatorRestore';
import { usePluginUtils } from './hooks/i18';

export default function (props) {
  const { t } = usePluginUtils();

  return (
    <SettingsCenterProvider
      settings={{
        duplicator: {
          title: t('Duplicator'),
          icon: 'CloudDownloadOutlined',
          tabs: {
            dump: {
              title: t('Dump'),
              component: DuplicatorDump,
            },
            restore: {
              title: t('Restore'),
              component: DuplicatorRestore,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
}
