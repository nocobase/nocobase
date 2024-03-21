import React, { FC } from 'react';
import {
  Application,
  Plugin,
  SchemaInitializer,
  SchemaInitializerItemType,
  SchemaInitializerChildren,
  useSchemaInitializerItem,
  SchemaInitializerChild,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { Divider, Menu } from 'antd';

// TODO：这里要加上 Context
const ParentA: FC<{ children: SchemaInitializerItemType[] }> = ({ children }) => {
  return (
    <div>
      <div>parent</div>
      <Divider dashed />

      {/* 可以自行决定需要渲染效果 */}

      {/* 示例1：直接渲染 */}
      <div>直接渲染</div>
      {children.map((item) => (
        <SchemaInitializerChild key={item.name} {...item}></SchemaInitializerChild>
      ))}

      <Divider dashed />

      {/* 等同于 */}
      <div>使用内置的 SchemaInitializerChildren</div>
      <SchemaInitializerChildren>{children}</SchemaInitializerChildren>

      <Divider dashed />

      {/* 示例2：渲染成列表 */}
      <div>渲染成列表</div>
      <ul>
        {children.map((item) => {
          return (
            <li key={item.name}>
              <div>name: {item.name}</div>
              <SchemaInitializerChild key={item.name} {...item}></SchemaInitializerChild>
            </li>
          );
        })}
      </ul>
      <Divider dashed />

      {/* 示例3：渲染成 Menu 形式 */}
      <div>渲染成 Menu 形式 </div>
      <Menu
        items={children.map((item) => ({
          key: item.name,
          label: <SchemaInitializerChild key={item.name} {...item}></SchemaInitializerChild>,
        }))}
      />
    </div>
  );
};

// 配置项的内容会被当做 props 传入到 Component 中
// TODO: 重新完善  demo
const Demo = () => {
  const itemConfig = useSchemaInitializerItem();
  const { onClick, title } = itemConfig;
  return <div onClick={onClick}>{title}</div>;
};

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
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
          Component: Demo,
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

class MyPlugin2 extends Plugin {
  async load() {
    const myInitializer = this.app.schemaInitializerManager.get('myInitializer');

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
