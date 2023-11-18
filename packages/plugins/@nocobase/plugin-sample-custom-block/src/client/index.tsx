import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, Plugin, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';

export const HelloBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const itemConfig = useSchemaInitializerItem();
  return (
    <SchemaInitializerItem
      {...itemConfig}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'HelloDesigner',
          properties: {
            hello: {
              type: 'void',
              'x-component': 'div',
              'x-content': 'Hello World',
            },
          },
        });
      }}
      title={t('Hello block')}
    />
  );
};

class CustomBlockPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      HelloDesigner,
      HelloBlockInitializer,
    });

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('otherBlocks.customBlock', {
      title: '{{t("Hello block")}}',
      Component: 'HelloBlockInitializer',
    });
  }
}

export default CustomBlockPlugin;
