import {
  CollectionManagerProvider,
  PluginManagerContext,
  registerField,
  registerTemplate,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
  SettingsCenterProvider,
  useCollection,
} from '@nocobase/client';
import { forEach } from '@nocobase/utils/client';
import React, { FC, useContext } from 'react';
import { FileStoragePane } from './FileStorage';
import * as hooks from './hooks';
import * as initializers from './initializers';
import { attachment } from './interfaces/attachment';
import { NAMESPACE } from './locale';
import * as templates from './templates';

// 注册之后就可以在 Crete collection 按钮中选择创建了
forEach(templates, (template, key: string) => {
  registerTemplate(key, template);
});

registerField(attachment.group, 'attachment', attachment);

export const FileManagerProvider: FC = (props) => {
  const initializes = useContext<any>(SchemaInitializerContext);
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
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const collection = useCollection();
        return collection.template === 'file';
      },
    });

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
          <SchemaComponentOptions scope={hooks}>
            <SchemaInitializerProvider components={initializers}>{props.children}</SchemaInitializerProvider>
          </SchemaComponentOptions>
        </CollectionManagerProvider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
