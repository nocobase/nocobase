---
title: Menu - 菜单
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# Menu - 菜单

需要 antd v4.16+ 支持，在此之前的 Menu.Item 不支持 Fragment 包裹。

## 代码演示

### 横向菜单

```tsx
/**
 * title: 横向菜单
 */
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      'x-component': 'Menu',
      // 'x-decorator': 'Menu.Designable',
      'x-component-props': {
        mode: 'horizontal',
      },
      properties: {
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-component': 'Menu.Item',
        },
        item2: {
          type: 'void',
          title: `菜单2`,
          'x-component': 'Menu.Item',
        },
        item3: {
          type: 'void',
          title: '菜单组',
          'x-component': 'Menu.SubMenu',
          properties: {
            item4: {
              type: 'void',
              title: `子菜单1`,
              'x-component': 'Menu.Item',
            },
          }
        },
      },
    }
  }
};

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```

### 竖向菜单

```tsx
/**
 * title: 竖向菜单
 */
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'object',
  properties: {
    menu1: {
      type: 'void',
      name: 'name1',
      'x-component': 'Menu',
      // 'x-decorator': 'Menu.Designable',
      'x-component-props': {
        mode: 'inline',
      },
      properties: {
        item3: {
          type: 'void',
          title: '菜单组',
          'x-component': 'Menu.SubMenu',
          properties: {
            item4: {
              type: 'void',
              title: `子菜单1`,
              'x-component': 'Menu.Item',
            },
            item5: {
              type: 'void',
              title: `子菜单2`,
              'x-component': 'Menu.Item',
            },
          }
        },
        item1: {
          type: 'void',
          title: `菜单1`,
          'x-component': 'Menu.Item',
        },
        item2: {
          type: 'void',
          title: `菜单2`,
          'x-component': 'Menu.Item',
        },
      },
    },
  },
}

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```