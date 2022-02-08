---
nav:
  path: /client
group:
  path: /client
---

# SchemaInitializer

用于配置各种 schema 的初始化

## SchemaInitializer.Button

常规区块的初始化按钮

```tsx | pure
const items = [
  {
    title: 'Data blocks',
    children: [
      {
        title: 'Table',
        component: 'TableBlockInitializerItem',
      },
      {
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
      key: field.name,
      component: 'FormItemInitializerItem'
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

扩展项

```tsx | pure
const TableBlockInitializerItem = (props) => {
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
