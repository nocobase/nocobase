import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';

export default function (props) {
  const ctx = useContext(PluginManagerContext);

  return (
    <SettingsCenterProvider
      settings={{
        'sample-hello': {
          title: 'Hello',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Hello Tab',
              component: <div>Hello WOrld</div>,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
}
