---
title: Tabs - 标签页
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Components - 组件
  path: /client/components
---

# Tabs - 标签页

## 代码演示

### 基本使用

```tsx
/**
 * title: 基本使用
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    tabs: {
      type: 'void',
      'x-component': 'Tabs',
      properties: {
        tab1: {
          type: 'void',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab1',
          },
          properties: {
            aaa: {
              type: 'string',
              title: 'AAA',
              'x-decorator': 'FormItem',
              required: true,
              'x-component': 'Input',
            },
          },
        },
        tab2: {
          type: 'void',
          'x-component': 'Tabs.TabPane',
          'x-component-props': {
            tab: 'Tab2',
          },
          properties: {
            bbb: {
              type: 'string',
              title: 'BBB',
              'x-decorator': 'FormItem',
              required: true,
              'x-component': 'Input',
            },
          },
        },
      },
    },
  }
}

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```
