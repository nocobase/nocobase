# ActionInitializerItem

## 介绍

这个是基于 `SchemaInitializerItem` 进行封装的一个组件，用于快捷创建一个操作按钮。

## 用法

### Props 类型

```typescript | pure
interface ActionInitializerItemProps {
  /**
   * 被创建的操作按钮的 schema
   */
  schema?: ISchema;
}
```

### 使用示例

下面我们实现一个简单的用于添加一个操作按钮的选项：

```tsx | pure
const SimpleButton = (props) => {
  const schema = {
    title: 'SimpleButton',
    'x-component': 'Action',
  };
  return <ActionInitializerItem {...props} schema={schema} />;
};
```

然后把它添加到一个 SchemaInitializer 实例中：

```tsx
import { ActionInitializerItem, Action } from '@nocobase/client';
import app from '../demos/schema-initializer-common';

const SimpleButton = (props) => {
  const schema = {
    title: 'SimpleButton',
    'x-component': 'Action',
  };
  return <ActionInitializerItem {...props} schema={schema} />;
};

app.addComponents({
  Action,
});

// 1. 先获取名为 myInitializer 的 SchemaInitializer 实例
// 2. 然后调用 add 方法，将 SimpleButton 添加到 myInitializer 实例中
app.schemaInitializerManager.get('myInitializer').add('simpleButton', {
  title: 'SimpleButton',
  Component: SimpleButton,
});

export default app.getRootComponent();
```
