import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { DuplicatorDump } from './DuplicatorDump';
import { DuplicatorRestore } from './DuplicatorRestore';
import { useTranslation } from 'react-i18next';

export default function (props) {
  const { t } = useTranslation();

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
