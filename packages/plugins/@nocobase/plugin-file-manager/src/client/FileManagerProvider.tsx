import {
  CollectionManagerProvider,
  PluginManagerContext,
  registerField,
  registerTemplate,
  SchemaComponentOptions,
  SettingsCenterProvider,
} from '@nocobase/client';
import { forEach } from '@nocobase/utils/client';
import React, { FC, useContext } from 'react';
import { FileStoragePane } from './FileStorage';
import * as hooks from './hooks';
import { UploadActionInitializer } from './initializers';
import { attachment } from './interfaces/attachment';
import { NAMESPACE } from './locale';
import * as templates from './templates';

// 注册之后就可以在 Crete collection 按钮中选择创建了
forEach(templates, (template, key: string) => {
  registerTemplate(key, template);
});

registerField(attachment.group, 'attachment', attachment);

export const FileManagerProvider: FC = (props) => {
  const ctx = useContext(PluginManagerContext);

  return (
    <SettingsCenterProvider
      settings={{
        'file-manager': {
          title: `{{t("File manager", { ns: "${NAMESPACE}" })}}`,
          icon: 'FileOutlined',
          tabs: {
            storages: {
              title: `{{t("File storage", { ns: "${NAMESPACE}" })}}`,
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
          },
        }}
      >
        <CollectionManagerProvider interfaces={{ attachment }}>
          <SchemaComponentOptions scope={hooks} components={{ UploadActionInitializer }}>
            {props.children}
          </SchemaComponentOptions>
        </CollectionManagerProvider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
