import { TableOutlined } from '@ant-design/icons';
import { Plugin, SchemaComponentOptions, SchemaInitializer, SchemaInitializerContext, useApp } from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';

export const HelloBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
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
  const items = useContext<any>(SchemaInitializerContext);
  const children = items.BlockInitializers.items[1].children;
  children.push({
    key: 'hello',
    type: 'item',
    title: '{{t("Hello block")}}',
    component: 'HelloBlockInitializer',
  });
  return (
    <SchemaComponentOptions components={{ HelloDesigner, HelloBlockInitializer }}>
      <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
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
    this.app.settingsCenter.add('sample-hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: HelloPluginSettingPage,
      sort: 100,
    });
  }
}

export default HelloPlugin;
