import { TableOutlined } from '@ant-design/icons';
import { Plugin, SchemaInitializerItem, SchemaSettings, useSchemaInitializer } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const HelloBlockInitializer = (props) => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  return (
    <SchemaInitializerItem
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-settings': 'HelloSettings',
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

const HelloPluginSettingPage = () => {
  return (
    <Card bordered={false}>
      <div>Hello plugin setting page</div>
    </Card>
  );
};

const helloSettings = new SchemaSettings({
  name: 'HelloSettings',
  items: [
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});

class HelloPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.addItem('page:addBlock', 'otherBlocks.hello', {
      title: '{{t("Hello block")}}',
      Component: HelloBlockInitializer,
    });
    this.app.pluginSettingsManager.add('sample-hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: HelloPluginSettingPage,
      sort: 100,
    });
    this.schemaSettingsManager.add(helloSettings);
  }
}

export default HelloPlugin;
