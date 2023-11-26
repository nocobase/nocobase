# Designer

![Designer](../static/designer.png)

## 组件

### SchemaDesignerToolbar

Designer 工具栏部分，其内部会自动根据 Schema 渲染 `SchemaSettings`、`SchemaInitializer` 和 `Drag` 组件。

- 类型

```tsx | pure
interface SchemaDesignerToolbarProps {
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

```tsx
import { Application, CardItem, Grid, SchemaSettings, SchemaComponent } from '@nocobase/client';

const MyToolbar = () => {
  return (
    <SchemaDesignerToolbar title="Test"  />
  );
}

const helloSettings = new SchemaSettings({
  name: 'HelloSettings',
  items: [
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});

const Root = () => {
  const schema = {
    type: 'void',
    'x-component': 'CardItem',
    'x-settings': 'HelloSettings',
    'x-toolbar': 'MyToolbar',
    properties: {
      hello: {
        type: 'void',
        'x-component': 'div',
        'x-content': 'Hello World',
      },
    },
  }
  return <SchemaComponent schema={schema} />;
}

const app = new Application({
  schemaSettings: [helloSettings],
  providers: [Root],
  components: { CardItem, Grid, MyToolbar },
  designable: true,
});

export default app.getRootComponent();
```

### SchemaDesignerProvider  & useSchemaDesigner()

当 `SchemaInitializer` 或者 `SchemaSettings` 的子项里需要使用到 Designer 的上下文，可以使用此组件爱你进行传递，并配合 `useSchemaDesigner()` 获取。

```tsx | pure
const MyToolbar = () => {
  return (<SchemaDesignerProvider foo={'bar'}>
      <SchemaDesignerToolbar title="Test"  />
    </SchemaDesignerProvider>);
}


const HelloSettingItem = () => {
  const { foo } = useSchemaDesigner();
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
