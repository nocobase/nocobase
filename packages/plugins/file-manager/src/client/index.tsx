import { PluginManagerContext, SettingsCenterProvider, registerTemplate } from '@nocobase/client';
import { forEach } from '@nocobase/utils/client';
import React, { useContext } from 'react';
import { FileStoragePane } from './FileStorage';
import { FileStorageShortcut } from './FileStorageShortcut';
import * as templates from './templates';

// 注册之后就可以在 Crete collection 按钮中选择创建了
forEach(templates, (template, key: string) => {
  registerTemplate(key, template);
});

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
