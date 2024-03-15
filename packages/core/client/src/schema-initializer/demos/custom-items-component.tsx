import React, { FC } from 'react';
import {
  Application,
  Plugin,
  SchemaInitializer,
  SchemaInitializerItemsProps,
  useSchemaInitializerRender,
} from '@nocobase/client';
import { ButtonProps, Card, Divider, List, ListProps, Menu, MenuProps } from 'antd';

// 自定义 Items 渲染为 Menu
const CustomItemsMenu: FC<SchemaInitializerItemsProps<ButtonProps, Omit<MenuProps, 'items'>>> = (props) => {
  const { items, options, ...others } = props;
  return (
    <Menu
      {...others}
      items={items.map((item) => ({ key: item.name, label: item.title, onClick: item.onClick }))}
    ></Menu>
  );
};

const CustomListGridMenu: FC<SchemaInitializerItemsProps<ButtonProps, ListProps<any>>> = (props) => {
  const { items, options, ...others } = props;
  return (
    <List
      {...others}
      dataSource={items}
      grid={{ gutter: 16, column: 2 }}
      renderItem={(item) => (
        <List.Item>
          <Card title={item.title} onClick={item.onClick}>
            {item.name} - {item.title}
          </Card>
        </List.Item>
      )}
    ></List>
  );
};

const myInitializer = new SchemaInitializer({
  name: 'myInitializer',
  designable: true,
  title: 'Button Text',
  ItemsComponent: CustomItemsMenu,
  items: [
    {
      name: 'a',
      title: 'item a',
      onClick: () => {
        alert('a1');
      },
    },
    {
      name: 'b',
      title: 'item b',
    },
  ],
});

const Root = () => {
  const { exists, render } = useSchemaInitializerRender('myInitializer');
  if (!exists) return null;
  return (
    <div>
      <div>渲染为 Menu</div>
      {render()}
      <Divider />
      <div>渲染为 List Grid</div>
      {render({ ItemsComponent: CustomListGridMenu, itemsComponentStyle: { width: 300 } })}
    </div>
  );
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
  plugins: [MyPlugin],
});

export default app.getRootComponent();
