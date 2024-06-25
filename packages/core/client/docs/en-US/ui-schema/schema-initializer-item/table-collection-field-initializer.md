# TableCollectionFieldInitializer

## 介绍

这个是基于 `InitializerWithSwitch` 进行封装的一个组件，用于快捷创建一个表格的字段。

## 用法

### Props 类型

```typescript | pure
interface TableCollectionFieldInitializerProps {
  /**
   * 被创建的字段的 schema
   */
  schema?: ISchema;
}
```

### 使用示例

下面我们实现一个简单的用于添加一个字段的选项：

```tsx | pure
const SimpleField = (props) => {
  const schema = {
    title: 'SimpleField',
    'x-component': 'CollectionField',
  };
  return <TableCollectionFieldInitializer {...props} schema={schema} />;
};
```

然后把它添加到一个 SchemaInitializer 实例中：

```tsx
import { TableCollectionFieldInitializer, CollectionField } from '@nocobase/client';
import app from '../demos/schema-initializer-common';

const SimpleField = () => {
  const schema = {
    title: 'SimpleField',
    'x-component': 'CollectionField',
  };
  return <TableCollectionFieldInitializer schema={schema} />;
};

app.addComponents({
  CollectionField,
});

// 1. 先获取名为 myInitializer 的 SchemaInitializer 实例
// 2. 然后调用 add 方法，将 SimpleField 添加到 myInitializer 实例中
app.schemaInitializerManager.get('myInitializer').add('simpleField', {
  title: 'SimpleField',
  Component: SimpleField,
});

export default app.getRootComponent();
```
