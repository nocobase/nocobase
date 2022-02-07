---
nav:
  path: /client
group:
  path: /client
---

# SchemaInitializer

用于配置各种 schema 的初始化

## SchemaInitializerProvider

```tsx | pure
<SchemaInitializerProvider
  shortcuts={{
    Block: [
      {
        title: 'Data blocks',
        children: [
          {
            title: 'Table',
            component: 'TableBlockInitializer',
          },
          {
            title: 'Form',
            component: 'FormBlockInitializer',
          },
        ],
      },
    ]
  }}
></SchemaInitializerProvider>
```

目前可能需要配置 shortcuts 的有：

```ts
const shortcuts = {
  // 表单可选操作
  FormAction: [],
  // 抽屉表单可选操作
  DrawerFormAction: [],
  // 对话框表单可选操作
  ModalFormAction: [],
  // 详情区块可选操作
  DetailsAction: [],
  // 表格区块可选操作
  TableAction: [],
  // 表格行可选操作
  TableRowAction: [],
  // 日历可选操作
  CalendarAction: [],
  // 普通页面可添加区块
  Block: [],
  // 当前数据页面可添加区块
  RecordBlock: [],
  // 可添加的表单项
  FormItem: [],
  // 可添加的表格列
  TableColumn: [],
};
```

## SchemaInitializer.Button

常规区块的初始化按钮

```tsx | pure
<SchemaInitializer.Button
  // 待插入的节点，wrap 处理
  wrap={(schema) => schema}
  // 插入位置
  insertPosition={'beforeBegin'}
  // 从上下文获取 shortcuts 里配置的 items
  shortcut={'Block'}
  items={[
    {
      title: 'Data blocks',
      children: [
        {
          title: 'Table',
          component: 'TableBlockInitializer',
        },
        {
          title: 'Form',
          component: 'FormBlockInitializer',
        },
      ],
    },
  ]}
>Create block</SchemaInitializer.Button>
```

动态字段的配置

```tsx | pure
const useFormItemInitializerFields = () => {
  const { fields } = useCollection();
  return fields.map(field => {
    return {
      key: field.name,
      component: 'FormItemInitializer'
    }
  });
}

<SchemaInitializer.Button
  // 待插入的节点，wrap 处理
  wrap={(schema) => schema}
  // 插入位置
  insertPosition={'beforeBegin'}
  // 从上下文获取 shortcuts 里配置的 items
  shortcut={'Block'}
  items={[
    {
      title: 'Display fields',
      children: useFormItemInitializerFields(),
    },
  ]}
>Configure fields</SchemaInitializer.Button>
```

## SchemaInitializer.Item

扩展项

```tsx | pure
const TableBlockInitializer = (props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={(info) => {
        console.log({ info });
        insert({
          type: 'void',
          title: info.key,
          'x-component': 'Hello',
        });
      }}
      items={[
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: [
            {
              key: 'users',
              title: 'Users',
            },
            {
              key: 'posts',
              title: 'Posts',
            },
          ],
        },
      ]}
    >
      Table
    </SchemaInitializer.Item>
  );
};
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
