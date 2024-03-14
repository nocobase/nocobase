import {
  Application,
  CardItem,
  Grid,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaSettings,
  useSchemaComponentContext,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';

const mySettings = new SchemaSettings({
  name: 'mySettings',
  items: [
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
      },
    },
  ],
});

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  //  按钮标题标题
  title: 'Button Text',
  wrap: Grid.wrap,
  // 调用 initializer.render() 时会渲染 items 列表
  items: [
    {
      name: 'demo1',
      title: 'Demo1',
      Component: () => {
        const itemConfig = useSchemaInitializerItem();
        // 调用插入功能
        const { insert } = useSchemaInitializer();
        const handleClick = () => {
          insert({
            type: 'void',
            'x-settings': 'mySettings',
            'x-decorator': 'CardItem',
            'x-component': 'Hello',
          });
        };
        return <SchemaInitializerItem title={itemConfig.title} onClick={handleClick}></SchemaInitializerItem>;
      },
    },
  ],
});

const Hello = () => <h1>Hello, world!</h1>;

const Btn = () => {
  const { designable, setDesignable } = useSchemaComponentContext();
  return (
    <Button
      style={{ marginBottom: 24 }}
      onClick={() => {
        setDesignable(!designable);
      }}
    >
      designable: {designable ? 'true' : 'false'}
    </Button>
  );
};

const HelloPage = () => {
  return (
    <div>
      <Btn />
      <SchemaComponent
        schema={{
          name: 'hello',
          type: 'void',
          'x-component': 'Grid',
          'x-initializer': 'myInitializer',
        }}
      />
    </div>
  );
};

class PluginHello extends Plugin {
  async load() {
    this.app.addComponents({ Grid, CardItem, Hello });
    this.app.schemaSettingsManager.add(mySettings);
    this.app.schemaInitializerManager.add(myInitializer);
    this.router.add('hello', {
      path: '/',
      Component: HelloPage,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
  },
  designable: true,
  plugins: [PluginHello],
});

export default app.getRootComponent();
