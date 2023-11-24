# v0.15

## 不兼容的变化

### SchemaInitializer 的注册和实现变更

#### 定义方式变更

以前 `SchemaInitializer` 支持 2 种定义方式，分别为对象和组件。例如：

```tsx
const BlockInitializers = {
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    // ...
  ],
  // ...
}
```

```tsx
const BlockInitializers = () => {
  return <SchemaInitializer.Button
    title={'{{t("Add block")}}'}
    icon={'PlusOutlined'}
    items={[
      // ...
    ]}
    // ...
  />
}
```

现在仅支持 `new SchemaInitializer()` 的实例。例如：

```tsx
const blockInitializers = new SchemaInitializer({
  name: 'BlockInitializers', // 名称，和原来保持一致
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    // ...
  ],
  // ...
});
```

#### 参数变更

整体来说，`new SchemaInitializer()` 的参数参考了之前对象定义方式，但又有新的变更。具体如下：

- 新增 `name` 必填参数，用于 `x-initializer` 的值。
- 新增 `Component` 参数，用于定制化渲染的按钮。默认为 `SchemaInitializerButton`。
- 新增 `componentProps`、`style` 用于配置 `Component` 的属性和样式。
- 新增 `ItemsComponent` 参数，用于定制化渲染的列表。默认为 `SchemaInitializerItems`。
- 新增 `itemsComponentProps`、`itemsComponentStyle` 用于配置 `ItemsComponent` 的属性和样式。
- 新增 `popover` 参数，用于配置是否显示 `popover` 效果。
- 新增 `useInsert` 参数，用于当 `insert` 函数需要使用 hooks 时。
- 更改 将 `dropdown` 参数改为了 `popoverProps`，使用 `Popover` 代替了 `Dropdown`。
- items 参数变更
  - 新增 `useChildren` 函数，用于动态控制子项。
  - 更改 `visible` 参数改为了 `useVisible` 函数，用于动态控制是否显示。
  - 更改 将 `component` 参数改为了 `Component`，用于列表项的渲染。
  - 更改 将 `key` 参数改为了 `name`，用于列表项的唯一标识。

案例1：

```diff
- export const BlockInitializers = {
+ export const blockInitializers = new SchemaInitializer({
+ name: 'BlockInitializers',
  'data-testid': 'add-block-button-in-page',
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
   items: [
    {
-     key: 'dataBlocks',
+     name: 'data-blocks',
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: [
        {
-         key: 'table',
+         name: 'table',
-         type: 'item', // 当有 Component 参数时，就不需要此了
          title: '{{t("Table")}}',
-         component: TableBlockInitializer,
+         Component: TableBlockInitializer,
        },
         {
          key: 'form',
          type: 'item',
          title: '{{t("Form")}}',
          component: FormBlockInitializer,
        }
      ],
    },
  ],
});
```

案例2：

原来是组件定义的方式：

```tsx
export const BulkEditFormItemInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component } = props;
  const associationFields = useAssociatedFormItemInitializerFields({ readPretty: true, block: 'Form' });
  return (
    <SchemaInitializer.Button
      data-testid="configure-fields-button-of-bulk-edit-form-item"
      wrap={gridRowColWrap}
      icon={'SettingOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: t('Display fields'),
          children: useCustomBulkEditFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: t('Add text'),
          component: BlockItemInitializer,
        },
      ]}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Configure fields')}
    />
  );
};
```

现在需要改为 `new SchemaInitializer()` 的方式：

```tsx
const bulkEditFormItemInitializers = new SchemaInitializer({
  name: 'BulkEditFormItemInitializers',
  'data-testid': 'configure-fields-button-of-bulk-edit-form-item',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  // 原 insertPosition 和 component 是透传的，这里不用管，也是透传的
  items: [
    {
      type: 'itemGroup',
      title: t('Display fields'),
      name: 'display-fields', // 记得加上 name
      useChildren: useCustomBulkEditFormItemInitializerFields, // 使用到了 useChildren
    },
    {
      type: 'divider',
    },
    {
      title: t('Add text'),
      name: 'add-text',
      Component: BlockItemInitializer, // component 替换为 Component
    },
  ]
});
```

关于参数的具体说明可以参考 `SchemaInitializer` 的类型定义，以及 [SchemaInitializer 文档](https://client.docs.nocobase.com/client/schema-initializer)。

#### 实现原理变更

以前是将所有 `items` 转为 `Menu` 组件的 items JSON 对象，最后渲染成 Menu 列表。

现在默认情况下仅仅是渲染 `items` 列表项的 `Component` 组件，至于 `Component` 组件内部如何渲染取决于自身，最后也不会拼接成一个 JSON 对象。

具体说明参考 `SchemaInitializer` 的 [Nested items 示例](https://client.docs.nocobase.com/client/schema-initializer#nested-items)。

#### 列表中的组件获取参数方式变更

之前是通过 `props` 获取 `insert` 函数，现在需要通过 `useSchemaInitializer()` 获取。例如：

```diff
const FormBlockInitializer = (props) => {
-  const { insert } = props;
+  const { insert } = useSchemaInitializer();
 // ...
}

export const blockInitializers = new SchemaInitializer({
 name: 'BlockInitializers',
 items: [
  {
    name: 'form',
    Component: FormBlockInitializer
  }
 ]
});
```

#### 注册方式变更

以前是通过 `SchemaInitializerProvider` 进行注册。例如：

```tsx
<SchemaInitializerProvider
  initializers={{ BlockInitializers }}
  components={{ ManualActionDesigner }}
></SchemaInitializerProvider>
```

现在需要改为插件的方式。例如：

```tsx
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(blockInitializers);
    this.app.addComponents({ ManualActionDesigner });
  }
}
```

#### 修改方式变更

以前是通过 `SchemaInitializerContext` 获取到全部的 `Initializers` 然后进行增删改。例如下面代码是为了往 `BlockInitializers` 中的 `media` 下添加 `Hello`：

```tsx
const items = useContext<any>(SchemaInitializerContext);
const mediaItems = items.BlockInitializers.items.find((item) => item.key === 'media');

if (process.env.NODE_ENV !== 'production' && !mediaItems) {
  throw new Error('media block initializer not found');
}

const children = mediaItems.children;
if (!children.find((item) => item.key === 'hello')) {
  children.push({
    key: 'hello',
    type: 'item',
    title: '{{t("Hello block")}}',
    component: HelloBlockInitializer,
  });
}
```

新的方式则通过插件的方式更简洁的进行修改。例如：

```tsx
class MyPlugin extends Plugin {
  async load() {
    // 获取 BlockInitializers
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');

    // 添加 Hello
    blockInitializers.add('media.hello', {
      title: '{{t("Hello block")}}',
      Component: HelloBlockInitializer,
    })
  }
}
```

#### 使用方式变更

之前使用 `useSchemaInitializer` 的方式进行渲染，现在需要改为 `useSchemaInitializerRender`，并且参数需要增加 `x-initializer-props`。例如：

```diff
- const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
+ const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);

render();
render({ style: { marginLeft: 8 } })
```


更多说明可以参考 [SchemaInitializer 文档](https://client.docs.nocobase.com/client/schema-initializer)。
