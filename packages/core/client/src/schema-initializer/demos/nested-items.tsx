import React, { FC } from 'react';
import {
  Application,
  Plugin,
  SchemaInitializerV2,
  SchemaInitializerItemType,
  InitializerChildren,
  useApp,
} from '@nocobase/client';
import { Divider, Menu } from 'antd';

const ParentA: FC<{ children: SchemaInitializerItemType[] }> = ({ children }) => {
  return (
    <div>
      <div>parent</div>
      <Divider dashed />

      {/* 可以自行决定需要渲染效果 */}

      {/* 示例1：直接渲染 */}
      <div>直接渲染</div>
      {children.map((item) => React.createElement(item.Component, { key: item.name, ...item }))}

      <Divider dashed />

      {/* 等同于 */}
      <div>使用内置的 InitializerChildren</div>
      <InitializerChildren>{children}</InitializerChildren>

      <Divider dashed />

      {/* 示例2：渲染成列表 */}
      <div>渲染成列表</div>
      <ul>
        {children.map((item) => {
          return (
            <li key={item.name}>
              <div>name: {item.name}</div>
              {React.createElement(item.Component, { key: item.name, ...item })}
            </li>
          );
        })}
      </ul>
      <Divider dashed />

      {/* 示例3：渲染成 Menu 形式 */}
      <div>渲染成 Menu 形式 </div>
      <Menu items={children.map((item) => ({ key: item.name, label: React.createElement(item.Component, item) }))} />
    </div>
  );
};

const myInitializer = new SchemaInitializerV2({
  name: 'MyInitializer',
  designable: true,
  title: 'Button Text',
  items: [
    {
      name: 'a',
      Component: ParentA,
      children: [
        {
          name: 'a1',
          title: 'a1 title',
          onClick: () => {
            alert('test');
          },
          // 配置项的内容会被当做 props 传入到 Component 中
          Component: ({ title, onClick }) => <div onClick={onClick}>{title}</div>,
        },
        {
          name: 'a2',
          Component: () => <div>a2</div>,
        },
        {
          name: 'a3',
          Component: () => <div>a3</div>,
        },
      ],
    },
  ],
});

const Root = () => {
  const app = useApp();

  // 渲染 schema initializer
  const element = app.schemaInitializerManager.render('MyInitializer');
  return <div>{element}</div>;
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

class MyPlugin2 extends Plugin {
  async load() {
    const myInitializer = this.app.schemaInitializerManager.get('MyInitializer');

    // 嵌套添加
    myInitializer.add('a.a4', {
      Component: () => <div>a4</div>,
    });

    // 嵌套移除
    myInitializer.remove('a.a3');
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
