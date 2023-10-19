---
group:
  title: Client
  order: 1
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

## Examples

### Basic

<code src="./demos/basic.tsx"></code>

### Nested items

<code src="./demos/nested-items.tsx"></code>

### Custom Items Component

列表默认使用 `List` 组件，可以通过 `ItemsComponent` 属性自定义列表组件。

<code src="./demos/custom-items-component.tsx"></code>

### Custom Button

<code src="./demos/custom-button.tsx"></code>

### Built Type

NocoBase 提供了几个内置的组件，可以直接使用。

<code src="./demos/build-type.tsx"></code>

### Dynamic visible & children

动态显示和隐藏 Item 项，以及动态加载 children。

<code src="./demos/dynamic-visible-children.tsx"></code>

### Insert schema

#### Basic

<code src="./demos/insert-schema-basic.tsx"></code>

#### Action

<code src="./demos/insert-schema-action.tsx"></code>

#### FormItem

<code src="./demos/insert-schema-form-item.tsx"></code>
