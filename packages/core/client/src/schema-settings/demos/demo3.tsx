import {
  Application,
  CardItem,
  Grid,
  Plugin,
  SchemaComponent,
  SchemaComponentContext,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaSettings,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { Button } from 'antd';
import React, { useContext, useState } from 'react';

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
  name: 'MyInitializer',
  // 正常情况下这个值为 false，通过点击页面左上角的设计按钮切换，这里为了显示设置为 true
  designable: true,
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
  const ctx = useContext(SchemaComponentContext);
  return (
    <Button
      style={{ marginBottom: 24 }}
      onClick={() => {
        ctx.setDesignable(!ctx.designable);
      }}
    >
      designable: {ctx.designable ? 'true' : 'false'}
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
          'x-initializer': 'MyInitializer',
        }}
      />
    </div>
  );
};

class PluginHello extends Plugin {
  async load() {
    this.app.addProvider((props) => {
      const state = useState(false);
      return (
        <SchemaComponentProvider designableState={state} scope={this.app.scopes} components={this.app.components}>
          {props.children}
        </SchemaComponentProvider>
      );
    });
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
  plugins: [PluginHello],
});

export default app.getRootComponent();
