import { SettingsCenterProvider } from '@nocobase/client';
import React from 'react';
import { DuplicatorDump } from './DuplicatorDump';
import { DuplicatorRestore } from './DuplicatorRestore';

export default function (props) {
  // return <div>{props.children}</div>;
  return (
    <SettingsCenterProvider
      settings={{
        duplicator: {
          title: 'Duplicator',
          icon: 'CloudDownloadOutlined',
          tabs: {
            dump: {
              title: 'Dump',
              component: DuplicatorDump,
            },
            restore: {
              title: 'Restore',
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
