import {
  Application,
  CSSVariableProvider,
  Plugin,
  SchemaInitializer,
  useSchemaInitializerRender,
} from '@nocobase/client';
import React from 'react';

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  // 正常情况下这个值为 false，通过点击页面左上角的设计按钮切换，这里为了显示设置为 true
  designable: true,
  //  按钮标题标题
  title: 'Button Text',
  // 调用 initializer.render() 时会渲染 items 列表
  items: [
    {
      name: 'demo1', // 唯一标识
      Component: () => <div>myInitializer content</div>, // 渲染组件
    },
    {
      name: 'demo2',
      Component: () => <div>myInitializer content 2</div>,
    },
  ],
});

const Root = () => {
  const { render } = useSchemaInitializerRender('myInitializer');
  return <div>{render()}</div>;
};

class MyPlugin extends Plugin {
  async load() {
    // 注册 schema initializer
    this.app.schemaInitializerManager.add(myInitializer);
    // 注册路由
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

class MyPlugin2 extends Plugin {
  async load() {
    const myInitializer = this.app.schemaInitializerManager.get('myInitializer');

    // 添加或者修改 schema initializer 的 items
    myInitializer.add('demo3', {
      Component: () => <div>myInitializer content3</div>,
    });

    // 移除 demo2
    myInitializer.remove('demo2');
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin, MyPlugin2],
});

export default app.getRootComponent();
