# SchemaToolbar

![SchemaToolbar](../static/designer.png)

## 组件

### SchemaToolbar 组件

此为默认的 Toolbar 组件，其内部会自动根据 Schema 的 `x-settings`、`x-initializer` 渲染 `SchemaSettings`、`SchemaInitializer` 和 `Drag` 组件。

Toolbar 具体的渲染规则为：当有 `x-toolbar` 会渲染对应的组件；当无 `x-toolbar` 但是有 `x-settings`、`x-initializer` 会渲染默认的 `SchemaToolbar` 组件。

- 类型

```tsx | pure
interface SchemaToolbarProps {
  title?: string;
  draggable?: boolean;
  initializer?: string | false;
  settings?: string | false;
  /**
   * @default true
   */
  showBorder?: boolean;
  showBackground?: boolean;
}
```

- 详细解释
  - `title`：左上角的标题
  - `draggable`：是否可以拖拽，默认为 `true`
  - `initializer`：`SchemaInitializer` 的默认值，当 schema 里没有 `x-initializer` 时，会使用此值；当为 `false` 时，不会渲染 `SchemaInitializer`
  - `settings`：`SchemaSettings` 的默认值，当 schema 里没有 `x-settings` 时，会使用此值；当为 `false` 时，不会渲染 `SchemaSettings`
  - `showBorder`：边框是否变为橘色
  - `showBackground`：背景是否变为橘色

- 示例

未指定 `x-toolbar` 时会渲染默认的 `SchemaToolbar` 这个组件。

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
  title: 'Button Text',
  wrap: Grid.wrap,
  items: [
    {
      name: 'demo1',
      title: 'Demo1',
      Component: () => {
        const itemConfig = useSchemaInitializerItem();
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
  // 仅指定了 `x-settings` 但是没有 `x-toolbar`，会使用默认的 `SchemaToolbar` 组件
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

自定义 Toolbar 组件。


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
  SchemaToolbar,
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

const MyToolbar = () => {
  return <SchemaToolbar showBackground title='Test' />
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  wrap: Grid.wrap,
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
            // 使用自定义的 Toolbar 组件
            'x-toolbar': 'MyToolbar',
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
  // 使用自定义的 Toolbar 组件
  'x-toolbar': 'MyToolbar',
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
    this.app.addComponents({ Grid, CardItem, Hello, MyToolbar });
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

## Hooks

### useSchemaToolbarRender()

用于渲染 `SchemaToolbar`。

- 类型

```tsx | pure
const useSchemaToolbarRender: (fieldSchema: ISchema) => {
    render(props?: SchemaToolbarProps): React.JSX.Element;
    exists: boolean;
}
```

- 详细解释

前面示例中 `'x-decorator': 'CardItem'` 中组件 `CardItem` 里面就调用了 `useSchemaToolbarRender()` 进行渲染。内置的组件还有：`BlockItem`、`CardItem`、`Action`、`FormItem`。

`render()` 支持二次覆盖组件属性。

- 示例

```tsx | pure
const MyDecorator = () => {
  const filedSchema = useFieldSchema();
  const { render } = useSchemaToolbarRender(filedSchema); // 从 Schema 中读取 Toolbar 组件

  return <Card>{ render() }</Card>
}
```


```tsx
import { Card } from 'antd';
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
  SchemaToolbar,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useSchemaToolbarRender
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

const MyToolbar = (props) => {
  return <SchemaToolbar showBackground title='Test' {...props} />
}

// 自定义包装器
const MyDecorator = ({children}) => {
  const filedSchema = useFieldSchema();
  // 使用 `useSchemaToolbarRender()` 获取并渲染内容
  const { render } = useSchemaToolbarRender(filedSchema);
  return <Card style={{ marginBottom: 10 }}>{ render({ draggable: false }) }{children}</Card>
}

const myInitializer = new SchemaInitializer({
  name: 'MyInitializer',
  title: 'Button Text',
  wrap: Grid.wrap,
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
            // 使用自定义的 Toolbar 组件
            'x-toolbar': 'MyToolbar',
            'x-settings': 'mySettings',
            'x-decorator': 'MyDecorator',
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
  // 使用自定义的 Toolbar 组件
  'x-toolbar': 'MyToolbar',
  'x-settings': 'mySettings',
  'x-decorator': 'MyDecorator',
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
    this.app.addComponents({ Grid, CardItem, Hello, MyToolbar, MyDecorator });
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
