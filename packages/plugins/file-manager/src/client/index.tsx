import {
  PluginManagerContext,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
  SettingsCenterProvider,
  registerTemplate,
  useCollection,
} from '@nocobase/client';
import { forEach } from '@nocobase/utils/client';
import React, { useContext } from 'react';
import { FileStoragePane } from './FileStorage';
import { FileStorageShortcut } from './FileStorageShortcut';
import * as hooks from './hooks';
import * as initializers from './initializers';
import * as templates from './templates';

// 注册之后就可以在 Crete collection 按钮中选择创建了
forEach(templates, (template, key: string) => {
  registerTemplate(key, template);
});

export default function (props) {
  const initializes = useContext(SchemaInitializerContext);
  const hasUploadAction = initializes.TableActionInitializers.items[0].children.some(
    (initialize) => initialize.component === 'UploadActionInitializer',
  );
  !hasUploadAction &&
    initializes.TableActionInitializers.items[0].children.push({
      type: 'item',
      title: "{{t('Upload')}}",
      component: 'UploadActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      visible: () => {
        const collection = useCollection();
        return collection.template === 'file';
      },
    });

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
        <SchemaComponentOptions scope={hooks}>
          <SchemaInitializerProvider components={initializers}>{props.children}</SchemaInitializerProvider>
        </SchemaComponentOptions>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
}
