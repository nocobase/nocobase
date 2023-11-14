import React from 'react';
import { Application, Plugin, SchemaSetting, SchemaSettings, useSchemaSettingsRender } from '@nocobase/client';

const mySchemaSetting = new SchemaSetting({
  name: 'MySchemaSetting',
  items: [
    {
      name: 'demo1', // 唯一标识
      type: 'item', // 内置类型
      componentProps: {
        title: 'DEMO1',
        onClick() {
          alert('DEMO1');
        },
      },
    },
    {
      name: 'demo2',
      Component: () => <SchemaSettings.Item title="DEMO2" onClick={() => alert('DEMO2')} />, // 直接使用 Component 组件
    },
  ],
});

const Root = () => {
  const { render } = useSchemaSettingsRender('MySchemaSetting');
  return <div>{render()}</div>;
};

class MyPlugin extends Plugin {
  async load() {
    // 注册 schema settings
    this.app.schemaSettingsManager.add(mySchemaSetting);
  }
}

class MyPlugin2 extends Plugin {
  async load() {
    const mySchemaSetting = this.app.schemaSettingsManager.get('MySchemaSetting');

    // 添加或者修改 schema settings 的 items
    mySchemaSetting.add('demo3', {
      Component: () => <SchemaSettings.Item title="DEMO3" onClick={() => alert('DEMO3')} />,
    });

    // 移除 demo2
    mySchemaSetting.remove('demo2');
  }
}

const app = new Application({
  plugins: [MyPlugin, MyPlugin2],
  providers: [Root],
});

export default app.getRootComponent();
