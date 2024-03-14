import {
  Application,
  Plugin,
  SchemaComponentPlugin,
  SchemaInitializer,
  useSchemaInitializerRender,
} from '@nocobase/client';
import React from 'react';

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  designable: true,
  title: 'Button Text',
  items: [
    {
      name: 'a',
      type: 'itemGroup', // 渲染成类似 MenuGroup 的样式
      title: 'Group a', // group 标题
      children: [
        {
          name: 'a1',
          type: 'item', // 渲染成 Div + title 的组件
          title: 'A 1',
          // 其他属性
          onClick: () => {
            alert('a-1');
          },
        },
        {
          name: 'a2',
          type: 'item',
          title: 'A 2',
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider', //  会渲染成分割线
    },
    {
      name: 'b',
      type: 'subMenu', // 会渲染成 带 Children 的 Menu 组件
      title: 'Group B',
      children: [
        {
          name: 'b1',
          type: 'item',
          title: 'B 1',
          onClick: () => {
            alert('b-1');
          },
        },
        {
          name: 'b2',
          type: 'item',
          title: 'B 2',
        },
      ],
    },
  ],
});

const Root = () => {
  const { render } = useSchemaInitializerRender('myInitializer');
  return <div>{render()}</div>;
};

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(myInitializer);
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin, SchemaComponentPlugin],
});

export default app.getRootComponent();
