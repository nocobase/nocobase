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

与 Ant Design

### 基础抽屉

```tsx
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
