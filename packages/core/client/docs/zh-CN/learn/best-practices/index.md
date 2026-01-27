## FlowModel 并不改变组件的使用方式，而是提供一种便捷的 Props 的维护方法

例如以下示例

```tsx | pure
import React from 'react';
import { Card } from 'antd';

const MyCard: React.FC = () => (
  <Card title="Default size card" extra={<a href="#">More</a>} style={{ width: 300 }}>
    <p>Card content</p>
    <p>Card content</p>
    <p>Card content</p>
  </Card>
);

export default MyCard;
```

改造为 FlowModel 的方式是这样的

```tsx | pure
class MyCardModel extends FlowModel {
  render() {
    return (
      <Card title="Default size card" extra={<a href="#">More</a>} style={{ width: 300 }}>
        <p>Card content</p>
        <p>Card content</p>
        <p>Card content</p>
      </Card>
    );
  }
}
```

如果希望 Card 的 Props 可以被动态的管理，只需要注册一个 Flow 用于配置 Props。