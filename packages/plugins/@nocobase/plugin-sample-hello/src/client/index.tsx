import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializerItem, Plugin, SchemaComponentOptions, useSchemaInitializer } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';

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

const HelloProvider = React.memo((props) => {
  return (
    <SchemaComponentOptions components={{ HelloDesigner, HelloBlockInitializer }}>
      {props.children}
    </SchemaComponentOptions>
  );
});
HelloProvider.displayName = 'HelloProvider';

const HelloPluginSettingPage = () => {
  return (
    <Card bordered={false}>
      <div>Hello plugin setting page</div>
    </Card>
  );
};

class HelloPlugin extends Plugin {
  async load() {
    this.app.addProvider(HelloProvider);
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('media.hello', {
      title: '{{t("Hello block")}}',
      Component: 'HelloBlockInitializer',
    });
    this.app.pluginSettingsManager.add('sample-hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: HelloPluginSettingPage,
      sort: 100,
    });
  }
}

export default HelloPlugin;
