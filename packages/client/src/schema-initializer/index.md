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

SchemaInitializer 的核心包括 `<SchemaInitializer.Button/>` 和 `<SchemaInitializer.Item/>` 两个组件。`<SchemaInitializer.Button/>` 是用于创建 Schema 的 Dropdown 按钮，按钮有上下文，表示新增的 schema 要插入的位置，可以通过 `insertPosition` 属性来指定插入的具体位置。下拉菜单里的为 `<SchemaInitializer.Item/>`，用于自定义各种 schema 的初始化逻辑，schema 可以是区块、字段、操作等。

## SchemaInitializer.Button

常规区块的初始化按钮

```tsx | pure
const items = [
  {
    type: 'itemGroup',
    title: 'Data blocks',
    children: [
      {
        type: 'item',
        title: 'Table',
        component: 'TableBlockInitializerItem',
      },
      {
        type: 'item',
        title: 'Form',
        component: 'FormBlockInitializerItem',
      },
    ],
  },
];

export const AddBlockButton = () => {
  return (
    <SchemaInitializer.Button
      // 待插入的节点，wrap 处理
      wrap={(schema) => schema}
      // 插入位置
      insertPosition={'beforeBegin'}
      // 菜单项
      items={items}
    >Create block</SchemaInitializer.Button>
  );
}
```

动态字段的配置

```tsx | pure
const useFormItemInitializerFields = () => {
  const { fields } = useCollection();
  return fields.map(field => {
    return {
      type: 'item',
      component: 'FormItemInitializerItem',
      schema: {}, // TODO, 例如从 field.uiSchema 里获取
    }
  });
}

export const AddFieldButton = () => {
  return (
    <SchemaInitializer.Button
      // 待插入的节点，wrap 处理
      wrap={(schema) => schema}
      // 插入位置
      insertPosition={'beforeBegin'}
      items={[
        {
          title: 'Display fields',
          children: useFormItemInitializerFields(),
        },
      ]}
    >Configure fields</SchemaInitializer.Button>
  )
}
```

## SchemaInitializer.Item

用于自定义各种 schema 的初始化逻辑，配合 `SchemaInitializer.itemWrap()` 可获得更好的类型提示。

`<SchemaInitializer.Button/>` 的下拉菜单项，items 属性里 type 为 item 的 component）：

```ts
{
  type: 'item',
  title: 'Table',
  component: 'TableBlockInitializerItem',
}
```

例子如下：

```tsx | pure
const TableBlockInitializerItem = SchemaInitializer.itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={() => {
        // 插入的 schema，在这里补充更完整的逻辑
        insert({
          type: 'void',
          'x-component': 'Table',
        });
      }}
    >
      Table
    </SchemaInitializer.Item>
  );
});
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

## 配置

核心的参数

```tsx | pure
const initializers = {
  xxx: {
    title: '{{t("Add block")}}',
    insertPosition: 'beforeEnd',
    items: [], // 在这里配置
  },
};

<SchemaInitializerProvider initializers={initializers}>
  {/* children */}
</SchemaInitializerProvider>
```

items 例子：

- Initializer.Item 只有添加的逻辑
- Initializer.SwitchItem 可以添加或移除

```ts
{
  BlockInitializer: {
    insertPosition: 'beforeEnd',
    items: [
      {
        type: 'itemGroup',
        title: "{{t('Enable actions')}}",
        children: [
          {
            type: 'item',
            title: "{{t('Tody')}}",
            component: 'Initializer.SwitchItem',
            schema: {
              title: "{{t('Tody')}}",
              'x-component': 'Calendar.Today',
              'x-action': `calendar:today`,
              'x-align': 'left',
            },
          },
          {
            type: 'item',
            title: "{{t('Tody')}}",
            component: 'Initializer.Item',
            schema: {
              title: "{{t('Tody')}}",
              'x-component': 'Calendar.Today',
              'x-action': `calendar:today`,
              'x-align': 'left',
            },
          },
        ],
      },
    ],
  },
}
```

内置的 Initializer 有：

- `GeneralInitializer` 通用的配置项，只有插入的逻辑
- `ActionInitializer` 用于配置操作按钮，有插入和移除的逻辑
- `CollectionFieldInitializer` 用于配置数据表字段，有插入和移除的逻辑
