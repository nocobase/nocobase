---
title: Drawer - 抽屉
nav:
  title: 组件
  path: /client
group:
  order: 3
  title: 其他
  path: /client/others
---

# Drawer - 抽屉

通过 `Drawer.open(props)` 方法打开抽屉，无需预渲染，可在触发事件中使用。

### 基础抽屉

```tsx
/**
 * title: 基础抽屉
 */
import React from 'react';
import { Button } from 'antd';
import Drawer from './index.tsx';

export default () => (
  <Button onClick={() => {
    Drawer.open({
      title: 'Basic Drawer',
      content: () => {
        return (
          <div>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </div>
        )
      },
    });
  }}>Open Drawer</Button>
);
```

### 多层抽屉

```tsx
/**
 * title: 多层抽屉
 * desc: 有多少层就执行多少个 `Drawer.open(props)`
 */
import React from 'react';
import { Button } from 'antd';
import Drawer from './index.tsx';

export default () => (
  <Button onClick={() => {
    Drawer.open({
      title: 'Multi-level drawer',
      content: () => {
        return (
          <div>
            <Button onClick={() => {
              Drawer.open({
                title: 'Two-level Drawer',
                content: () => {
                  return (
                    <div>This is two-level drawer</div>
                  )
                },
              });
            }}>Two-level Drawer</Button>
          </div>
        )
      },
    });
  }}>Open drawer</Button>
);
```

### 关闭时提示

```tsx
/**
 * title: 关闭时提示
 * desc: 通过 `closeWithConfirm(props)` 方法触发，更多参数请参考 `Modal.confirm`
 */
import React from 'react';
import { Button } from 'antd';
import Drawer from './index.tsx';

export default () => (
  <Button onClick={() => {
    Drawer.open({
      title: 'Basic Drawer',
      content: ({ closeWithConfirm }) => {
        closeWithConfirm({
          title: '您确定关闭抽屉吗？'
        });
        return (
          <div>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </div>
        )
      },
    });
  }}>Open Drawer</Button>
);
```
