import { TableOutlined } from '@ant-design/icons';
import { Plugin, SchemaComponentOptions, SchemaInitializer, SchemaInitializerContext, useApp } from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';
import { Outlet, useNavigate } from 'react-router-dom';
import { Tabs } from 'antd';

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

const HelloPage = () => {
  const app = useApp();
  const nav = useNavigate();
  const setting = app.settingsCenter.get('sample-hello');
  return (
    <Card bordered={false}>
      <div>公共部分。在下面的仅是 Tabs 的场景，完全没必要用路由的方式，仅是为了演示</div>
      <Tabs
        onChange={(path) => nav(path)}
        items={setting.children.map((item) => ({ label: item.label, key: item.path }))}
      ></Tabs>
      <Outlet />
    </Card>
  );
};

class HelloPlugin extends Plugin {
  async load() {
    this.app.addProvider(HelloProvider);
    this.app.settingsCenter.add('sample-hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      isBookmark: true,
      Component: HelloPage,
    });
    this.app.settingsCenter.add('sample-hello.aaa', {
      title: '测试A',
      Component: () => <div>测试A 内容</div>,
    });
    this.app.settingsCenter.add('sample-hello.bbb', {
      title: '测试B',
      Component: () => <div>测试B 内容</div>,
    });
  }
}

export default HelloPlugin;
