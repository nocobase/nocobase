# SchemaToolbar

![SchemaToolbar](../static/designer.png)

## 组件

### SchemaToolbar

SchemaToolbar 工具栏部分，其内部会自动根据 Schema 渲染 `SchemaSettings`、`SchemaInitializer` 和 `Drag` 组件。

- 类型

```tsx | pure
interface SchemaToolbarProps {
  title?: string;
  draggable?: boolean;
  initializer?: string | false;
  settings?: string | false;
}
```

- 详细解释
  - `title`：左上角的标题
  - `draggable`：是否可以拖拽，默认为 `true`
  - `initializer`：`SchemaInitializer` 的默认值，当 schema 里没有 `x-initializer` 时，会使用此值；当为 `false` 时，不会渲染 `SchemaInitializer`
  - `settings`：`SchemaSettings` 的默认值，当 schema 里没有 `x-settings` 时，会使用此值；当为 `false` 时，不会渲染 `SchemaSettings`

在 schema 协议中，`x-toolbar` 是可以缺省的，当缺省时就是使用的默认的 `SchemaToolbar` 组件，默认的情况下，会显示 `settings`、`initializer` 和 `Drag` 组件。

```tsx
import { useFieldSchema } from '@formily/react';
import {
  Application,
  CardItem,
  Grid,
  Plugin,
  SchemaComponent,
  SchemaInitializer,
  SchemaInitializerItem,
  SchemaSettings,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
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
  name: 'MyInitializer',
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

const Hello = () => {
  const schema = useFieldSchema();
  return <h1>Hello, world! {schema.name}</h1>;
};

const hello1 = Grid.wrap({
  type: 'void',
  'x-settings': 'mySettings',
  'x-decorator': 'CardItem',
  'x-component': 'Hello',
});

const HelloPage = () => {
  return (
    <div>
      <SchemaComponent
        schema={{
          name: 'root',
          type: 'void',
          'x-component': 'Grid',
          'x-initializer': 'MyInitializer',
          properties: {
            hello1,
          },
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
```

### SchemaToolbarProvider  & useSchemaToolbar()

当 `SchemaInitializer` 或者 `SchemaSettings` 的子项里需要使用到 Designer 的上下文，可以使用此组件爱你进行传递，并配合 `useSchemaToolbar()` 获取。

```tsx | pure
const MyToolbar = () => {
  return (<SchemaToolbarProvider foo={'bar'}>
      <SchemaToolbar title="Test"  />
    </SchemaToolbarProvider>);
}


const HelloSettingItem = () => {
  const { foo } = useSchemaToolbar();
  return <SchemaSettingsItem title={foo}></SchemaSettingsItem>;
}

const helloSettings = new SchemaSettings({
  name: 'HelloSettings',
  items: [
    {
      name: 'remove',
      Component: HelloSettingItem
    },
  ],
});
```
