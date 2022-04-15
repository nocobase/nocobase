---
nav:
  path: /client
group:
  path: /client
---

# SchemaInitializer

用于各种 schema 的初始化。新增的 schema 可以插入到某个已有 schema 节点的任意位置，包括：

```ts
{
  properties: {
    // beforeBegin 在当前节点的前面插入
    node1: {
      properties: {
        // afterBegin 在当前节点的第一个子节点前面插入
        // ...
        // beforeEnd 在当前节点的最后一个子节点后面
      },
    },
    // afterEnd 在当前节点的后面
  },
}
```

SchemaInitializer 的核心包括 `<SchemaInitializer.Button/>` 和 `<SchemaInitializer.Item/>` 两个组件。`<SchemaInitializer.Button/>` 用于创建 Schema 的下拉菜单按钮，下拉菜单的菜单项为 `<SchemaInitializer.Item/>`。

SchemaInitializer.Item 用于实现各种初始化器（Initializer），负责各种 schema 的初始化逻辑，可以是区块、字段、操作等 schema 片段。目前内置的 Initializer 有：

- `ActionInitializer` 普通的 Action 操作按钮的初始化器
- `AddNewActionInitializer` 添加按钮的初始化器
- `CalendarBlockInitializer` 日历区块的初始化器
- `CollectionFieldInitializer` 字段的初始化器
- `FormBlockInitializer` 表单的初始化器
- `GeneralInitializer` 通用的初始化器
- `MarkdownBlockInitializer` Markdown 区块的初始化器
- `TableBlockInitializer` 表格区块的初始化器

SchemaInitializer.Button 用于将各种 Initializer 分组，以下拉菜单的方式呈现。内置的有：

- `BlockInitializers` 页面里的「添加区块」
- `CalendarActionInitializers` 日历的「操作配置」
- `DetailsActionInitializers` 详情的「操作配置」
- `FormActionInitializers` 普通表单的「操作配置」
- `GridFormItemInitializers` Grid 组件里「配置字段」
- `MenuItemInitializers` 菜单里「添加菜单项」
- `PopupFormActionInitializers` 弹窗表单的「操作配置」
- `RecordBlockInitializers` 当前行记录所在面板的「添加区块」
- `TableActionInitializers` 表格「操作配置」
- `TableColumnInitializers` 表格「列配置」
- `TableRecordActionInitializers` 表格当前行记录的「操作配置」

## 配置

```tsx | pure
const initializers = {
  // 可以是 SchemaInitializer.Button 的 props
  BlockInitializers: {
    title: 'Add new',
    items: [
      {
        type: 'itemGroup',
        title: 'Data blocks',
        children: [
          {
            type: 'item',
            title: 'Table',
            component: 'TableBlockInitializer',
          },
          {
            type: 'item',
            title: 'Form',
            component: 'FormBlockInitializer',
          },
        ],
      },
      {
        type: 'itemGroup',
        title: 'Media',
        children: [
          {
            type: 'item',
            title: 'Markdown',
            component: 'MarkdownBlockInitializer',
          },
        ],
      },
    ],
  },
  // 也可以是自定义的 SchemaInitializer.Button 组件
  CustomSchemaInitializerButton,
};

const CustomSchemaInitializerButton = () => {
  return <SchemaInitializer.Button title={'Add new'} items={[]}/>
}

<SchemaInitializerProvider initializers={initializers}>
  {/* children */}
</SchemaInitializerProvider>
```

## Examples

### Block

<code src="./demos/demo1.tsx" />

### Action

<code src="./demos/demo2.tsx" />

### FormItem

<code src="./demos/demo3.tsx" />

### Table.Column

<code src="./demos/demo4.tsx" />
