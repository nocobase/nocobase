import { TableOutlined } from '@ant-design/icons';
import {
  SchemaInitializerItem,
  Plugin,
  SchemaComponentOptions,
  SettingsCenterProvider,
  useSchemaInitializerV2,
} from '@nocobase/client';
import { Card } from 'antd';
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

const HelloProvider = React.memo((props) => {
  return (
    <SettingsCenterProvider
      settings={{
        'sample-hello': {
          title: 'Hello',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Hello tab',
              component: () => <Card bordered={false}>Hello Settings</Card>,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{ HelloDesigner, HelloBlockInitializer }}>
        {props.children}
      </SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
HelloProvider.displayName = 'HelloProvider';

class HelloPlugin extends Plugin {
  async load() {
    this.app.addProvider(HelloProvider);
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('media.hello', {
      title: '{{t("Hello block")}}',
      Component: 'HelloBlockInitializer',
    });
  }
}

export default HelloPlugin;
