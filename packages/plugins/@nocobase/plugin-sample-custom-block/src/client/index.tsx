import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, Plugin, useSchemaInitializerV2 } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';

export const HelloBlockInitializer = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { t } = useTranslation();
  return (
    <SchemaInitializerItem
      {...props}
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
    blockInitializers?.add('media.customBlock', {
      title: '{{t("Hello block")}}',
      Component: 'HelloBlockInitializer',
    });
  }
}

export default CustomBlockPlugin;
