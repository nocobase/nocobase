import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { FileStoragePane } from './FileStorage';
import { FileStorageShortcut } from './FileStorageShortcut';

export default function (props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        'file-manager': {
          title: '{{t("File manager")}}',
          icon: 'FileOutlined',
          tabs: {
            storages: {
              title: '{{t("File storages")}}',
              component: FileStoragePane,
            },
          },
        },
      }}
    >
      <PluginManagerContext.Provider
        value={{
          components: {
            ...ctx?.components,
            FileStorageShortcut,
          },
        }}
      >
        {props.children}
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
}
